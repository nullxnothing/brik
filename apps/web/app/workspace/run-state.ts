import type { Status } from "../../components/ui";
import type { Entry, RunEvent, TerminalLine } from "../../lib/workspace/events";

/**
 * Everything the workspace knows about the current run, folded from the event
 * stream. A field is undefined until the workspace has reported it, so the UI
 * can say "unknown" rather than show a placeholder that reads as a measurement.
 */

/** Enough scrollback to read a failed cargo build, bounded so a long run does
 *  not grow the DOM without limit. */
const TERMINAL_SCROLLBACK = 800;

export interface RunState {
  status: Status;
  entries: Entry[];
  terminal: TerminalLine[];
  project?: string;
  entryFile?: string;
  files: string[];
  source: string[];
  wallet?: string;
  balance?: number;
  program?: string;
  tx?: string;
  workspaceId?: string;
  expiresAt?: number;
  ttlSeconds?: number;
  failure?: string;
}

export function initialRun(task: string): RunState {
  return {
    status: "sleeping",
    entries: [{ kind: "task", text: task }],
    terminal: [],
    files: [],
    source: [],
  };
}

/** Reset for a rerun, keeping what the workspace has already told us. */
export function restartRun(state: RunState): RunState {
  return { ...state, status: "sleeping", terminal: [], failure: undefined };
}

export function applyEvent(state: RunState, event: RunEvent): RunState {
  switch (event.type) {
    case "workspace":
      return {
        ...state,
        workspaceId: event.id,
        expiresAt: event.expiresAt,
        ttlSeconds: event.ttlSeconds,
      };
    case "status":
      return { ...state, status: event.status };
    case "step": {
      const step: Entry = {
        kind: "step",
        text: event.text,
        id: event.id,
        state: event.state,
      };
      const at = event.id
        ? state.entries.findIndex(
            (entry) => entry.kind === "step" && entry.id === event.id,
          )
        : -1;
      if (at < 0) return { ...state, entries: [...state.entries, step] };
      const entries = [...state.entries];
      entries[at] = step;
      return { ...state, entries };
    }
    case "note":
      return {
        ...state,
        entries: [...state.entries, { kind: "note", text: event.text }],
      };
    case "term":
      return {
        ...state,
        terminal: [...state.terminal, ...event.lines].slice(-TERMINAL_SCROLLBACK),
      };
    case "project":
      return {
        ...state,
        project: event.name,
        entryFile: event.entryFile,
        files: event.files,
        source: event.source,
      };
    case "wallet":
      return { ...state, wallet: event.address, balance: event.balance };
    case "balance":
      return { ...state, balance: event.balance };
    case "program":
      return { ...state, program: event.id };
    case "tx":
      return { ...state, tx: event.signature };
    case "failed":
      // The server discards a workspace it could not finish a run in, so the
      // lease shown here goes with it and a redeploy starts a fresh container.
      return {
        ...state,
        failure: event.message,
        entries: [...state.entries, { kind: "note", text: event.message }],
        workspaceId: undefined,
        expiresAt: undefined,
        ttlSeconds: undefined,
      };
  }
}

/** Fold a client-side failure in, so a transport error reads like any other. */
export function applyFailure(state: RunState, message: string): RunState {
  return applyEvent(applyEvent(state, { type: "status", status: "failed" }), {
    type: "failed",
    message,
  });
}
