import type { ExecResult, Workspace } from "@brik/sandbox";
import type { Template } from "../templates";
import { toneFor, type RunEvent, type TerminalLine } from "./events";

/**
 * One workspace run: boot the validator, write the template in, build it,
 * deploy it, and run its tests.
 *
 * Every line the UI shows comes from this file, and every line this file sends
 * came out of the container. There is no agent yet, so the run does not write
 * code of its own: it starts the template the visitor chose.
 */

/** The pre-built Anchor project baked into the toolchain image. Overlaying a
 *  template onto it in place is what keeps a build at a few seconds; cargo
 *  fingerprints embed absolute paths, so a copy elsewhere is a cold compile. */
export const PROJECT_DIR = "/workspace/project";
const PROJECT_NAME = "project";
const ENTRY_FILE = "programs/project/src/lib.rs";
const TEST_FILE = "tests/project.ts";

const BOOT_TIMEOUT_MS = 120_000;
const BUILD_TIMEOUT_MS = 15 * 60_000;
const DEPLOY_TIMEOUT_MS = 10 * 60_000;
const TEST_TIMEOUT_MS = 10 * 60_000;

export type Send = (event: RunEvent) => void;

interface Context {
  workspace: Workspace;
  template: Template;
  send: Send;
  signal: AbortSignal;
}

/** Buffers raw output into whole lines, so a chunk split mid-line never
 *  renders as two terminal rows. Carriage returns break a line too: cargo
 *  redraws progress with `\r`, which would otherwise buffer into one long
 *  line that never ends. */
const LINE_BREAK = /\r\n|\r|\n/;

export class LineBuffer {
  private pending = "";

  constructor(private readonly send: Send) {}

  write(chunk: string): void {
    this.pending += chunk;
    const parts = this.pending.split(LINE_BREAK);
    this.pending = parts.pop() ?? "";
    this.emit(parts);
  }

  flush(): void {
    if (!this.pending) return;
    const last = this.pending;
    this.pending = "";
    this.emit([last]);
  }

  private emit(raw: string[]): void {
    const lines: TerminalLine[] = raw.map((text) => ({
      text,
      tone: toneFor(text),
    }));
    if (lines.length > 0) this.send({ type: "term", lines });
  }
}

interface CommandOptions {
  cwd?: string;
  timeoutMs?: number;
}

/** Run a command in the workspace and stream its output to the terminal. */
async function runCommand(
  ctx: Context,
  command: string,
  opts: CommandOptions = {},
): Promise<ExecResult> {
  ctx.send({ type: "term", lines: [{ text: `$ ${command}`, tone: "cmd" }] });
  const buffer = new LineBuffer(ctx.send);
  const result = await ctx.workspace.exec(command, {
    cwd: opts.cwd,
    timeoutMs: opts.timeoutMs,
    signal: ctx.signal,
    onStdout: (chunk) => buffer.write(chunk),
    onStderr: (chunk) => buffer.write(chunk),
  });
  buffer.flush();
  return result;
}

/** Anchor and cargo split their output across both streams; read them as one. */
function output(result: ExecResult): string {
  return `${result.stdout}\n${result.stderr}`;
}

function capture(result: ExecResult, pattern: RegExp): string | null {
  return output(result).match(pattern)?.[1] ?? null;
}

/**
 * Why a step failed, in the workspace's own terms. A container killed under a
 * running command takes the exec down with it, which surfaces as 137 rather
 * than anything the command itself printed.
 */
function failureMessage(step: string, result: ExecResult): string {
  const stopped =
    result.exitCode === 137 ||
    /is not running|No such container/i.test(result.stderr);
  if (stopped) return `The workspace container stopped during ${step}.`;
  return `${step} exited ${result.exitCode}. See the terminal for the output.`;
}

function fail(ctx: Context, message: string): false {
  ctx.send({ type: "status", status: "failed" });
  ctx.send({ type: "failed", message });
  return false;
}

/**
 * Put the template into the pre-built project. Only these two files are
 * replaced: the manifests stay as the image compiled them, which is what lets
 * cargo reuse the pre-built target directory.
 *
 * Then sync the program id. Each image build generates a fresh program keypair,
 * so a template's declare_id! is stale the moment the image is rebuilt. Left
 * alone the program still builds and deploys, and the client then talks to the
 * declared address instead of the deployed one, so every test fails against a
 * program that is demonstrably there. `anchor keys sync` rewrites the
 * declaration from the keypair, which is why the source is read back afterwards
 * rather than assumed.
 */
