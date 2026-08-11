"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppPreview } from "../../components/app-preview";
import type { Status } from "../../components/ui";
import { Composer } from "./composer";
import { Editor, Files } from "./editor";
import { WorkspaceHeader } from "./header";
import { AgentPanel, SolanaPanel, Terminal } from "./panels";
import { releaseWorkspace, streamRun } from "./run-client";
import { applyEvent, applyFailure, initialRun, restartRun } from "./run-state";

const NOT_CONNECTED =
  "No agent is connected yet, so the workspace cannot act on your request. " +
  "It builds and deploys the project the toolchain image ships with.";

/** What the workspace is doing, for the pane that has nothing else to show. */
const STATUS_LINE: Record<Status, string> = {
  sleeping: "Starting the workspace validator.",
  ready: "Reading the project.",
  building: "Running the toolchain in the container.",
  testing: "Running the tests.",
  failed: "The run stopped.",
  deployed:
    "There is no shareable preview URL yet. The program id and the deploy transaction are in the Solana panel.",
};

type CenterTab = "preview" | "code";
type RightTab = "agent" | "solana";
/** Which pane fills the screen below md. "right" defers to the active RightTab. */
type MobileView = "files" | "editor" | "right";

const MOBILE_TABS: { label: string; view: MobileView; right?: RightTab }[] = [
  { label: "Files", view: "files" },
  { label: "App", view: "editor" },
  { label: "Agent", view: "right", right: "agent" },
  { label: "Solana", view: "right", right: "solana" },
];

export function WorkspaceShell({
  task,
  template,
}: {
  task: string;
  template: string;
}) {
  const [run, setRun] = useState(() => initialRun(task));
  const [isRunning, setIsRunning] = useState(true);
  const [centerTab, setCenterTab] = useState<CenterTab>("code");
  const isTabPinned = useRef(false);
  const [rightTab, setRightTab] = useState<RightTab>("agent");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [runToken, setRunToken] = useState(0);
  /** The live workspace, mirrored out of state so unload handlers can read it. */
  const workspaceRef = useRef<string | null>(null);
  /** Set by a redeploy, which restarts the run against the warm container
   *  instead of releasing it the way an unmount does. */
  const isRedeploy = useRef(false);

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

  // Land on the preview once there is something to look at.
  useEffect(() => {
    if (run.status === "deployed" && !isTabPinned.current) setCenterTab("preview");
  }, [run.status]);

  const selectTab = (tab: CenterTab) => {
    setCenterTab(tab);
    isTabPinned.current = true;
  };

  const redeploy = useCallback(() => {
    isRedeploy.current = true;
    if (!isTabPinned.current) setCenterTab("code");
    setRunToken((token) => token + 1);
  }, []);

  const sendMessage = (text: string) => {
    setRun((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { kind: "task", text },
        { kind: "note", text: NOT_CONNECTED },
      ],
    }));
    setRightTab("agent");
  };

  const isDeployed = run.status === "deployed";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <WorkspaceHeader
        project={run.project}
        status={run.status}
        isRunning={isRunning}
        isDeployed={isDeployed}
        onDeploy={redeploy}
      />

      <div className="flex shrink-0 border-b border-line md:hidden">
        {MOBILE_TABS.map((tab) => {
          const isActive =
            mobileView === tab.view && (!tab.right || rightTab === tab.right);
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setMobileView(tab.view);
                if (tab.right) setRightTab(tab.right);
              }}
              className={`meta-label -mb-px min-h-11 flex-1 border-b px-2 py-3 ${
                isActive ? "border-cream text-fg" : "border-transparent text-fg-3"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="grid min-h-0 flex-1 md:grid-cols-[188px_1fr_320px]">
        <aside
          className={`min-h-0 border-line md:block md:border-r ${
            mobileView === "files" ? "block" : "hidden"
          }`}
        >
          <Files files={run.files} entryFile={run.entryFile} />
        </aside>

        <section
          className={`flex min-h-0 flex-col md:flex ${
            mobileView === "editor" ? "flex" : "hidden"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line pr-4">
            <div className="flex">
              {(["preview", "code"] as CenterTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  className={`-mb-px min-h-11 border-b px-4 py-3 text-body capitalize ${
                    centerTab === tab
                      ? "border-cream text-fg"
                      : "border-transparent text-fg-3"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {centerTab === "code" && run.entryFile && (
              <span className="hidden truncate font-mono text-code-sm text-fg-3 lg:block">
                {run.entryFile}
              </span>
            )}
          </div>

          {centerTab === "code" ? (
            <Editor source={run.source} />
          ) : (
            <div className="min-h-0 flex-1">
              <AppPreview
                status={run.status}
                detail={run.failure ?? STATUS_LINE[run.status]}
              />
            </div>
          )}
        </section>

        <aside
          className={`min-h-0 border-line md:block md:border-l ${
            mobileView === "right" ? "block" : "hidden"
          }`}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="hidden shrink-0 border-b border-line md:flex">
              {(["agent", "solana"] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  className={`meta-label -mb-px min-h-11 border-b px-4 py-3 ${
                    rightTab === tab
                      ? "border-cream text-fg"
                      : "border-transparent text-fg-3"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {rightTab === "agent" ? (
              <>
                <AgentPanel entries={run.entries} isRunning={isRunning} />
                <Composer disabled={isRunning} onMessage={sendMessage} />
              </>
            ) : (
              <SolanaPanel
                wallet={run.wallet}
                program={run.program}
                tx={run.tx}
                balance={run.balance}
                expiresAt={run.expiresAt}
                ttlSeconds={run.ttlSeconds}
              />
            )}
          </div>
        </aside>
      </main>

      <section
        className="shrink-0 border-t border-line"
        style={{ height: isTerminalOpen ? 152 : 0 }}
      >
        {isTerminalOpen && <Terminal lines={run.terminal} />}
      </section>

      <footer className="flex h-9 shrink-0 items-center justify-between gap-4 border-t border-line px-4">
        <button
          type="button"
          onClick={() => setIsTerminalOpen((open) => !open)}
          className="meta-label text-fg-3 transition-colors duration-150 hover:text-fg"
          aria-expanded={isTerminalOpen}
        >
          Terminal <span className="glyph">{isTerminalOpen ? "▾" : "▴"}</span>
        </button>
        <div className="flex items-center gap-5">
          <span className="meta-label text-fg-3">Localnet</span>
          {run.balance !== undefined && (
            <span className="meta-label text-fg-3">
              {run.balance.toFixed(2)} SOL
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
