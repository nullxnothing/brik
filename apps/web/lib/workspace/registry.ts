import {
  DockerProvider,
  E2BProvider,
  reapExitedWorkspaces,
  type SandboxProvider,
  type Workspace,
} from "@brik/sandbox";
import {
  claimSlot,
  limitsConfigured,
  releaseSlot,
  swapSlot,
} from "./limits";

/**
 * Workspace leases for the local control plane. Server only.
 *
 * There is no database yet, so a lease lives in this process and the sandbox it
 * points at outlives it. Three things keep a host from filling up: the sandbox
 * expires on its own, the sweeper destroys leases past their deadline, and on
 * Docker the same sweep removes any BRIK container that is no longer running,
 * including ones a crashed process left behind.
 */

/**
 * Which sandbox runs the workspace.
 *
 * E2B when it is configured, local Docker otherwise, so a developer with Docker
 * needs no credentials and a deployment that has no Docker daemon still works.
 * Both sit behind `SandboxProvider`; nothing above this line knows which is in
 * use. The image name and the template id are not interchangeable, so they are
 * chosen together.
 */
function chooseProvider(): { provider: SandboxProvider; image: string } {
  const template = process.env.E2B_TEMPLATE;
  if (process.env.E2B_API_KEY && template) {
    return { provider: new E2BProvider(), image: template };
  }
  return {
    provider: new DockerProvider(),
    image: process.env.BRIK_WORKSPACE_IMAGE ?? "brik/solana-toolchain:dev",
  };
}

const TTL_SECONDS = Number(process.env.BRIK_WORKSPACE_TTL_SECONDS ?? 900);
const SWEEP_INTERVAL_MS = 30_000;

/**
 * How many workspaces may exist at once. Each one is a container off a 6.11GB
 * image with a validator and a compiler in it, so without a ceiling a handful
 * of open tabs takes the host down. This is a capacity limit, not a business
 * rule: per-visitor quotas belong with auth, and a real deployment sets this
 * from what the host can actually carry.
 */
const MAX_WORKSPACES = Number(process.env.BRIK_MAX_WORKSPACES ?? 4);

/** How long a slot may be held for a sandbox that is still starting. Long
 *  enough for a cold create, short enough that a crashed request does not cost
 *  capacity for the whole workspace lifetime. */
const RESERVATION_SECONDS = 120;

/** Thrown when the host is full. The route turns it into an honest message. */
export class CapacityError extends Error {
  constructor(readonly limit: number) {
    super(
      `All ${limit} workspace slots are busy. Wait for one to finish and try again.`,
    );
    this.name = "CapacityError";
  }
}

interface Lease {
  workspace: Workspace;
  expiresAt: number;
}

declare global {
  var __brikLeases: Map<string, Lease> | undefined;
  var __brikSandbox: { provider: SandboxProvider; image: string } | undefined;
  var __brikSweeper: ReturnType<typeof setInterval> | undefined;
  var __brikStarting: { count: number } | undefined;
}

// Next reloads route modules on edit; the leases have to outlive that or the
// containers they track become unreachable orphans.
const leases = (globalThis.__brikLeases ??= new Map<string, Lease>());
const { provider, image: IMAGE } = (globalThis.__brikSandbox ??= chooseProvider());
/** Containers that have been asked for but do not have a lease yet. Counted
 *  against the cap, or two requests arriving together both pass the check and
 *  the host ends up with one more container than it agreed to. */
const starting = (globalThis.__brikStarting ??= { count: 0 });

async function sweep(): Promise<void> {
  const now = Date.now();
  for (const [id, lease] of leases) {
    if (lease.expiresAt <= now) await destroyWorkspace(id);
  }
  // Docker only: a stopped container lingers until something removes it. A
  // managed provider reaps its own sandboxes when their timeout expires.
  if (provider.name === "docker") await reapExitedWorkspaces();
}

function startSweeper(): void {
  if (globalThis.__brikSweeper) return;
  const timer = setInterval(() => {
    void sweep().catch(() => {});
  }, SWEEP_INTERVAL_MS);
  timer.unref?.();
  globalThis.__brikSweeper = timer;
  if (provider.name === "docker") void reapExitedWorkspaces().catch(() => {});
}

export async function createWorkspace(): Promise<{
  workspace: Workspace;
  expiresAt: number;
}> {
  startSweeper();

  // Expired leases still count until the sweeper runs, so clear them first
  // rather than turning a visitor away for a workspace that is already dead.
  const now = Date.now();
  for (const [id, lease] of leases) {
    if (lease.expiresAt <= now) await destroyWorkspace(id);
  }
  // A sandbox id does not exist until the sandbox does, so the slot is taken
  // under a placeholder first. Its short deadline is what stops a create that
  // dies mid-flight holding capacity until the workspace TTL.
  const reservation = `pending-${crypto.randomUUID()}`;
  if (!(await claimSlot(reservation, RESERVATION_SECONDS))) {
    throw new CapacityError(MAX_WORKSPACES);
  }
  // With no shared store there is one process, and what it has started is the
  // whole truth.
  if (!limitsConfigured() && leases.size + starting.count >= MAX_WORKSPACES) {
    await releaseSlot(reservation);
    throw new CapacityError(MAX_WORKSPACES);
  }

  // Claimed here, before the first await, so a burst of requests cannot all
  // pass the check above.
  starting.count += 1;
  try {
    const workspace = await provider.createWorkspace({
      image: IMAGE,
      cpu: 4,
      memoryMib: 8192,
      diskMib: 16384,
      // The pre-built project compiles and the validator runs with no network,
      // so the workspace never needs egress to complete a build and deploy.
      egress: "locked",
      ttlSeconds: TTL_SECONDS,
    });
    await swapSlot(reservation, workspace.id, TTL_SECONDS);
    const expiresAt = Date.now() + TTL_SECONDS * 1000;
    leases.set(workspace.id, { workspace, expiresAt });
    return { workspace, expiresAt };
  } catch (error) {
    // Nothing was started, so nothing should keep occupying a slot.
    await releaseSlot(reservation);
    throw error;
  } finally {
    starting.count -= 1;
  }
}

/**
 * Take over a workspace this process never created.
 *
 * The leases above live in one Node process, so on anything with more than one
 * instance a second request lands somewhere that has never heard of the
 * workspace the first request made. A managed provider can still reach the
 * sandbox by id, which is enough for the agent to act on it and for the page
 * to release it. Docker cannot, and returns null.
 *
 * This is not the lease store. The concurrency cap and the sweeper are still
 * per-process, and the deadline below is a ceiling rather than the sandbox's
 * real one, which only the provider knows. It stops a live workspace reading as
 * gone, and stops one leaking to its own timeout because the tab that owned it
 * closed against a different instance.
 */
async function adopt(id: string): Promise<Lease | null> {
  const workspace = await provider.getWorkspace(id);
  if (!workspace) return null;
  const lease = { workspace, expiresAt: Date.now() + TTL_SECONDS * 1000 };
  leases.set(id, lease);
  return lease;
}

export async function getWorkspace(id: string): Promise<Lease | null> {
  const lease = leases.get(id);
  if (!lease) return adopt(id);
  if (lease.expiresAt <= Date.now()) return null;
  return lease;
}

export async function destroyWorkspace(id: string): Promise<boolean> {
  const lease = leases.get(id) ?? (await adopt(id));
  if (!lease) return false;
  leases.delete(id);
  await releaseSlot(id);
  await provider.forget(id);
  await lease.workspace.destroy().catch(() => {});
  return true;
}

export const WORKSPACE_TTL_SECONDS = TTL_SECONDS;
