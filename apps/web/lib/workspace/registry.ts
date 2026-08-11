import {
  DockerProvider,
  reapExitedWorkspaces,
  type Workspace,
} from "@brik/sandbox";

/**
 * Workspace leases for the local control plane. Server only.
 *
 * There is no database yet, so a lease lives in this process and a container
 * outlives it. Three things keep the machine from filling up with 9.89GB-image
 * containers: the container's own `sleep` TTL makes it exit unattended, the
 * sweeper destroys leases past their deadline, and the same sweep removes any
 * BRIK container that is no longer running, including ones a crashed process
 * left behind.
 */

const IMAGE = process.env.BRIK_WORKSPACE_IMAGE ?? "brik/solana-toolchain:dev";
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
  var __brikProvider: DockerProvider | undefined;
  var __brikSweeper: ReturnType<typeof setInterval> | undefined;
  var __brikStarting: { count: number } | undefined;
}

// Next reloads route modules on edit; the leases have to outlive that or the
// containers they track become unreachable orphans.
const leases = (globalThis.__brikLeases ??= new Map<string, Lease>());
const provider = (globalThis.__brikProvider ??= new DockerProvider());
/** Containers that have been asked for but do not have a lease yet. Counted
 *  against the cap, or two requests arriving together both pass the check and
 *  the host ends up with one more container than it agreed to. */
const starting = (globalThis.__brikStarting ??= { count: 0 });

async function sweep(): Promise<void> {
  const now = Date.now();
  for (const [id, lease] of leases) {
    if (lease.expiresAt <= now) await destroyWorkspace(id);
  }
  await reapExitedWorkspaces();
}

function startSweeper(): void {
  if (globalThis.__brikSweeper) return;
  const timer = setInterval(() => {
    void sweep().catch(() => {});
  }, SWEEP_INTERVAL_MS);
  timer.unref?.();
  globalThis.__brikSweeper = timer;
  void reapExitedWorkspaces().catch(() => {});
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
  if (leases.size + starting.count >= MAX_WORKSPACES) {
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
    const expiresAt = Date.now() + TTL_SECONDS * 1000;
    leases.set(workspace.id, { workspace, expiresAt });
    return { workspace, expiresAt };
  } finally {
    starting.count -= 1;
  }
}

export function getWorkspace(id: string): Lease | null {
  const lease = leases.get(id);
  if (!lease) return null;
  if (lease.expiresAt <= Date.now()) return null;
  return lease;
}

export async function destroyWorkspace(id: string): Promise<boolean> {
  const lease = leases.get(id);
  if (!lease) return false;
  leases.delete(id);
  await provider.forget(id);
  await lease.workspace.destroy().catch(() => {});
  return true;
}

export const WORKSPACE_TTL_SECONDS = TTL_SECONDS;
