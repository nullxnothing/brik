import { reapOrphans } from "../../../../lib/workspace/registry";

/**
 * Destroy sandboxes nobody is waiting on.
 *
 * The last way this deployment can spend money on nothing: a stream that dies
 * without the page's DELETE leaves its sandbox running until its own timeout,
 * because a client disconnect does not reach the cleanup path on a serverless
 * host the way it does locally. Capacity heals itself on the same clock, but
 * the sandbox is billed for the whole of it.
 *
 * Vercel calls this on the schedule in `vercel.json` with `CRON_SECRET` as a
 * bearer token. It is not gated on `BRIK_WORKSPACE_ENABLED`: closing the
 * workspace routes is exactly when nothing else is left to clean up after a
 * sandbox, so the reaper has to keep running.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  // Refuse when unconfigured rather than run unauthenticated: this endpoint
  // destroys things, and an open one is a way to destroy a visitor's work.
  if (!secret) return new Response(null, { status: 404 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  const result = await reapOrphans();
  return Response.json(result);
}
