import { DEFAULT_TEMPLATE, findTemplate } from "../../../../lib/templates";
import type { RunEvent } from "../../../../lib/workspace/events";
import { isWorkspaceOpen } from "../../../../lib/workspace/gate";
import {
  CapacityError,
  createWorkspace,
  destroyWorkspace,
  getWorkspace,
  WORKSPACE_TTL_SECONDS,
} from "../../../../lib/workspace/registry";
import { runWorkspace } from "../../../../lib/workspace/run";

/**
 * Start a workspace and stream the run back as newline-delimited JSON.
 *
 * Streaming rather than polling because the terminal is the product: the
 * client has to see `anchor build` output as the compiler emits it, not after
 * it finishes.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RunRequest {
  /** Reuse a warm workspace so a redeploy skips container start and validator
   *  boot. Ignored if the lease is gone. */
  workspaceId?: string;
  /** Which template to start. Falls back to the default rather than failing,
   *  because an unknown slug is a stale link, not an error worth a dead end. */
  template?: string;
}

async function leaseFor(body: RunRequest) {
  const existing = body.workspaceId ? getWorkspace(body.workspaceId) : null;
  if (existing) return existing;
  const created = await createWorkspace();
  return { workspace: created.workspace, expiresAt: created.expiresAt };
}

function messageFor(error: unknown): string {
  // Already a sentence written for a visitor, so it goes through untouched.
  if (error instanceof CapacityError) return error.message;

  const text = error instanceof Error ? error.message : String(error);
  if (/ENOENT/.test(text)) {
    return "Docker is not reachable from the server. Start Docker Desktop and try again.";
  }
  if (/No such image|pull access denied|manifest unknown/i.test(text)) {
    return "The toolchain image is missing. Build infra/toolchain-image first.";
  }
  return text;
}

export async function POST(request: Request): Promise<Response> {
  // Before the body is read, because past this line a container gets started.
  if (!isWorkspaceOpen()) return new Response(null, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as RunRequest;
  const encoder = new TextEncoder();

  // A visitor who closes the tab must take their container with them. Next
  // reports that as an aborted request; the response stream also gets
  // cancelled, and a failed enqueue proves it independently of both.
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

      let workspaceId: string | null = null;
      let keepWorkspace = false;
      try {
        const lease = await leaseFor(body);
        workspaceId = lease.workspace.id;
        send({
          type: "workspace",
          id: lease.workspace.id,
          provider: lease.workspace.provider,
          expiresAt: lease.expiresAt,
          ttlSeconds: WORKSPACE_TTL_SECONDS,
        });
        keepWorkspace = await runWorkspace({
          workspace: lease.workspace,
          template: findTemplate(body.template) ?? DEFAULT_TEMPLATE,
          send,
          signal: gone.signal,
        });
      } catch (error) {
        if (!gone.signal.aborted) {
          send({ type: "status", status: "failed" });
          send({ type: "failed", message: messageFor(error) });
        }
      } finally {
        open = false;
        // A deployed workspace stays warm for a redeploy. Anything else, the
        // container is dead or in an unknown state and goes now.
        if (workspaceId && !keepWorkspace) await destroyWorkspace(workspaceId);
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
      // Proxies that buffer would hold the build output back until the run ends.
      "x-accel-buffering": "no",
    },
  });
}
