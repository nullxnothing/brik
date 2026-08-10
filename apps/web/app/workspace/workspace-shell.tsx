"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrikLoader, BrikWordmark } from "../../components/logo";
import type { Template } from "../../lib/templates";
import { StatusBadge, type Status } from "../../components/ui";
import { AgentPanel, Editor, Files, SolanaPanel, Terminal } from "./panels";
import { buildFrames, type Frame, type TerminalLine } from "./run-script";

interface RunState {
  status: Status;
  steps: string[];
  terminal: TerminalLine[];
  code: number;
  changed: string[];
  program?: string;
  tx?: string;
  balance: number;
}

const INITIAL: RunState = {
  status: "sleeping",
  steps: [],
  terminal: [],
  code: 0,
  changed: [],
  balance: 2.41,
};

function applyFrame(state: RunState, frame: Frame): RunState {
  return {
    status: frame.status ?? state.status,
    steps: frame.agent ? [...state.steps, frame.agent] : state.steps,
    terminal: frame.term ? [...state.terminal, ...frame.term] : state.terminal,
    code: frame.code ?? state.code,
    changed:
      frame.file && !state.changed.includes(frame.file)
        ? [...state.changed, frame.file]
        : state.changed,
    program: frame.program ?? state.program,
    tx: frame.tx ?? state.tx,
    balance: frame.balance ?? state.balance,
  };
}

type MobileView = "files" | "editor" | "agent";

export function WorkspaceShell({
  task,
  template,
}: {
  task: string;
  template: Template;
}) {
  const [run, setRun] = useState<RunState>(INITIAL);
  const [isRunning, setIsRunning] = useState(true);
  const [rightTab, setRightTab] = useState<"agent" | "solana">("agent");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const timers = useRef<number[]>([]);
  const frames = useMemo(() => buildFrames(template), [template]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRun(frames.reduce(applyFrame, INITIAL));
      setIsRunning(false);
      return;
    }
    setRun(INITIAL);
    setIsRunning(true);
    let elapsed = 0;
    frames.forEach((frame, index) => {
      elapsed += frame.delay;
      const id = window.setTimeout(() => {
        setRun((prev) => applyFrame(prev, frame));
        if (index === frames.length - 1) setIsRunning(false);
      }, elapsed);
      timers.current.push(id);
    });
  }, [clearTimers, frames]);

  useEffect(() => {
    play();
    return clearTimers;
  }, [play, clearTimers]);

  const isDeployed = run.status === "deployed";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" aria-label="Brik home" className="shrink-0 text-fg">
            <BrikWordmark size={18} />
          </Link>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <span className="hidden truncate font-mono text-code-sm text-fg sm:block">
            {template.project}
          </span>
          <span className="hidden font-mono text-code-sm text-fg-3 md:block">main</span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="meta-label hidden text-fg-3 lg:block">Devnet</span>
          <StatusBadge status={run.status} />
          <button
            type="button"
            onClick={play}
            className="btn btn-primary btn-compact"
            disabled={isRunning}
            aria-label={isDeployed ? "Redeploy to devnet" : "Deploy to devnet"}
          >
            {isRunning ? (
              <>
                <BrikLoader size={13} />
                <span className="hidden sm:inline">
                  {run.status === "testing" ? "Testing" : "Building"}
                </span>
              </>
            ) : isDeployed ? (
              "Redeploy"
            ) : (
              "Deploy"
            )}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 border-b border-line md:hidden">
        {(["files", "editor", "agent"] as MobileView[]).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            className={`meta-label -mb-px min-h-11 flex-1 border-b px-4 py-3 ${
              mobileView === view
                ? "border-cream text-fg"
                : "border-transparent text-fg-3"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      <main className="grid min-h-0 flex-1 md:grid-cols-[200px_1fr_300px]">
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
          className={`min-h-0 md:block ${mobileView === "editor" ? "block" : "hidden"}`}
        >
          <Editor
            revealed={run.code}
            source={template.source}
            entryFile={template.entryFile}
            secondFile={template.files[2]}
          />
        </section>

        <aside
          className={`min-h-0 border-line md:block md:border-l ${
            mobileView === "agent" ? "block" : "hidden"
          }`}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 border-b border-line">
              {(["agent", "solana"] as const).map((tab) => (
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
            <div className="min-h-0 flex-1">
              {rightTab === "agent" ? (
                <AgentPanel steps={run.steps} isRunning={isRunning} task={task} />
              ) : (
                <SolanaPanel
                  program={run.program}
                  tx={run.tx}
                  balance={run.balance}
                  hasProgram={template.entryFile.startsWith("programs/")}
                />
              )}
            </div>
          </div>
        </aside>
      </main>

      <section
        className="shrink-0 border-t border-line"
        style={{ height: isTerminalOpen ? 168 : 0 }}
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
          <span className="meta-label text-fg-3">Devnet</span>
          <span className="meta-label text-fg-3">{run.balance.toFixed(2)} SOL</span>
        </div>
      </footer>
    </div>
  );
}
