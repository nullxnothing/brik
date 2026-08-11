/**
 * BRIK agent harness.
 *
 * A bounded tool-calling loop over a remote sandbox. The core rule: never
 * report a step done without the tool result that proves it — a model saying
 * "built successfully" is not evidence, the `ExecResult` from `anchor build` is.
 *
 * The vendor lives behind `ModelProvider` and only `anthropic.ts` imports an
 * SDK, which is what lets the loop be exercised against a scripted provider
 * with no API key and no network (`tools/verify-agent`).
 */

export {
  isToolResultTurn,
  trimHistory,
  type AgentMessage,
  type AgentToolDef,
  type AgentToolUse,
  type AgentTurnResult,
  type ModelProvider,
  type ModelTier,
  type TurnRequest,
} from "./turn.js";

export {
  LIST_FILES,
  READ_FILE,
  RUN_COMMAND,
  WORKSPACE_TOOLS,
  WRITE_FILE,
  requiresApproval,
  toModelTools,
  type Tool,
  type ToolContext,
  type ToolKind,
  type ToolResult,
  type ToolRisk,
} from "./tools.js";

export {
  DEFAULT_BUDGET,
  runAgent,
  type AgentTask,
  type RunAgentOptions,
  type StepKind,
  type TaskBudget,
  type TaskStep,
} from "./loop.js";

export { AnthropicProvider } from "./anthropic.js";
