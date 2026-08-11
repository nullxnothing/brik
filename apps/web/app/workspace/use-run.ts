"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readStoredKey, storeKey } from "./composer";
import { releaseWorkspace, streamAgent, streamRun } from "./run-client";
import { applyEvent, applyFailure, initialRun, restartRun } from "./run-state";

const NO_WORKSPACE =
  "There is no workspace running to act on. Deploy to start one, then ask again.";

/**
 * The run: one container, its event stream, and the agent turns taken against
 * it. Everything the shell displays is folded from here, so the shell itself
 * holds only layout, and nothing on screen is synthesised on this side.
 */
export function useRun(task: string, template: string) {
  const [run, setRun] = useState(() => initialRun(task));
  const [isRunning, setIsRunning] = useState(true);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  /** The turn in flight, so a redeploy or a closed tab can call it off. */
  const agentRef = useRef<AbortController | null>(null);
  /** The visitor's own model key, if they gave one. Read from their tab after
   *  mount so the server and the client render the same first pass. */
  const [modelKey, setModelKey] = useState("");
  const [runToken, setRunToken] = useState(0);
  /** The live workspace, mirrored out of state so unload handlers can read it. */
  const workspaceRef = useRef<string | null>(null);
  /** Set by a redeploy, which restarts the run against the warm container
   *  instead of releasing it the way an unmount does. */
  const isRedeploy = useRef(false);

  useEffect(() => setModelKey(readStoredKey()), []);

  const rememberKey = useCallback((key: string) => {
    storeKey(key);
    setModelKey(key);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsRunning(true);
    setRun((prev) => (prev.workspaceId ? restartRun(prev) : prev));

    streamRun(
      { workspaceId: workspaceRef.current ?? undefined, template },
      controller.signal,
      (event) => {
        if (controller.signal.aborted) return;
        if (event.type === "workspace") workspaceRef.current = event.id;
        if (event.type === "failed") workspaceRef.current = null;
        setRun((prev) => applyEvent(prev, event));
      },
    )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        workspaceRef.current = null;
        setRun((prev) =>
          applyFailure(
            prev,
            error instanceof Error ? error.message : "The workspace run stopped.",
          ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRunning(false);
      });

    return () => {
      controller.abort();
      if (isRedeploy.current) {
        isRedeploy.current = false;
        return;
      }
      const id = workspaceRef.current;
      workspaceRef.current = null;
      if (id) releaseWorkspace(id);
    };
  }, [runToken, template]);

  // A closed tab must not leave a container running until its TTL.
  useEffect(() => {
    const release = () => {
      if (workspaceRef.current) releaseWorkspace(workspaceRef.current);
    };
    window.addEventListener("pagehide", release);
    return () => window.removeEventListener("pagehide", release);
  }, []);

  // An abandoned turn must not hold the container past the page that asked
  // for it, and a redeploy would otherwise race the agent for the same files.
  useEffect(() => () => agentRef.current?.abort(), []);

  const redeploy = useCallback(() => {
    agentRef.current?.abort();
    agentRef.current = null;
    setIsAgentRunning(false);
    isRedeploy.current = true;
    setRunToken((token) => token + 1);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const workspaceId = workspaceRef.current;
      if (!workspaceId) {
        setRun((prev) => ({
          ...prev,
          entries: [
            ...prev.entries,
            { kind: "task", text },
            { kind: "note", text: NO_WORKSPACE },
          ],
        }));
        return;
      }

      setRun((prev) => ({
        ...prev,
        entries: [...prev.entries, { kind: "task", text }],
      }));

      const controller = new AbortController();
      agentRef.current = controller;
      setIsAgentRunning(true);

      streamAgent(
        { workspaceId, message: text, apiKey: modelKey || undefined },
        controller.signal,
        (event) => {
          if (controller.signal.aborted) return;
          setRun((prev) => applyEvent(prev, event));
        },
      )
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setRun((prev) =>
            applyEvent(prev, {
              type: "note",
              text:
                error instanceof Error ? error.message : "The agent turn stopped.",
            }),
          );
        })
        .finally(() => {
          if (agentRef.current === controller) agentRef.current = null;
          if (!controller.signal.aborted) setIsAgentRunning(false);
        });
    },
    [modelKey],
  );

  return {
    run,
    isRunning,
    isAgentRunning,
    modelKey,
    rememberKey,
    redeploy,
    sendMessage,
  };
}

/** The five steps a run takes, spread across fourteen meter segments. A
 *  segment latches when a step completes; nothing here is on a timer. */
const RUN_STEPS = 5;
const SEGMENTS = 14;

export function litSegments(
  entries: { kind: string }[],
  status: string,
  isRunning: boolean,
): number {
  if (status === "deployed") return SEGMENTS;
  const started = entries.filter((entry) => entry.kind === "step").length;
  const done = Math.max(0, isRunning ? started - 1 : started);
  return Math.min(SEGMENTS, Math.round((done / RUN_STEPS) * SEGMENTS));
}
