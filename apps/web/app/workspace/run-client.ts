import type { RunEvent } from "../../lib/workspace/events";

/** Client half of the workspace protocol: post a run, read its events. */

export async function streamRun(
  workspaceId: string | undefined,
  signal: AbortSignal,
  onEvent: (event: RunEvent) => void,
): Promise<void> {
  const response = await fetch("/api/workspace/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceId }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`The workspace server answered ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line) as RunEvent);
    }
  }
}

/** Best effort: `keepalive` so it still lands from a page that is unloading. */
export function releaseWorkspace(id: string): void {
  void fetch(`/api/workspace/${id}`, {
    method: "DELETE",
    keepalive: true,
  }).catch(() => {});
}