async function writeTemplate(ctx: Context): Promise<ExecResult> {
  await ctx.workspace.writeFile(
    `${PROJECT_DIR}/${ENTRY_FILE}`,
    ctx.template.program,
  );
  await ctx.workspace.writeFile(
    `${PROJECT_DIR}/${TEST_FILE}`,
    ctx.template.test,
  );
  return ctx.workspace.exec("anchor keys sync", {
    cwd: PROJECT_DIR,
    signal: ctx.signal,
  });
}

/**
 * Report the project as it exists on disk, rather than as a template claims.
 * Also what an agent turn calls once it has finished writing, so the editor
 * shows the container's copy rather than the one the model says it wrote.
 */
export async function sendProject(
  workspace: Workspace,
  send: Send,
  signal: AbortSignal,
): Promise<void> {
  const source = await workspace.readFile(`${PROJECT_DIR}/${ENTRY_FILE}`);
  const listing = await workspace.exec(
    "find . -type f -not -path './target/*' -not -path './node_modules/*' | sort",
    { cwd: PROJECT_DIR, signal },
  );
  const files = listing.stdout
    .split("\n")
    .map((line) => line.trim().replace(/^\.\//, ""))
    .filter(Boolean);

  send({
    type: "project",
    name: PROJECT_NAME,
    entryFile: ENTRY_FILE,
    files,
    source: source.replace(/\r/g, "").split("\n"),
  });
}

async function readBalance(ctx: Context): Promise<number | null> {
  const result = await ctx.workspace.exec("solana balance", {
    signal: ctx.signal,
  });
  const amount = capture(result, /([\d.]+)\s*SOL/);
  return amount === null ? null : Number(amount);
}

/** Resolves true once the program is deployed, false if the run stopped. A
 *  stopped run leaves the container in an unknown state, so the caller
 *  discards it rather than reusing it for the next run. */
export async function runWorkspace(ctx: Context): Promise<boolean> {
  ctx.send({ type: "status", status: "sleeping" });
  ctx.send({ type: "step", text: "Start the workspace validator" });
  const boot = await runCommand(ctx, "brik-localnet start", {
    timeoutMs: BOOT_TIMEOUT_MS,
  });
  if (boot.exitCode !== 0) {
    return fail(ctx, failureMessage("brik-localnet start", boot));
  }

  const wallet = output(boot).match(/^Wallet (\S+) funded with ([\d.]+) SOL/m);
  if (wallet) {
    ctx.send({
      type: "wallet",
      address: wallet[1],
      balance: Number(wallet[2]),
    });
  }

  ctx.send({ type: "status", status: "ready" });
  ctx.send({ type: "step", text: `Open the ${ctx.template.name} template` });
  const sync = await writeTemplate(ctx);
  if (sync.exitCode !== 0) {
    return fail(ctx, failureMessage("anchor keys sync", sync));
  }
  await sendProject(ctx.workspace, ctx.send, ctx.signal);

  ctx.send({ type: "status", status: "building" });
  ctx.send({ type: "step", text: "Build the program" });
  const build = await runCommand(ctx, "anchor build", {
    cwd: PROJECT_DIR,
    timeoutMs: BUILD_TIMEOUT_MS,
  });
  if (build.exitCode !== 0) {
    return fail(ctx, failureMessage("anchor build", build));
  }

  ctx.send({ type: "step", text: "Deploy to the workspace validator" });
  const deploy = await runCommand(ctx, "anchor deploy", {
    cwd: PROJECT_DIR,
    timeoutMs: DEPLOY_TIMEOUT_MS,
  });
  if (deploy.exitCode !== 0) {
    return fail(ctx, failureMessage("anchor deploy", deploy));
  }

  const programId = capture(deploy, /^Program Id: (\S+)$/m);
  if (!programId) {
    return fail(ctx, "anchor deploy reported no program id.");
  }
  ctx.send({ type: "program", id: programId });

  const signature = capture(deploy, /^Signature: (\S+)$/m);
  if (signature) ctx.send({ type: "tx", signature });

  const balance = await readBalance(ctx);
  if (balance !== null) ctx.send({ type: "balance", balance });

  // The suite runs against the program that was just deployed, so the build and
  // deploy anchor would otherwise repeat are both skipped.
  ctx.send({ type: "status", status: "testing" });
  ctx.send({ type: "step", text: "Run the tests" });
  const test = await runCommand(
    ctx,
    "anchor test --skip-local-validator --skip-build --skip-deploy",
    { cwd: PROJECT_DIR, timeoutMs: TEST_TIMEOUT_MS },
  );
  if (test.exitCode !== 0) {
    return fail(ctx, failureMessage("anchor test", test));
  }

  ctx.send({ type: "status", status: "deployed" });
  return true;
}
