"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppPreview } from "../../components/app-preview";
import type { Status } from "../../components/ui";
import { Seam } from "./seam";
import { Composer } from "./composer";
import { Editor, Files } from "./editor";
import { StatusFoot } from "./foot";
import { WorkspaceHeader } from "./header";
import { Nameplate } from "./nameplate";
import { AgentPanel, SolanaPanel, Terminal } from "./panels";
import { useBoot } from "./use-boot";
import { usePanes } from "./use-panes";
import { litSegments, useRun } from "./use-run";
import { useShortcuts } from "./use-shortcuts";

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

/** What the lamps mean, announced. One word per state and the same six words
 *  the foot prints, so nothing is described twice in two vocabularies. */
const STATUS_WORD: Record<Status, string> = {
  sleeping: "Sleeping",
  ready: "Ready",
  building: "Building",
  testing: "Testing",
  failed: "Failed",
  deployed: "Deployed",
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

export function WorkspaceShell({ task, template }: { task: string; template: string }) {
  const {
    run,
    isRunning,
    isAgentRunning,
    modelKey,
    rememberKey,
    redeploy,
    sendMessage,
  } = useRun(task, template);
  const boot = useBoot();
  const { sizes, dragging, startDrag, nudge } = usePanes();

  const [centerTab, setCenterTab] = useState<CenterTab>("code");
  const isTabPinned = useRef(false);
  const [rightTab, setRightTab] = useState<RightTab>("agent");
  const [isRailOpen, setIsRailOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("editor");

  // A phone has no room for a terminal and a pane at once. Keep this in sync
  // across rotation, split-screen, and browser zoom changes.
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)");
    const closeTerminalOnPhone = () => {
      if (phone.matches) setIsTerminalOpen(false);
    };

    closeTerminalOnPhone();
    phone.addEventListener("change", closeTerminalOnPhone);
    return () => phone.removeEventListener("change", closeTerminalOnPhone);
  }, []);

  // Land on the preview once there is something to look at.
  useEffect(() => {
    if (run.status === "deployed" && !isTabPinned.current) setCenterTab("preview");
  }, [run.status]);

  const selectTab = (tab: CenterTab) => {
    setCenterTab(tab);
    isTabPinned.current = true;
  };

  const build = useCallback(() => {
    if (isRunning || isAgentRunning) return;
    if (!isTabPinned.current) setCenterTab("code");
    redeploy();
  }, [isRunning, isAgentRunning, redeploy]);

  const ask = useCallback((text: string) => {
    setRightTab("agent");
    sendMessage(text);
  }, [sendMessage]);

  const showSolana = useCallback(() => {
    setRightTab("solana");
    setMobileView("right");
  }, []);

  const modifier = useShortcuts({
    onFiles: () => {
      setIsRailOpen((open) => !open);
      setMobileView("files");
    },
    onTerminal: () => setIsTerminalOpen((open) => !open),
    onBuild: build,
    onAgent: () => {
      setRightTab("agent");
      setMobileView("right");
      document.getElementById("composer")?.focus();
    },
  });

  const isBusy = isRunning || isAgentRunning;
  const isDeployed = run.status === "deployed";
  const lamps = {
    fail: run.status === "failed",
    busy: isBusy && run.status !== "failed",
    live: isDeployed && !isBusy,
  };

  return (
    <div className="h-dvh bg-[#050505] md:p-2">
      <div
        className="brik-chassis brik-power flex h-full flex-col overflow-hidden md:rounded-[var(--brik-radius-shell)]"
        data-on={boot.power}
      >
        <WorkspaceHeader
          project={run.project}
          named={boot.labels.terminal}
          lamps={boot.selfTest ?? lamps}
          status={STATUS_WORD[run.status]}
          isBusy={isBusy}
          isDeployed={isDeployed}
          onDeploy={build}
        />

        <div className="brik-chassis-bar-tabs flex shrink-0 lg:hidden">
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
                className={`min-h-11 flex-1 px-2 py-3 font-mono text-[11px] tracking-[0.14em] uppercase ${
                  isActive
                    ? "text-fg shadow-[inset_0_-2px_0_var(--brik-cream)]"
                    : "text-[var(--brik-etch)] [text-shadow:0_1px_0_rgba(0,0,0,.9)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="brik-work"
          style={
            {
              "--brik-rail": isRailOpen ? `${sizes.rail}px` : "0px",
              "--brik-seam-a": isRailOpen ? "var(--brik-seam-w)" : "0px",
              "--brik-agent": `${sizes.agent}px`,
            } as React.CSSProperties
          }
        >
          <aside
            className={`min-h-0 overflow-hidden lg:flex lg:flex-col ${
              mobileView === "files" ? "flex flex-1 flex-col" : "hidden"
            }`}
          >
            <Files
              files={run.files}
              entryFile={run.entryFile}
              open={boot.cuts.rail}
              settled={boot.settled}
              labelled={boot.labels.files}
            />
          </aside>

          {isRailOpen && (
            <Seam
              pane="rail"
              size={sizes.rail}
              visible={boot.seams.a}
              dragging={dragging === "rail"}
              onPointerDown={startDrag("rail")}
              onKeyDown={nudge("rail")}
            />
          )}

          <section
            className={`min-h-0 flex-col lg:flex ${
              mobileView === "editor" ? "flex flex-1" : "hidden"
            }`}
          >
            <div
              className="brik-chassis-bar-tabs brik-stamp-in flex h-[46px] shrink-0 items-end gap-1.5 px-4"
              data-on={boot.labels.code}
            >
              {(["preview", "code"] as CenterTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  aria-current={centerTab === tab}
                  className={`px-4 py-2 text-[14px] capitalize ${
                    centerTab === tab
                      ? "rounded-t-[var(--brik-radius-key)] border border-b-0 border-[#2C2C2C] bg-[linear-gradient(#242424,#1B1B1B)] text-fg shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_-3px_8px_-3px_rgba(0,0,0,.8)]"
                      : "text-[#8a8a84] [text-shadow:0_1px_0_rgba(0,0,0,.85)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <span className="brik-etch ml-auto hidden truncate pb-2.5 text-[11px] tracking-[0.12em] text-[var(--brik-etch-faint)] lg:block">
                {run.entryFile ?? "RUST · ANCHOR 0.31.1"}
              </span>
            </div>

            {centerTab === "code" ? (
              <Editor
                source={run.source}
                open={boot.cuts.editor}
                settled={boot.settled}
                nameplate={
                  <Nameplate
                    program={run.program}
                    wallet={run.wallet}
                    balance={run.balance}
                    modifier={modifier}
                    visible={boot.plate && run.source.length === 0}
                    leaving={run.source.length > 0}
                  />
                }
              />
            ) : (
              <div className="min-h-0 flex-1 px-4 pt-3.5 pb-3.5">
                <div className="brik-well-screen brik-scan h-full">
                  <div className="absolute inset-0 overflow-auto">
                    <AppPreview
                      status={run.status}
                      detail={run.failure ?? STATUS_LINE[run.status]}
                      action={
                        run.program
                          ? { label: "Open the Solana panel", onClick: showSolana }
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <Seam
            pane="agent"
            size={sizes.agent}
            visible={boot.seams.b}
            dragging={dragging === "agent"}
            onPointerDown={startDrag("agent")}
            onKeyDown={nudge("agent")}
          />

          <aside
            className={`min-h-0 flex-col lg:flex ${
              mobileView === "right" ? "flex flex-1" : "hidden"
            }`}
          >
            <div
              className="brik-chassis-bar-tabs brik-stamp-in hidden h-[46px] shrink-0 items-center gap-6 px-5 lg:flex"
              data-on={boot.labels.agent}
            >
              {(["agent", "solana"] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  aria-current={rightTab === tab}
                  className={`flex h-full items-center font-mono text-[11px] tracking-[0.14em] uppercase ${
                    rightTab === tab
                      ? "text-fg shadow-[inset_0_-2px_0_var(--brik-cream)]"
                      : "text-[var(--brik-etch)] [text-shadow:0_1px_0_rgba(0,0,0,.9)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {rightTab === "agent" ? (
              <>
                <AgentPanel entries={run.entries} isRunning={isBusy} />
                <Composer
                  disabled={isBusy}
                  offerKey={run.offerKey ?? false}
                  hasKey={modelKey.length > 0}
                  onKey={rememberKey}
                  onMessage={ask}
                />
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
          </aside>
        </div>

        {isTerminalOpen && (
          <>
            <Seam
              pane="terminal"
              size={sizes.terminal}
              visible={boot.seams.c}
              dragging={dragging === "terminal"}
              onPointerDown={startDrag("terminal")}
              onKeyDown={nudge("terminal")}
            />
            {/* The dragged height is a preference, not a promise. On a short
                viewport, or a desktop at 200% zoom, an unclamped terminal
                leaves the pane above it too small to work in. */}
            <div
              className="shrink-0 px-4 py-3.5"
              style={{ height: `min(${sizes.terminal + 28}px, 34vh)` }}
            >
              <Terminal
                lines={run.terminal}
                open={boot.cuts.terminal}
                settled={boot.settled}
                labelled={boot.labels.terminal}
                isRunning={isRunning}
              />
            </div>
          </>
        )}

        <StatusFoot
          status={run.status}
          lit={litSegments(run.entries, run.status, isRunning)}
          balance={run.balance}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen((open) => !open)}
        />
      </div>
    </div>
  );
}
