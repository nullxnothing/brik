"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppPreview } from "../../components/app-preview";
import { isAnchorProject, type Template } from "../../lib/templates";
import type { Status } from "../../components/ui";
import { Composer } from "./composer";
import { WorkspaceHeader } from "./header";
import { AgentPanel, Editor, Files, SolanaPanel, Terminal } from "./panels";
import {
  buildFollowUpFrames,
  buildFrames,
  notConnectedNote,
  START_BALANCE,
  type Entry,
  type Frame,
  type TerminalLine,
} from "./run-script";

interface RunState {
  status: Status;
  entries: Entry[];
  terminal: TerminalLine[];
  code: number;
  source: string[];
  added: number[];
  changed: string[];
  program?: string;
  tx?: string;
  balance: number;
}

function applyFrame(state: RunState, frame: Frame): RunState {
  return {
    status: frame.status ?? state.status,
    entries: frame.agent
      ? [...state.entries, { kind: "step", text: frame.agent }]
      : state.entries,
    terminal: frame.term
      ? [...(frame.clearTerm ? [] : state.terminal), ...frame.term]
      : state.terminal,
    code: frame.code ?? state.code,
    source: frame.source ?? state.source,
    added: frame.added ?? state.added,
    changed:
      frame.file && !state.changed.includes(frame.file)
        ? [...state.changed, frame.file]
        : state.changed,
    program: frame.program ?? state.program,
    tx: frame.tx ?? state.tx,
    balance: frame.balance ?? state.balance,
  };
}

function makeInitial(template: Template, task: string): RunState {
  return {
    status: "sleeping",
    entries: [{ kind: "task", text: task }],
    terminal: [],
    code: 0,
    source: template.source,
    added: [],
    changed: [],
    balance: START_BALANCE,
  };
}

const STATUS_LINE: Record<Status, string> = {
  sleeping: "Starting the validator.",
  ready: "Reading the project.",
  building: "Compiling your program.",
  testing: "Running the tests.",
  failed: "Fixing a build error.",
  deployed: "Deployed.",
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
  template: Template;
}) {
  const [run, setRun] = useState<RunState>(() => makeInitial(template, task));
  const [isRunning, setIsRunning] = useState(true);
  const [hasUsedSuggestion, setHasUsedSuggestion] = useState(false);
  const [centerTab, setCenterTab] = useState<CenterTab>("code");
  const isTabPinned = useRef(false);
  const [rightTab, setRightTab] = useState<RightTab>("agent");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  const runFrames = useCallback(
    (frames: Frame[], from: RunState) => {
      clearTimers();
      setIsRunning(true);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setRun(frames.reduce(applyFrame, from));
        setIsRunning(false);
        return;
      }
      setRun(from);
      let elapsed = 0;
      frames.forEach((frame, index) => {
        elapsed += frame.delay;
        const id = window.setTimeout(() => {
          setRun((prev) => applyFrame(prev, frame));
          if (index === frames.length - 1) setIsRunning(false);
        }, elapsed);
        timers.current.push(id);
      });
    },
    [clearTimers],
  );

  const play = useCallback(() => {
    setHasUsedSuggestion(false);
    if (!isTabPinned.current) setCenterTab("code");
    runFrames(buildFrames(template), makeInitial(template, task));
  }, [runFrames, template, task]);

  useEffect(() => {
    play();
    return clearTimers;
  }, [play, clearTimers]);

  // Land on the preview once there is something to look at.
  useEffect(() => {
    if (run.status === "deployed" && !isTabPinned.current) setCenterTab("preview");
  }, [run.status]);

  const selectTab = (tab: CenterTab) => {
    setCenterTab(tab);
    isTabPinned.current = true;
  };

  const runSuggestion = () => {
    setHasUsedSuggestion(true);
    if (!isTabPinned.current) setCenterTab("code");
    runFrames(buildFollowUpFrames(template), {
      ...run,
      status: "ready",
      entries: [...run.entries, { kind: "task", text: template.followUp.chip }],
    });
  };

  const sendMessage = (text: string) => {
    const note = notConnectedNote(isDeployed && !hasUsedSuggestion);
    setRun((prev) => ({
      ...prev,
      entries: [...prev.entries, { kind: "task", text }, { kind: "note", text: note }],
    }));
    setRightTab("agent");
  };

  const isDeployed = run.status === "deployed";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <WorkspaceHeader
        project={template.project}
        status={run.status}
        isRunning={isRunning}
        isDeployed={isDeployed}
        onDeploy={play}
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
          <Files
            files={template.files}
            entryFile={template.entryFile}
            changed={run.changed}
          />
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
            {centerTab === "code" && (
              <span className="hidden truncate font-mono text-code-sm text-fg-3 lg:block">
                {template.entryFile}
              </span>
            )}
          </div>

          {centerTab === "code" ? (
            <Editor revealed={run.code} source={run.source} added={run.added} />
          ) : (
            <div className="min-h-0 flex-1">
              <AppPreview
                slug={template.slug}
                url={`https://${template.project}.brik.app`}
                isDeployed={isDeployed}
                statusLine={STATUS_LINE[run.status]}
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
                <Composer
                  suggestion={
                    isDeployed && !hasUsedSuggestion
                      ? template.followUp.chip
                      : undefined
                  }
                  disabled={isRunning}
                  onSuggestion={runSuggestion}
                  onMessage={sendMessage}
                />
              </>
            ) : (
              <SolanaPanel
                program={run.program}
                tx={run.tx}
                balance={run.balance}
                hasProgram={isAnchorProject(template)}
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
          <span className="meta-label text-fg-3">{run.balance.toFixed(2)} SOL</span>
        </div>
      </footer>
    </div>
  );
}
