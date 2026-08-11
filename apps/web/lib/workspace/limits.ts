import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

/**
 * What one visitor is allowed to spend.
 *
 * Every workspace is a sandbox somebody pays for by the second, and every agent
 * message is model tokens on top. `BRIK_MAX_WORKSPACES` was never a quota: it
 * counted what one Node process had started, so on a deployment with more than
 * one instance each instance counted its own and the real total was a multiple
 * of it. These limits live in Redis, so they hold across instances and survive
 * a restart.
 *
 * The store is the authority on two different questions. How many workspaces
 * are alive right now is a set scored by deadline, which prunes itself: a lease
 * whose release never arrived stops counting when its sandbox would have expired
 * anyway. How much a visitor has asked for lately is a counter per clock hour,
 * which is coarser than a sliding window and enough to stop a stranger looping
 * on the endpoint.
 */

/** Workspace starts per visitor per hour. */
const RUNS_PER_HOUR = Number(process.env.BRIK_RUNS_PER_HOUR ?? 5);
/** Agent turns per visitor per hour. Higher, because a conversation is the
 *  product and one message is far cheaper than one sandbox. */
const MESSAGES_PER_HOUR = Number(process.env.BRIK_MESSAGES_PER_HOUR ?? 30);
/** Live workspaces across the whole deployment. */
const MAX_WORKSPACES = Number(process.env.BRIK_MAX_WORKSPACES ?? 4);

/**
 * Which deployment a count belongs to.
 *
 * One Upstash database is shared by production, previews, and whatever a
 * developer has running, because they all read the same integration variables.
 * Without this a local `pnpm verify-templates` occupies production's workspace
 * slots, which is a very confusing way to take the site down.
 */
const NAMESPACE =
  process.env.BRIK_LIMITS_NAMESPACE ?? process.env.VERCEL_ENV ?? "local";

const LIVE_KEY = `brik:${NAMESPACE}:live`;
const HOUR_MS = 3_600_000;

/** Thrown when a limit says no. The message is written for a visitor. */
export class LimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitError";
  }
}

let client: Redis | null | undefined;

/**
 * The store, or null when none is configured.
 *
 * Vercel's Upstash integration supplies `KV_REST_API_*`; a standalone Upstash
 * database calls the same pair `UPSTASH_REDIS_REST_*`. Either is accepted so
 * the deployment does not depend on which route provisioned it.
 */
function store(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

/**
 * Whether limits can be enforced at all.
 *
 * In production the answer has to be yes: without a store there is no quota,
 * and a route that cannot count is a route that cannot say no. Locally there is
 * one developer and one machine, so the in-process counting the registry
 * already does is the honest amount of ceremony.
 */
export function limitsRequired(): boolean {
  return process.env.NODE_ENV === "production";
}

export function limitsConfigured(): boolean {
  return store() !== null;
}

/**
 * Who is asking, as a salted hash rather than an address.
 *
 * Vercel sets `x-forwarded-for`, and the leftmost entry is the client. The raw
 * value is never stored: it is only ever a key, and a hash works as well for
 * that as the address does.
 */
export function visitorOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const address =
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const salt = process.env.BRIK_VISITOR_SALT ?? "brik";
  return createHash("sha256").update(`${salt}:${address}`).digest("hex").slice(0, 24);
}

/** Fixed window per clock hour: increment, and set the expiry on the first hit. */
async function spend(
  redis: Redis,
  key: string,
  limit: number,
  refusal: string,
): Promise<void> {
  const bucket = Math.floor(Date.now() / HOUR_MS);
  const counter = `${key}:${bucket}`;
  const used = await redis.incr(counter);
  if (used === 1) await redis.expire(counter, 3600);
  if (used > limit) throw new LimitError(refusal);
}

function plural(count: number, thing: string): string {
  return `${count} ${thing}${count === 1 ? "" : "s"}`;
}

export async function spendRun(visitor: string): Promise<void> {
  const redis = store();
  if (!redis) return;
  await spend(
    redis,
    `brik:${NAMESPACE}:runs:${visitor}`,
    RUNS_PER_HOUR,
    `That is ${plural(RUNS_PER_HOUR, "workspace")} in an hour, which is the limit for now. It resets on the hour, and the one you have is still yours until then.`,
  );
}

/**
 * Give a run back.
 *
 * A visitor is charged before the sandbox is created, so a burst from one
 * person cannot all pass the check at once. That means a request the
 * deployment turned away for being full has already been charged, and someone
 * else's traffic would be eating this visitor's hour. Refunding keeps the
 * ordering and the fairness.
 */
export async function refundRun(visitor: string): Promise<void> {
  const redis = store();
  if (!redis) return;
  const bucket = Math.floor(Date.now() / HOUR_MS);
  await redis.decr(`brik:${NAMESPACE}:runs:${visitor}:${bucket}`);
}

export async function spendMessage(visitor: string): Promise<void> {
  const redis = store();
  if (!redis) return;
  await spend(
    redis,
    `brik:${NAMESPACE}:messages:${visitor}`,
    MESSAGES_PER_HOUR,
    `That is ${plural(MESSAGES_PER_HOUR, "request")} to the agent in an hour, which is the limit for now. It resets on the hour.`,
  );
}

/**
 * Take one of the deployment's workspace slots, or refuse.
 *
 * Prune, count, and add in one script, because checking and then adding from
 * two instances at once is exactly how a cap that reads correct lets one more
 * sandbox through than it agreed to.
 */
const CLAIM = `
local now = tonumber(ARGV[1])
local deadline = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now)
if redis.call('ZCARD', KEYS[1]) >= limit then return 0 end
redis.call('ZADD', KEYS[1], deadline, ARGV[4])
return 1
`;

export async function claimSlot(
  id: string,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = store();
  if (!redis) return true;
  const now = Date.now();
  const claimed = await redis.eval(
    CLAIM,
    [LIVE_KEY],
    [String(now), String(now + ttlSeconds * 1000), String(MAX_WORKSPACES), id],
  );
  return claimed === 1;
}

/**
 * Hand the slot a request reserved before it knew the sandbox id over to the
 * real one. Added before removed, so the count can read one high for an instant
 * but never one low: erring toward full turns a visitor away, erring toward
 * empty lets one more sandbox start than the deployment agreed to.
 */
const SWAP = `
redis.call('ZADD', KEYS[1], tonumber(ARGV[3]), ARGV[2])
redis.call('ZREM', KEYS[1], ARGV[1])
return 1
`;

export async function swapSlot(
  from: string,
  to: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = store();
  if (!redis) return;
  await redis.eval(
    SWAP,
    [LIVE_KEY],
    [from, to, String(Date.now() + ttlSeconds * 1000)],
  );
}

export async function releaseSlot(id: string): Promise<void> {
  const redis = store();
  if (!redis) return;
  await redis.zrem(LIVE_KEY, id);
}

/**
 * Refuse to serve rather than serve without a quota. A deployment that has lost
 * its store cannot count, and a route that cannot count cannot say no.
 */
export function assertLimitsAvailable(): void {
  if (limitsRequired() && !limitsConfigured()) {
    throw new LimitError(
      "The workspace is not accepting requests right now. Nothing has been started.",
    );
  }
}
