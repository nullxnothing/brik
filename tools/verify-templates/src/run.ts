import { TEMPLATES } from "../../../apps/web/lib/templates/index";
import type { RunEvent } from "../../../apps/web/lib/workspace/events";

/**
 * Build, deploy, and test every template in a real workspace, twice.
 *
 * This drives the same HTTP route the browser does rather than reimplementing
 * the run, so a template that passes here is a template a visitor can open. It
 * exists because the constraint templates live under is invisible at the type
 * level: a workspace has no egress, so a template that reaches for a crate or
 * an npm package the toolchain image does not carry compiles fine on a laptop
 * and fails in the product.
 *
 * The second run is the same request a visitor makes by pressing Redeploy: the
 * same workspace, the same validator, the state the first run left behind. A
 * suite whose accounts are derived from the provider's own wallet passes the
 * first time and fails the second, which is invisible to a checker that gives
 * every template a fresh sandbox. That was a real bug and this is what catches
 * it.
 *
 *   pnpm dev                  # in another terminal, with Docker running
 *   pnpm verify-templates
 */

const BASE_URL = process.env.BRIK_BASE_URL ?? "http://localhost:3000";

interface Outcome {
  slug: string;
  ok: boolean;
  seconds: number;
  workspaceId?: string;
  program?: string;
  passing?: number;
  failing?: number;
  reason?: string;
}

/** Read the run's newline-delimited JSON, folding it into one outcome. */
async function runTemplate(slug: string, reuse?: string): Promise<Outcome> {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}/api/workspace/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ template: slug, workspaceId: reuse }),
  });

  if (!response.ok || !response.body) {
    return {
      slug,
      ok: false,
      seconds: 0,
      reason: `the server answered ${response.status}`,
    };
  }

  const outcome: Outcome = { slug, ok: false, seconds: 0 };
  let status = "";
  let pending = "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as RunEvent;
      if (event.type === "workspace") outcome.workspaceId = event.id;
      if (event.type === "status") status = event.status;
      if (event.type === "program") outcome.program = event.id;
      if (event.type === "failed") outcome.reason = event.message;
      if (event.type === "term") {
        for (const { text } of event.lines) {
          const passing = text.match(/(\d+) passing/);
          if (passing) outcome.passing = Number(passing[1]);
          const failing = text.match(/(\d+) failing/);
          if (failing) outcome.failing = Number(failing[1]);
        }
      }
    }
  }

  outcome.seconds = Math.round((Date.now() - started) / 100) / 10;
  outcome.ok =
    status === "deployed" &&
    outcome.program !== undefined &&
    (outcome.passing ?? 0) > 0 &&
    (outcome.failing ?? 0) === 0;

  if (!outcome.ok && !outcome.reason) {
    outcome.reason = `ended in "${status}" with ${outcome.failing ?? 0} failing`;
  }
  return outcome;
}

async function release(id: string | undefined): Promise<void> {
  if (!id) return;
  await fetch(`${BASE_URL}/api/workspace/${id}`, { method: "DELETE" }).catch(
    () => {},
  );
}

/** Run once, then again in the same workspace, and report the pair. */
async function verify(slug: string): Promise<Outcome> {
  const first = await runTemplate(slug);
  if (!first.ok) {
    await release(first.workspaceId);
    return first;
  }

  const second = await runTemplate(slug, first.workspaceId);
  await release(second.workspaceId ?? first.workspaceId);

  if (!second.ok) {
    return {
      ...second,
      seconds: first.seconds + second.seconds,
      reason: `passed once, then failed on a redeploy into the same workspace: ${second.reason}`,
    };
  }
  return { ...second, seconds: first.seconds + second.seconds };
}

const results: Outcome[] = [];
for (const template of TEMPLATES) {
  process.stdout.write(`${template.slug} ... `);
  const outcome = await verify(template.slug).catch(
    (error: unknown): Outcome => ({
      slug: template.slug,
      ok: false,
      seconds: 0,
      reason: error instanceof Error ? error.message : String(error),
    }),
  );
  results.push(outcome);
  console.log(
    outcome.ok
      ? `ok twice in ${outcome.seconds}s, ${outcome.passing} passing, ${outcome.program}`
      : `FAILED: ${outcome.reason}`,
  );
}

const failed = results.filter((result) => !result.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} templates built, deployed, and passed their tests on a first run and a redeploy`,
);
process.exit(failed.length === 0 ? 0 : 1);
