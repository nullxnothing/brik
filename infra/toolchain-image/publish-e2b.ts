import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Template } from "e2b";

/**
 * Publish the toolchain image as an E2B template.
 *
 * A sandbox can only start from a template that exists on E2B's side, so this
 * is what stands between the workspace and running anywhere other than a
 * developer's own Docker. The Dockerfile stays the single source of truth for
 * both: E2B parses it rather than us maintaining a second definition.
 *
 *   pnpm publish-template --dry   # parse the Dockerfile, build nothing
 *   pnpm publish-template         # build it, expect a long wait
 */

const NAME = process.env.E2B_TEMPLATE_NAME ?? "brik-solana-toolchain";

// Matches the WorkspaceSpec the control plane asks for. The SDK defaults to
// 2 CPU and 1GB, which cannot compile an Anchor program and run a validator
// beside it.
const CPU_COUNT = Number(process.env.E2B_TEMPLATE_CPUS ?? 4);
const MEMORY_MB = Number(process.env.E2B_TEMPLATE_MEMORY_MB ?? 8192);

const repoRoot = new URL("../../", import.meta.url);
const at = (path: string) => fileURLToPath(new URL(path, repoRoot));

function apiKey(): string {
  if (process.env.E2B_API_KEY) return process.env.E2B_API_KEY;
  const local = readFileSync(at("apps/web/.env.local"), "utf8");
  const found = local.match(/^E2B_API_KEY=(.*)$/m)?.[1].trim();
  if (!found) {
    throw new Error("E2B_API_KEY is not set and is absent from apps/web/.env.local");
  }
  return found;
}

const dockerfile = readFileSync(new URL("Dockerfile", import.meta.url), "utf8");
const template = Template().fromDockerfile(dockerfile);
console.log("the Dockerfile parsed into a template definition");

if (process.argv.includes("--dry")) {
  console.log(JSON.stringify(template, null, 2).slice(0, 6000));
  process.exit(0);
}

console.log(`building "${NAME}" at ${CPU_COUNT} CPU / ${MEMORY_MB}MB`);
console.log("Rust and Anchor compile from source here, so this takes a while\n");

const started = Date.now();
try {
  const info = await Template.build(template, NAME, {
    apiKey: apiKey(),
    cpuCount: CPU_COUNT,
    memoryMB: MEMORY_MB,
    onBuildLogs: (entry) => {
      const at = Math.round((Date.now() - started) / 1000);
      console.log(`[${at}s] ${entry.level ?? ""} ${entry.message ?? ""}`.trim());
    },
  });

  console.log(`\nbuilt in ${Math.round((Date.now() - started) / 60_000)} minutes`);
  console.log(JSON.stringify(info, null, 2));
  console.log(`\nPoint the workspace at it with E2B_TEMPLATE=${NAME}`);
} catch (error) {
  // The build is requested server side, so a client that dies here leaves a
  // build running without anyone watching. Print everything, then say where to
  // pick the thread back up.
  console.error("\nbuild failed after", Math.round((Date.now() - started) / 1000), "s");
  console.error("name:", (error as Error)?.name);
  console.error("message:", (error as Error)?.message);
  const extra = { ...(error as object) };
  if (Object.keys(extra).length > 0) {
    console.error("fields:", JSON.stringify(extra, null, 2).slice(0, 2000));
  }
  console.error((error as Error)?.stack?.split("\n").slice(0, 6).join("\n"));
  console.error("\nCheck the build itself with src/status.ts <templateId> <buildId>.");
  process.exit(1);
}
