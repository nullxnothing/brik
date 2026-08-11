/**
 * Provider-agnostic types for one tool-calling turn.
 *
 * Kept free of any SDK so the loop and the tool catalog can import them without
 * pulling a vendor in. The shape follows Anthropic's tool-use protocol because
 * that is what the first provider speaks, not because the loop is bound to it.
 *
 * Adapted from the DAEMON workbench's agent turn types (recorded in the platform
 * catalog as `agent-tool-loop`), which solved this shape already.
 */

/** A tool definition handed to the model. */
export interface AgentToolDef {
  name: string;
  description: string;
  /** JSON Schema for the tool input. */
  input_schema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/** A tool invocation the model asked for. */
export interface AgentToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** One prior turn, in the provider's message shape. */
export interface AgentMessage {
  role: "user" | "assistant";
  content: unknown;
}

/** What one model call produced. */
export interface AgentTurnResult {
  /** Concatenated text blocks. */
  text: string;
  /** Tool calls requested this turn; empty when the model is done. */
  toolUses: AgentToolUse[];
  /** "tool_use" | "end_turn" | "max_tokens" | ... */
  stopReason: string;
  /**
   * The assistant content exactly as the provider returned it, pushed back into
   * the history verbatim. It has to be the original blocks: a `tool_result` is
   * only valid when the `tool_use` that asked for it is still there, and a
   * reconstruction from `text` would drop them.
   */
  raw: unknown;
  /** For budget accounting. */
  usage?: { inputTokens: number; outputTokens: number };
}

export interface TurnRequest {
  system: string;
  messages: AgentMessage[];
  tools: AgentToolDef[];
  maxTokens: number;
}

/**
 * The one thing a model vendor has to provide. Everything else in this package
 * is vendor-neutral, which is what lets the loop be exercised against a scripted
 * provider with no network and no key.
 */
export interface ModelProvider {
  readonly name: string;
  /** Which model id a tier maps to, for reporting. */
  modelFor(tier: ModelTier): string;
  runTurn(request: TurnRequest, tier: ModelTier): Promise<AgentTurnResult>;
}

/** Routing tiers per the AI cost strategy (docs/01 §4). */
export type ModelTier = "cheap" | "default" | "frontier";

/**
 * Trim history to a bounded number of turns.
 *
 * The subtlety worth keeping: a `tool_result` block is only valid when the
 * `tool_use` that asked for it is still in the conversation. Cutting a window
 * out of the middle can leave a result with no request, which the API rejects
 * outright, so any leading tool-result turn is dropped too.
 */
export function trimHistory(messages: AgentMessage[], maxTurns: number): void {
  if (messages.length <= maxTurns) return;
  messages.splice(0, messages.length - maxTurns);
  while (messages.length > 0 && isToolResultTurn(messages[0])) {
    messages.shift();
  }
}

export function isToolResultTurn(message: AgentMessage): boolean {
  return (
    message.role === "user" &&
    Array.isArray(message.content) &&
    message.content.some(
      (block) => (block as { type?: string }).type === "tool_result",
    )
  );
}
