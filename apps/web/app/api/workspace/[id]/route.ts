import { isWorkspaceOpen } from "../../../../lib/workspace/gate";
import { destroyWorkspace } from "../../../../lib/workspace/registry";

/**
 * Release a workspace. The client calls this when the tab goes away, so a
 * container does not sit idle until its TTL for a visitor who already left.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!isWorkspaceOpen()) return new Response(null, { status: 404 });

  const { id } = await params;
  const destroyed = await destroyWorkspace(id);
  return Response.json({ destroyed });
}
