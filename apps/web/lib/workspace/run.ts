import type { ExecResult, Workspace } from "@brik/sandbox";
import { toneFor, type RunEvent, type TerminalLine } from "./events";

/**
 * One workspace run: boot the validator, build the program, deploy it.
 *
 * Every line the UI shows comes from this file, and every line this file sends
 * came out of the container. There is no agent yet, so the run does not write
 * code: it builds and deploys the project the image already carries.
 */

/** The pre-built Anchor project baked into the toolchain image. Building it in
 *  place is what keeps a build at ~1.5s; cargo fingerprints embed absolute
 *  paths, so a copy elsewhere is a cold compile. */
const PROJECT_DIR = "/workspace/project";
const PROJECT_NAME = "project";
const ENTRY_FILE = "programs/project/src/lib.rs";

const BOOT_TIMEOUT_MS = 120_000;
const BUILD_TIMEOUT_MS = 15 * 60_000;
const DEPLOY_TIMEOUT_MS = 10 * 60_000;

export type Send = (event: RunEvent) => void;

interface Context {
  workspace: Workspace;
  send: Send;
  signal: AbortSignal;
}

/** Buffers raw output into whole lines, so a chunk split mid-line never
 *  renders as two terminal rows. Carriage returns break a line too: cargo
 *  redraws progress with `\r`, which would otherwise buffer into one long
 *  line that never ends. */
const LINE_BREAK = /\r\n|\r|\n/;

class LineBuffer {
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

/** Report the project as it exists on disk, rather than as a template claims. */
async function sendProject(ctx: Context): Promise<void> {
  const source = await ctx.workspace.readFile(`${PROJECT_DIR}/${ENTRY_FILE}`);
  const listing = await ctx.workspace.exec(
    "find . -type f -not -path './target/*' -not -path './node_modules/*' | sort",
    { cwd: PROJECT_DIR, signal: ctx.signal },
  );
  const files = listing.stdout
    .split("\n")
    .map((line) => line.trim().replace(/^\.\//, ""))
    .filter(Boolean);

  ctx.send({
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
  ctx.send({ type: "step", text: "Read the project" });
  await sendProject(ctx);

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

  ctx.send({ type: "status", status: "deployed" });
  return true;
}
