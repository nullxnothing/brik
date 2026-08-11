import type { ExecResult, Workspace } from "@brik/sandbox";
import type { AgentToolDef } from "./turn.js";

/**
 * The agent's tools, and the one thing that makes them different from a desktop
 * agent's: every one of them acts on a remote sandbox through `Workspace`, never
 * on the machine running this code. There is no local filesystem in reach, which
 * is the property that makes running a stranger's generated code survivable.
 */

/** Blue, amber, green in the tool row. Presentation, but also intent. */
export type ToolKind = "read" | "edit" | "run";

/**
 * What a tool can do, used to decide whether it needs approval. `sensitive` is
 * for anything that spends SOL or leaves the workspace.
 */
export type ToolRisk = "read" | "write" | "sensitive";

export interface ToolResult {
  ok: boolean;
  /** One line for the agent panel, and what the model sees as the result. */
  summary: string;
  /** Fuller payload serialised into the tool result. */
  data?: unknown;
}

export interface ToolContext {
  workspace: Workspace;
  /** The project root every relative path is resolved against. */
  projectDir: string;
  signal: AbortSignal;
  /**
   * Raw output as a command produces it, for a caller with a terminal to show.
   * A tee, not the evidence: what the model sees is still the `ExecResult` the
   * command returned, so nothing here can change what a step is allowed to
   * claim.
   */
  onOutput?: (chunk: string) => void;
}

export interface Tool {
  name: string;
  description: string;
  kind: ToolKind;
  risk: ToolRisk;
  input: AgentToolDef["input_schema"];
  handler: (
    input: Record<string, unknown>,
    ctx: ToolContext,
  ) => Promise<ToolResult>;
}

export function toModelTools(tools: Tool[]): AgentToolDef[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input,
  }));
}

export function requiresApproval(risk: ToolRisk): boolean {
  return risk !== "read";
}

/** Keep a path inside the project. The sandbox is a boundary, not an excuse. */
function resolve(ctx: ToolContext, raw: unknown): string {
  const path = String(raw ?? "").trim();
  if (!path || path.startsWith("/") || path.split("/").includes("..")) {
    throw new Error(`path must be relative to the project: ${path}`);
  }
  return `${ctx.projectDir}/${path}`;
}

/** Output the model has to reason over, bounded so one command cannot eat the
 *  whole context window. */
const MAX_OUTPUT = 8_000;

function clamp(text: string): string {
  if (text.length <= MAX_OUTPUT) return text;
  const half = MAX_OUTPUT / 2;
  return `${text.slice(0, half)}\n... ${text.length - MAX_OUTPUT} characters trimmed ...\n${text.slice(-half)}`;
}

function describe(result: ExecResult): string {
  return clamp(
    [result.stdout, result.stderr].filter(Boolean).join("\n").trim() ||
      "(no output)",
  );
}

export const READ_FILE: Tool = {
  name: "read_file",
  description:
    "Read a UTF-8 file from the project. Paths are relative to the project root.",
  kind: "read",
  risk: "read",
  input: {
    type: "object",
    properties: { path: { type: "string", description: "e.g. programs/project/src/lib.rs" } },
    required: ["path"],
  },
  async handler(input, ctx) {
    const path = resolve(ctx, input.path);
    const content = await ctx.workspace.readFile(path);
    return {
      ok: true,
      summary: `read ${input.path} (${content.split("\n").length} lines)`,
      data: clamp(content),
    };
  },
};

export const LIST_FILES: Tool = {
  name: "list_files",
  description:
    "List the project's files, excluding build output and dependencies.",
  kind: "read",
  risk: "read",
  input: { type: "object", properties: {}, required: [] },
  async handler(_input, ctx) {
    const result = await ctx.workspace.exec(
      "find . -type f -not -path './target/*' -not -path './node_modules/*' | sort | sed 's|^\\./||'",
      { cwd: ctx.projectDir, signal: ctx.signal },
    );
    const files = result.stdout.split("\n").filter(Boolean);
    return { ok: true, summary: `${files.length} files`, data: files };
  },
};

export const WRITE_FILE: Tool = {
  name: "write_file",
  description:
    "Write a file in the project, replacing it entirely. Write the whole file, not a fragment.",
  kind: "edit",
  risk: "write",
  input: {
    type: "object",
    properties: {
      path: { type: "string" },
      content: { type: "string", description: "The complete new file contents" },
    },
    required: ["path", "content"],
  },
  async handler(input, ctx) {
    const path = resolve(ctx, input.path);
    const content = String(input.content ?? "");
    await ctx.workspace.writeFile(path, content);
    return {
      ok: true,
      summary: `wrote ${input.path} (${content.split("\n").length} lines)`,
    };
  },
};

export const RUN_COMMAND: Tool = {
  name: "run_command",
  description:
    "Run a shell command in the project. Use this to build, test, and deploy. " +
    "The workspace has no internet access, so nothing can be downloaded.",
  kind: "run",
  risk: "write",
  input: {
    type: "object",
    properties: {
      command: { type: "string", description: "e.g. anchor build" },
    },
    required: ["command"],
  },
  async handler(input, ctx) {
    const command = String(input.command ?? "").trim();
    if (!command) throw new Error("command is required");
    const result = await ctx.workspace.exec(command, {
      cwd: ctx.projectDir,
      signal: ctx.signal,
      timeoutMs: 15 * 60_000,
      onStdout: ctx.onOutput,
      onStderr: ctx.onOutput,
    });
    return {
      ok: result.exitCode === 0,
      summary: `${command} exited ${result.exitCode}`,
      data: describe(result),
    };
  },
};

/** Everything the agent can do, in the order it usually wants them. */
export const WORKSPACE_TOOLS: Tool[] = [
  LIST_FILES,
  READ_FILE,
  WRITE_FILE,
  RUN_COMMAND,
];
