import type { ExecResult, Workspace } from "@brik/sandbox";
import {
  toModelTools,
  WORKSPACE_TOOLS,
  type Tool,
  type ToolContext,
} from "./tools.js";
import {
  trimHistory,
  type AgentMessage,
  type AgentToolUse,
  type ModelProvider,
  type ModelTier,
  type TokenUsage,
} from "./turn.js";

/**
 * The agent loop.
 *
 * One rule shapes it: never report a step done without the tool result that
 * proves it. A model that says "built successfully" is not evidence; the
 * `ExecResult` from `anchor build` is. Every step carries the evidence it has,
 * and a step with none says so.
 */

export type StepKind = "plan" | "read" | "edit" | "exec" | "done" | "failed";

export interface TaskStep {
  kind: StepKind;
  title: string;
  status: "running" | "done" | "failed";
  /** Tool evidence. Required for any step reported as done off the back of one. */
  evidence?: ExecResult;
  detail?: string;
}

export interface TaskBudget {
  maxToolCalls: number;
  maxIterations: number;
  maxDurationMs: number;
}

export const DEFAULT_BUDGET: TaskBudget = {
  maxToolCalls: 40,
  maxIterations: 20,
  maxDurationMs: 10 * 60_000,
};

/** How many turns of history to keep before trimming. */
const MAX_HISTORY = 40;
/** Room to think and then write a file. Too low truncates mid-answer, and the
 *  turn is streamed so a large ceiling costs nothing when it goes unused. */
const MAX_TOKENS = 16_000;

export interface AgentTask {
  objective: string;
  steps: TaskStep[];
  changedFiles: string[];
  status: "succeeded" | "failed" | "cancelled";
  /** Why it ended, in a sentence a visitor can read. */
  summary: string;
  toolCalls: number;
  model: string;
  /** What the run spent, summed across every model call it made. */
  usage: TokenUsage;
}

export interface RunAgentOptions {
  objective: string;
  workspace: Workspace;
  projectDir: string;
  provider: ModelProvider;
  tier?: ModelTier;
  tools?: Tool[];
  budget?: Partial<TaskBudget>;
  signal?: AbortSignal;
  onStep?: (step: TaskStep) => void;
  /** Prose the model produced between tool calls. */
  onText?: (text: string) => void;
  /** Raw command output as it is produced, for a caller showing a terminal. */
  onOutput?: (chunk: string) => void;
  /**
   * What the turn that just finished cost, before the next one starts.
   *
   * Throwing from here stops the loop and the thrown message becomes the run's
   * summary, which is how a caller enforces a budget: a turn already paid for
   * is never discarded, and the next one never begins.
   */
  onUsage?: (usage: TokenUsage) => Promise<void>;
}

function systemPrompt(projectDir: string, tools: Tool[]): string {
  return [
    "You are a Solana engineer working inside a sandboxed Anchor workspace.",
    `The project is at ${projectDir}. Paths you pass to tools are relative to it.`,
    "",
    "The workspace has no internet access. Every crate and npm package you can",
    "use is already installed: anchor-lang with init-if-needed, anchor-spl with",
    "metadata, and for tests @coral-xyz/anchor, @solana/spl-token, chai, mocha.",
    "Adding a dependency will fail, so solve the problem with what is there.",
    "",
    "A local validator is already running and the wallet is funded.",
    "Build with `anchor build`. Deploy with `anchor deploy`. Run tests with",
    "`anchor test --skip-local-validator --skip-build --skip-deploy`.",
    "",
    "Work in small steps and check your work with the tools rather than assuming.",
    "Never claim something built, deployed, or passed unless a command you ran",
    "says so. If a command fails, read its output and fix the cause.",
    "",
    `Tools available: ${tools.map((t) => t.name).join(", ")}.`,
  ].join("\n");
}

