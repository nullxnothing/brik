import type { Status } from "../../components/ui";

/**
 * The wire protocol between the workspace route and the workspace UI.
 *
 * The route streams these as newline-delimited JSON while a run is in flight;
 * the client folds them into its run state in arrival order. Every value here
 * is measured inside the container, so nothing in this file may be synthesised
 * on either side.
 */

export type TerminalTone = "cmd" | "ok" | "err" | "muted";

export interface TerminalLine {
  text: string;
  tone?: TerminalTone;
}

/** Agent stream item. `task` is the objective, `note` is the workspace talking. */
export type Entry =
  | { kind: "task"; text: string }
  | { kind: "step"; text: string }
  | { kind: "note"; text: string };

export type RunEvent =
  /** Always first: the container exists from here on. */
  | {
      type: "workspace";
      id: string;
      provider: string;
      expiresAt: number;
      ttlSeconds: number;
    }
  | { type: "status"; status: Status }
  /** Appends a step to the agent panel; earlier steps are marked complete. */
  | { type: "step"; text: string }
  | { type: "term"; lines: TerminalLine[] }
  /** The project as it actually exists in the container. */
  | { type: "project"; name: string; entryFile: string; files: string[]; source: string[] }
  | { type: "wallet"; address: string; balance: number }
  | { type: "balance"; balance: number }
  | { type: "program"; id: string }
  | { type: "tx"; signature: string }
  /** Terminal: the run stopped here and the reason is user-facing. */
  | { type: "failed"; message: string };

const ERROR_LINE = /^(error(\[[^\]]+\])?:|error:|thread '.*' panicked)/i;
const SUCCESS_LINE =
  /(Deploy success|Finished `?(release|test)`? profile|Validator ready|^Program Id:)/;

/** Classify a raw output line for the terminal. Presentation only. */
export function toneFor(line: string): TerminalTone {
  const trimmed = line.trim();
  if (ERROR_LINE.test(trimmed)) return "err";
  if (SUCCESS_LINE.test(trimmed)) return "ok";
  return "muted";
}
