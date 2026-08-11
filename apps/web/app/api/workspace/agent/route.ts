import type { RunEvent } from "../../../../lib/workspace/events";
import { MAX_MESSAGE_LENGTH, runAgentTurn } from "../../../../lib/workspace/agent";
import { isWorkspaceOpen } from "../../../../lib/workspace/gate";
import {
  assertLimitsAvailable,
  LimitError,
  spendMessage,
  visitorOf,
} from "../../../../lib/workspace/limits";
import { getWorkspace } from "../../../../lib/workspace/registry";

/**
 * Ask the agent for a change and stream what it does back.
 *
 * Same wire protocol as a run, and for the same reason: the visitor has to see
 * `anchor build` as the compiler emits it. It is a separate request because a
 * turn is a separate thing from a run, and because a run's stream is already
 * closed by the time anyone can type into the composer.
 *
 * A turn never allocates or destroys a workspace. It acts on the one the page
 * already holds, or it says there is not one.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A turn is minutes, not seconds: the two measured in a browser took 3 and 7.
 *  The loop's own budget stops at 10 minutes, so this is the outer bound. */
export const maxDuration = 800;

interface AgentRequest {
  workspaceId?: string;
  message?: string;
  /** The visitor's own Anthropic key, when they have chosen to use one. It is
   *  read out of this request and nothing else: not stored, not logged. */
  apiKey?: string;
}

/** Anthropic keys carry this prefix. Checked so a typo is refused here rather
 *  than spending a round trip to find out. */
const KEY_PREFIX = "sk-ant-";

const NO_WORKSPACE =
  "That workspace is gone, so there is nothing to act on. Deploy again to start a new one.";

function messageFor(error: unknown, ownKey: boolean): string {
  // Already a sentence written for a visitor.
  if (error instanceof LimitError) return error.message;

  const text = error instanceof Error ? error.message : String(error);
  if (/api[_ ]?key|authentication|401/i.test(text)) {
    // Whose credentials failed decides who can fix it, so the message has to
    // say which. Told the wrong one, a visitor debugs the wrong key.
    return ownKey
      ? "The model rejected that API key, so the agent could not run. Check the key, or remove it to go back to the included allowance."
      : "The model rejected this server's credentials, so the agent could not run.";
  }
  return `The agent stopped: ${text}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isWorkspaceOpen()) return new Response(null, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as AgentRequest;
  const objective = String(body.message ?? "")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
  if (!objective) return new Response(null, { status: 400 });

  const suppliedKey = String(body.apiKey ?? "").trim();
  if (suppliedKey && !suppliedKey.startsWith(KEY_PREFIX)) {
    return new Response(null, { status: 400 });
  }

  const encoder = new TextEncoder();
  const gone = new AbortController();
  if (request.signal.aborted) gone.abort();
  else request.signal.addEventListener("abort", () => gone.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: RunEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
          gone.abort();
        }
      };

      try {
        assertLimitsAvailable();
        const lease = body.workspaceId
          ? await getWorkspace(body.workspaceId)
          : null;
        if (!lease) {
          send({ type: "note", text: NO_WORKSPACE });
          return;
        }
        // After the workspace is known, so a request that was never going to
        // run does not count against the visitor. The flood guard applies on
        // the visitor's own key too: it bounds requests, not spend.
        const visitor = visitorOf(request);
        await spendMessage(visitor);
        await runAgentTurn({
          workspace: lease.workspace,
          objective,
          send,
          signal: gone.signal,
          visitor,
          apiKey: suppliedKey || undefined,
        });
      } catch (error) {
        if (!gone.signal.aborted) {
          send({ type: "note", text: messageFor(error, Boolean(suppliedKey)) });
        }
      } finally {
        open = false;
        try {
          controller.close();
        } catch {
          // Already closed by the client going away.
        }
      }
    },
    cancel() {
      gone.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
