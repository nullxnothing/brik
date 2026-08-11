import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentTurnResult,
  AgentToolUse,
  ModelProvider,
  ModelTier,
  TurnRequest,
} from "./turn.js";

/**
 * The Anthropic provider.
 *
 * This is the only file in the package that knows a vendor exists. The loop and
 * the tools speak `ModelProvider`, which is what lets the mechanics be tested
 * against a scripted provider with no key and no network.
 */

/**
 * Tier to model. `default` is where the agent actually runs; `cheap` exists for
 * work that does not need the good model, and `frontier` for the hardest tasks.
 */
const MODEL_BY_TIER: Record<ModelTier, string> = {
  cheap: "claude-haiku-4-5",
  default: "claude-opus-5",
  frontier: "claude-fable-5",
};

/**
 * Haiku 4.5 predates two parameters the newer models take, and sending either
 * to it is a 400 rather than a no-op, so the tier decides whether they go.
 */
function isCurrentGeneration(tier: ModelTier): boolean {
  return tier !== "cheap";
}

const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORT_LEVELS)[number];

/**
 * `xhigh` is the documented starting point for coding and agentic work, which
 * is exactly what this loop does. It is a starting point rather than a setting:
 * the lower levels are unusually strong on these models, so this wants a sweep
 * against real tasks once there are any to measure.
 */
function effort(): Effort {
  const configured = process.env.BRIK_AGENT_EFFORT;
  return EFFORT_LEVELS.includes(configured as Effort)
    ? (configured as Effort)
    : "xhigh";
}

/** Pull the text and the tool calls out of a response's content blocks. */
function readContent(content: Anthropic.Beta.BetaContentBlock[]): {
  text: string;
  toolUses: AgentToolUse[];
} {
  const text: string[] = [];
  const toolUses: AgentToolUse[] = [];

  for (const block of content) {
    if (block.type === "text") {
      text.push(block.text);
    } else if (block.type === "tool_use") {
      toolUses.push({
        id: block.id,
        name: block.name,
        input: (block.input ?? {}) as Record<string, unknown>,
      });
    }
  }

  return { text: text.join("\n"), toolUses };
}

export class AnthropicProvider implements ModelProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    // A bare client resolves credentials from the environment, so an explicit
    // key is only passed when one was handed in.
    this.client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  }

  modelFor(tier: ModelTier): string {
    return MODEL_BY_TIER[tier];
  }

  async runTurn(
    request: TurnRequest,
    tier: ModelTier,
  ): Promise<AgentTurnResult> {
    const current = isCurrentGeneration(tier);

    // Streamed because a turn that thinks and then writes a file can run long
    // enough to hit a request timeout, not because anything reads the deltas.
    const stream = this.client.beta.messages.stream({
      model: this.modelFor(tier),
      max_tokens: request.maxTokens,
      system: request.system,
      messages: request.messages as Anthropic.Beta.BetaMessageParam[],
      tools: request.tools,
      ...(current ? { output_config: { effort: effort() } } : {}),
      // Safety classifiers can decline a request outright. Left alone that ends
      // the run; this re-runs the declined turn on another model server side,
      // which matters here because Solana work sits close enough to the
      // security topics the classifiers watch to trip them occasionally.
      ...(current
        ? {
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default" as const,
          }
        : {}),
    });

    const message = await stream.finalMessage();
    const { text, toolUses } = readContent(message.content);

    // Checked before the content is used: on a refusal the blocks are empty or
    // half-written, so treating them as an answer reports nonsense as work.
    if (message.stop_reason === "refusal") {
      return {
        text:
          "The model declined this request." +
          (message.stop_details && "explanation" in message.stop_details
            ? ` ${message.stop_details.explanation}`
            : ""),
        toolUses: [],
        stopReason: "refusal",
        raw: message.content,
      };
    }

    return {
      text,
      toolUses,
      stopReason: message.stop_reason ?? "end_turn",
      raw: message.content,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
