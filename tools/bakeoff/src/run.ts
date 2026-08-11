import { mkdirSync, writeFileSync } from "node:fs";
import {
  DockerProvider,
  E2BProvider,
  type SandboxProvider,
} from "@brik/sandbox";

/**
 * Sandbox provider bake-off harness (docs/07_pre_build_research_agenda.md §2).
 *
 * Measures, per provider:
 *   1. cold-start latency (createWorkspace → ready)
 *   2. warm `anchor build` wall time on the pre-warmed toolchain image
 *   3. cold `anchor build` wall time (fresh project, no caches)
 *   4. exec round-trip latency
 *
 * Run the Docker baseline:
 *   docker build -t brik/solana-toolchain:dev infra/toolchain-image
 *   pnpm bakeoff
 *
 * Managed providers (E2B, Modal, Daytona, Fly Machines) get adapters in
 * packages/sandbox and register themselves in PROVIDERS below; each needs
 * its API key in the environment. Results land in bakeoff-results/.
 */

/**
 * Each provider names its own workspace image: Docker takes a local tag, E2B
 * takes a template id. They are not interchangeable, so they travel together.
 */
interface Candidate {
  provider: SandboxProvider;
  image: string;
}

const CANDIDATES: Candidate[] = [
  {
    provider: new DockerProvider(),
    image: process.env.BAKEOFF_IMAGE ?? "brik/solana-toolchain:dev",
  },
];

// E2B is the chosen managed provider, but a sandbox can only be built from a
// template that exists on their side. Until the toolchain image is published as
// one, E2B_TEMPLATE points at whatever is available: "base" measures start and
// exec latency honestly and reports the anchor timings as failures, because a
// stock template has no Anchor in it.
if (process.env.E2B_API_KEY) {
  CANDIDATES.push({
    provider: new E2BProvider(),
    image: process.env.E2B_TEMPLATE ?? "base",
  });
}

interface Result {
  provider: string;
  coldStartMs: number;
  execRoundTripMs: number;
  warmAnchorBuildMs: number | null;
  coldAnchorBuildMs: number | null;
  error?: string;
}

async function measure({ provider, image }: Candidate): Promise<Result> {
  const result: Result = {
    provider: provider.name,
    coldStartMs: -1,
    execRoundTripMs: -1,
    warmAnchorBuildMs: null,
    coldAnchorBuildMs: null,
  };

  const t0 = Date.now();
  const ws = await provider.createWorkspace({
    image,
    cpu: 4,
    memoryMib: 8192,
    diskMib: 16384,
    egress: "standard",
    ttlSeconds: 3600,
  });
  result.coldStartMs = Date.now() - t0;

  try {
    const echo = await ws.exec("echo ok");
    result.execRoundTripMs = echo.durationMs;

    // Warm path: pre-warmed caches from the image's /opt scratch build.
    // anchor init takes a workspace NAME under the cwd, and shells out to yarn
    // unless --no-install is passed; neither matters for a build-time measurement.
    const init = await ws.exec(
      "cd /workspace && anchor init bakeoff --no-git --no-install && cd /workspace/bakeoff && anchor build",
      { timeoutMs: 15 * 60_000 },
    );
    if (init.exitCode === 0) {
      result.warmAnchorBuildMs = init.durationMs;
    } else {
      result.error = `warm build failed: ${init.stderr.slice(-500)}`;
    }

    // Cold path: wipe caches, rebuild.
    const cold = await ws.exec(
      "cd /workspace/bakeoff && rm -rf target ~/.cargo/registry/cache && anchor build",
      { timeoutMs: 30 * 60_000 },
    );
    if (cold.exitCode === 0) {
      result.coldAnchorBuildMs = cold.durationMs;
    }
  } catch (err) {
    result.error = String(err);
  } finally {
    await ws.destroy();
  }

  return result;
}

const results: Result[] = [];
for (const candidate of CANDIDATES) {
  const { provider, image } = candidate;
  console.log(`\n=== ${provider.name} (${image}) ===`);
  try {
    const r = await measure(candidate);
    results.push(r);
    console.table([r]);
  } catch (err) {
    console.error(`${provider.name} failed:`, err);
    results.push({
      provider: provider.name,
      coldStartMs: -1,
      execRoundTripMs: -1,
      warmAnchorBuildMs: null,
      coldAnchorBuildMs: null,
      error: String(err),
    });
  }
}

mkdirSync("bakeoff-results", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(
  `bakeoff-results/${stamp}.json`,
  JSON.stringify(results, null, 2),
);
console.log(`\nResults written to bakeoff-results/${stamp}.json`);
