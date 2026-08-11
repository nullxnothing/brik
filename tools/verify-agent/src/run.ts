import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  AnthropicProvider,
  runAgent,
  type AgentTurnResult,
  type ModelProvider,
  type ModelTier,
  type TaskStep,
  type TurnRequest,
} from "@brik/agent";
import { DockerProvider, E2BProvider, type SandboxProvider } from "@brik/sandbox";

/**
 * Exercise the agent loop against a real sandbox with a scripted model.
 *
 * The model is the one part that cannot be checked without a key, so it is the
 * one part faked. Everything else is real: the tools read, write, and run
 * commands in an actual container, and the assertions below are about what
 * happened in there. That makes this a test of the mechanics — tool dispatch,
 * evidence capture, history shape, changed-file tracking — rather than of the
 * model's judgement.
 *
 *   pnpm verify-agent
 */

const PROJECT_DIR = "/workspace/project";
const ENTRY = "programs/project/src/lib.rs";

/** Replays a fixed sequence of turns, and records what it was asked. */
class ScriptedProvider implements ModelProvider {
  readonly name = "scripted";
  readonly seen: TurnRequest[] = [];
  private turn = 0;

  constructor(private readonly script: Omit<AgentTurnResult, "raw">[]) {}

  modelFor(_tier: ModelTier): string {
    return "scripted";
  }

  async runTurn(request: TurnRequest): Promise<AgentTurnResult> {
    this.seen.push(request);
    const next = this.script[this.turn++];
    if (!next) throw new Error("the script ran out of turns");
    // Mirrors the provider contract: assistant content goes back verbatim.
    return {
      ...next,
      raw: [
        ...(next.text ? [{ type: "text", text: next.text }] : []),
        ...next.toolUses.map((use) => ({
          type: "tool_use",
          id: use.id,
          name: use.name,
          input: use.input,
        })),
      ],
    };
  }
}

function call(id: string, name: string, input: Record<string, unknown>) {
  return { text: "", toolUses: [{ id, name, input }], stopReason: "tool_use" };
}

const SCRIPT = [
  call("t1", "list_files", {}),
  call("t2", "read_file", { path: ENTRY }),
  call("t3", "write_file", {
    path: ENTRY,
    content: [
      "use anchor_lang::prelude::*;",
      "",
      'declare_id!("eJvmgeW5TbyYZ1SU3WYCKyCz11FQa9U29gj8EcZZ96V");',
      "",
      "#[program]",
      "pub mod project {",
      "    use super::*;",
      "",
      "    pub fn ping(_ctx: Context<Ping>) -> Result<()> {",
      '        msg!("written by the agent loop");',
      "        Ok(())",
      "    }",
      "}",
      "",
      "#[derive(Accounts)]",
      "pub struct Ping {}",
      "",
    ].join("\n"),
  }),
  call("t4", "run_command", { command: "anchor keys sync && anchor build" }),
  { text: "Wrote a ping instruction and built it.", toolUses: [], stopReason: "end_turn" },
];

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

/**
 * `--live` swaps the scripted model for a real one. The scripted run proves the
 * mechanics deterministically; the live run proves a model can actually drive
 * them, which no amount of scripting can.
 */
const isLive = process.argv.includes("--live");

function apiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const repoRoot = new URL("../../../", import.meta.url);
  const local = readFileSync(
    fileURLToPath(new URL("apps/web/.env.local", repoRoot)),
    "utf8",
  );
  const found = local.match(/^ANTHROPIC_API_KEY=(.*)$/m)?.[1].trim();
  if (!found) throw new Error("ANTHROPIC_API_KEY is not set");
  return found;
}

const results: string[] = [];
const check = (name: string, pass: boolean, detail = "") =>
  results.push(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);

const { provider, image } = chooseProvider();
console.log(`sandbox: ${provider.name} (${image})  model: ${isLive ? "live" : "scripted"}\n`);

const workspace = await provider.createWorkspace({
  image,
  cpu: 4,
  memoryMib: 8192,
  diskMib: 16384,
  egress: "locked",
  ttlSeconds: 900,
});

const scripted = new ScriptedProvider(SCRIPT);
const model: ModelProvider = isLive
  ? new AnthropicProvider(apiKey())
  : scripted;
const steps: TaskStep[] = [];

try {
  const task = await runAgent({
    objective: isLive
      ? "Add an instruction called ping to the program. It should log a message and return Ok. " +
        "Then build the project and make sure it compiles."
      : "Add a ping instruction and build it.",
    workspace,
    projectDir: PROJECT_DIR,
    provider: model,
    onStep: (step) => steps.push({ ...step }),
    onText: (text) => console.log(`model: ${text}`),
  });

  for (const step of steps.filter((s) => s.status !== "running")) {
    console.log(`  ${step.status === "done" ? "✓" : "✗"} ${step.title} — ${step.detail ?? ""}`);
  }
  console.log();

  check("the run succeeded", task.status === "succeeded", task.summary);
  check("no step failed", steps.every((s) => s.status !== "failed"));
  check("the agent edited a file", task.changedFiles.length > 0, task.changedFiles.join(","));

  // onStep fires twice per tool, once on start and once on settle, so the
  // last snapshot is the one carrying the outcome.
  const build = steps.filter((s) => s.kind === "exec").at(-1);
  check("a command ran in the sandbox", build?.status === "done", build?.detail);

  // The point of the whole package: the source the agent wrote is on disk in
  // the container, and the compiler agreed with it.
  const onDisk = await workspace.readFile(`${PROJECT_DIR}/${ENTRY}`);
  check("the sandbox holds what the agent wrote", onDisk.includes("ping"));

  const built = await workspace.exec(
    "ls -la target/deploy/project.so && anchor build 2>&1 | tail -1",
    { cwd: PROJECT_DIR, timeoutMs: 10 * 60_000 },
  );
  check("the program compiles as left", built.exitCode === 0, built.stdout.trim().split("\n").at(-1));

  if (isLive) {
    check("the model called tools rather than only talking", task.toolCalls > 0, `${task.toolCalls}`);
    console.log(`\nlive run used ${task.toolCalls} tool calls on ${task.model}`);
  } else {
    check("every tool call was dispatched", task.toolCalls === 4, `${task.toolCalls}`);
    check("the written file is tracked as changed", task.changedFiles.includes(ENTRY));
    check(
      "each tool reported running before it settled",
      steps.filter((s) => s.status === "running").length === 4,
    );

    // History shape: the API rejects a tool_result with no matching tool_use,
    // so the loop must push the assistant turn before the results.
    const last = scripted.seen.at(-1)!;
    const roles = last.messages.map((m) => m.role).join(",");
    check("history alternates user and assistant", /^user(,assistant,user)+$/.test(roles), roles);
    check("the tools were offered every turn", scripted.seen.every((r) => r.tools.length === 4));
    check("the system prompt names the project", last.system.includes(PROJECT_DIR));
  }
} finally {
  await workspace.destroy();
}

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL"));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
