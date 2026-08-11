import { AnthropicProvider, runAgent, type TaskStep } from "@brik/agent";
import type { Workspace } from "@brik/sandbox";
import { LineBuffer, PROJECT_DIR, sendProject, type Send } from "./run";

/**
 * One agent turn against a workspace that is already running.
 *
 * The loop and the run already agree about the world; this is the translation
 * between them. `TaskStep` becomes the step events the agent panel renders,
 * command output becomes the terminal lines the run's own commands produce,
 * and the model's prose becomes a note. Nothing here invents a step: every
 * event sent below came out of the loop, which in turn only reports what a
 * tool returned.
 *
 * Unlike a run, a turn never destroys the workspace. The visitor's page owns
 * that lease and releases it on unload; an agent failing is a normal outcome
 * and leaves a perfectly good container behind.
 */

/** A request is one message, not an essay. Bounded before it reaches a model. */
export const MAX_MESSAGE_LENGTH = 2_000;

const NO_KEY =
  "This server has no model key configured, so the agent cannot run here.";

interface TurnOptions {
  workspace: Workspace;
  objective: string;
  send: Send;
  signal: AbortSignal;
}

export async function runAgentTurn(opts: TurnOptions): Promise<void> {
  const { workspace, objective, send, signal } = opts;

  if (!process.env.ANTHROPIC_API_KEY) {
    send({ type: "note", text: NO_KEY });
    return;
  }

  const terminal = new LineBuffer(send);
  // The loop hands the same step object back when it settles, so identity is
  // what lets a running step be updated rather than appended a second time.
  const ids = new Map<TaskStep, string>();
  // Unique per turn. The client keeps every turn's steps in one list, so a
  // counter that restarts would have this turn's first step overwrite the
  // previous turn's first step instead of appending after it.
  const turn = crypto.randomUUID().slice(0, 8);
  /** The last prose sent. A turn that ends by talking rather than by running
   *  out of budget has already said its summary, and repeating it reads as the
   *  agent saying the same thing twice. */
  let lastText = "";

  const task = await runAgent({
    objective,
    workspace,
    projectDir: PROJECT_DIR,
    provider: new AnthropicProvider(),
    signal,
    onStep: (step) => {
      let id = ids.get(step);
      if (id === undefined) {
        id = `${turn}-${ids.size + 1}`;
        ids.set(step, id);
        // A run_command step's title is the command, so the prompt line comes
        // from here and the output that follows it comes from onOutput.
        if (step.kind === "exec") {
          send({ type: "term", lines: [{ text: `$ ${step.title}`, tone: "cmd" }] });
        }
      } else if (step.status !== "running") {
        terminal.flush();
      }
      send({ type: "step", id, text: step.title, state: step.status });
    },
    onText: (text) => {
      lastText = text;
      send({ type: "note", text });
    },
    onOutput: (chunk) => terminal.write(chunk),
  });

  terminal.flush();
  if (signal.aborted) return;

  // Read the project back rather than trusting what the model said it wrote.
  // Always, not only when a file tool ran: a command can edit files too.
  try {
    await sendProject(workspace, send, signal);
  } catch {
    send({
      type: "note",
      text: "The workspace stopped answering, so the editor may not match what is on disk. Deploy again to start a fresh one.",
    });
  }

  if (task.summary && task.summary !== lastText) {
    send({ type: "note", text: task.summary });
  }
}
