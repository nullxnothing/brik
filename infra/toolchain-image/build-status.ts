import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Template } from "e2b";

/**
 * Report an E2B template build's status and its logs.
 *
 * Separate from the build itself because the build is requested server side:
 * if the client that started it dies, the build carries on without it, and
 * this is how you find out what happened.
 *
 *   pnpm --filter @brik/toolchain-image status <templateId> <buildId>
 */

const repoRoot = new URL("../../", import.meta.url);
const at = (path: string) => fileURLToPath(new URL(path, repoRoot));

const apiKey =
  process.env.E2B_API_KEY ??
  readFileSync(at("apps/web/.env.local"), "utf8")
    .match(/^E2B_API_KEY=(.*)$/m)?.[1]
    .trim();

const [templateId, buildId] = process.argv.slice(2);
if (!templateId || !buildId) {
  throw new Error("usage: status.ts <templateId> <buildId>");
}

const status = await Template.getBuildStatus(
  { templateId, buildId },
  { apiKey, logsOffset: 0 },
);

console.log(`status: ${status.status}`);
if (status.reason) console.log(`reason: ${JSON.stringify(status.reason)}`);

const logs = status.logEntries ?? [];
console.log(`\n--- last 40 of ${logs.length} log entries ---`);
for (const entry of logs.slice(-40)) {
  console.log(`${entry.level ?? ""} ${entry.message ?? JSON.stringify(entry)}`);
}