/** Run one tool and turn it into a step plus a result block for the model. */
async function callTool(
  use: AgentToolUse,
  tools: Tool[],
  ctx: ToolContext,
  task: AgentTask,
  onStep?: (step: TaskStep) => void,
): Promise<{ type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }> {
  const tool = tools.find((candidate) => candidate.name === use.name);
  if (!tool) {
    return {
      type: "tool_result",
      tool_use_id: use.id,
      content: `No tool named ${use.name}.`,
      is_error: true,
    };
  }

  const step: TaskStep = {
    kind: tool.kind === "run" ? "exec" : tool.kind === "edit" ? "edit" : "read",
    title: describeCall(tool, use.input),
    status: "running",
  };
  task.steps.push(step);
  onStep?.(step);

  try {
    const result = await tool.handler(use.input, ctx);
    step.status = result.ok ? "done" : "failed";
    step.detail = result.summary;
    if (tool.name === "write_file") {
      const path = String(use.input.path ?? "");
      if (path && !task.changedFiles.includes(path)) task.changedFiles.push(path);
    }
    onStep?.(step);
    return {
      type: "tool_result",
      tool_use_id: use.id,
      content: [result.summary, result.data ? String(typeof result.data === "string" ? result.data : JSON.stringify(result.data)) : ""]
        .filter(Boolean)
        .join("\n"),
      is_error: !result.ok,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    step.status = "failed";
    step.detail = message;
    onStep?.(step);
    return { type: "tool_result", tool_use_id: use.id, content: message, is_error: true };
  }
}

function describeCall(tool: Tool, input: Record<string, unknown>): string {
  if (tool.name === "run_command") return String(input.command ?? "run a command");
  if (input.path) return `${tool.name === "write_file" ? "Write" : "Read"} ${input.path}`;
  return tool.description.split(".")[0];
}

export async function runAgent(opts: RunAgentOptions): Promise<AgentTask> {
  const tools = opts.tools ?? WORKSPACE_TOOLS;
  const budget = { ...DEFAULT_BUDGET, ...opts.budget };
  const signal = opts.signal ?? new AbortController().signal;
  const tier = opts.tier ?? "default";
  const startedAt = Date.now();

  const task: AgentTask = {
    objective: opts.objective,
    steps: [],
    changedFiles: [],
    status: "failed",
    summary: "",
    toolCalls: 0,
    model: opts.provider.modelFor(tier),
    usage: { inputTokens: 0, outputTokens: 0 },
  };

  const ctx: ToolContext = {
    workspace: opts.workspace,
    projectDir: opts.projectDir,
    signal,
    onOutput: opts.onOutput,
  };
  const messages: AgentMessage[] = [
    { role: "user", content: opts.objective },
  ];
  const system = systemPrompt(opts.projectDir, tools);
  const modelTools = toModelTools(tools);

  for (let iteration = 0; iteration < budget.maxIterations; iteration += 1) {
    if (signal.aborted) {
      task.status = "cancelled";
      task.summary = "The run was cancelled.";
      return task;
    }
    if (Date.now() - startedAt > budget.maxDurationMs) {
      task.summary = `Stopped after ${Math.round(budget.maxDurationMs / 60_000)} minutes without finishing.`;
      return task;
    }

    trimHistory(messages, MAX_HISTORY);
    const turn = await opts.provider.runTurn(
      { system, messages, tools: modelTools, maxTokens: MAX_TOKENS },
      tier,
    );

    if (turn.usage) {
      task.usage.inputTokens += turn.usage.inputTokens;
      task.usage.outputTokens += turn.usage.outputTokens;
      // Reported before the turn's own output, so a caller enforcing a budget
      // stops on what was actually spent rather than on an estimate.
      try {
        await opts.onUsage?.(turn.usage);
      } catch (error) {
        task.summary =
          error instanceof Error ? error.message : "The run stopped.";
        return task;
      }
    }

    if (turn.text.trim()) opts.onText?.(turn.text.trim());

    // A declined request is not a finished one, even though it ends the turn
    // the same way. Reporting it as success would claim work that never ran.
    if (turn.stopReason === "refusal") {
      task.summary = turn.text.trim() || "The model declined this request.";
      return task;
    }

    if (turn.toolUses.length === 0) {
      task.status = "succeeded";
      task.summary = turn.text.trim() || "Finished.";
      return task;
    }

    if (task.toolCalls + turn.toolUses.length > budget.maxToolCalls) {
      task.summary = `Stopped at the ${budget.maxToolCalls} tool call limit.`;
      return task;
    }

    messages.push({ role: "assistant", content: turn.raw });

    const results = [];
    for (const use of turn.toolUses) {
      task.toolCalls += 1;
      results.push(await callTool(use, tools, ctx, task, opts.onStep));
    }
    messages.push({ role: "user", content: results });
  }

  task.summary = `Stopped after ${budget.maxIterations} turns without finishing.`;
  return task;
}
