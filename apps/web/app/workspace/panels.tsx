"use client";

import { useEffect, useRef } from "react";
import { BrikLoader } from "../../components/logo";
import { Meter } from "../../components/ui";
import type { Entry, TerminalLine } from "./run-script";

const KEYWORDS = new Set([
  "use", "pub", "fn", "mod", "let", "mut", "super", "impl", "struct",
  "import", "from", "export", "async", "const", "return", "function", "new",
  "typeof", "await", "if",
]);

/** Monochrome highlighting: value, not hue. Keywords carry the emphasis. */
function CodeLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (trimmed.startsWith("#[") || trimmed.startsWith("//")) {
    return <span className="text-fg-3">{line}</span>;
  }
  const parts = line.split(/([A-Za-z_][A-Za-z0-9_]*|"[^"]*")/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('"')) {
          return (
            <span key={i} className="text-cream/70">
              {part}
            </span>
          );
        }
        if (KEYWORDS.has(part)) {
          return (
            <span key={i} className="font-medium text-cream">
              {part}
            </span>
          );
        }
        if (/^[A-Za-z_]/.test(part)) {
          return (
            <span key={i} className="text-fg">
              {part}
            </span>
          );
        }
        return (
          <span key={i} className="text-fg-3">
            {part}
          </span>
        );
      })}
    </>
  );
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

export function Editor({
  revealed,
  source,
  added,
}: {
  revealed: number;
  source: string[];
  added: number[];
}) {
  const addedSet = new Set(added);
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4 font-mono text-code leading-[1.7]">
      <pre className="min-w-max">
        {source.slice(0, revealed).map((line, i) => {
          const isAdded = addedSet.has(i);
          return (
            <div
              key={i}
              className="flex"
              style={isAdded ? { background: "var(--brik-ok-tint)" } : undefined}
            >
              <span className="w-9 shrink-0 select-none text-right text-fg-3">
                {i + 1}
              </span>
              <span
                className={`w-5 shrink-0 select-none text-center ${
                  isAdded ? "text-ok" : "text-transparent"
                }`}
                aria-hidden
              >
                +
              </span>
              <span>
                <CodeLine line={line} />
              </span>
            </div>
          );
        })}
        {revealed > 0 && revealed < source.length && (
          <div className="flex">
            <span className="w-9 shrink-0 select-none text-right text-fg-3">
              {revealed + 1}
            </span>
            <span className="w-5 shrink-0" aria-hidden />
            <span className="inline-block h-[1.2em] w-[7px] translate-y-[3px] bg-cream" />
          </div>
        )}
      </pre>
    </div>
  );
}

export function Files({
  files,
  entryFile,
  changed,
}: {
  files: string[];
  entryFile: string;
  changed: string[];
}) {
  return (
    <div className="overflow-auto p-3">
      <div className="meta-label px-2 pb-3 text-fg-3">Files</div>
      {files.map((path) => {
        const isActive = path === entryFile;
        return (
          <div
            key={path}
            className={`flex items-center justify-between gap-2 rounded-control px-2 py-1.5 font-mono text-code-sm ${
              isActive ? "bg-selected text-fg" : "text-fg-2"
            }`}
          >
            <span className="truncate">{fileName(path)}</span>
            {changed.includes(path) && <span className="text-warn">M</span>}
          </div>
        );
      })}
    </div>
  );
}

export function AgentPanel({
  entries,
  isRunning,
}: {
  entries: Entry[];
  isRunning: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastStep = entries.map((e) => e.kind).lastIndexOf("step");

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
      {entries.map((entry, i) => {
        if (entry.kind === "task") {
          return (
            <p
              key={i}
              className="border-l border-cream pl-3 text-body font-medium text-fg first:mt-0 [&:not(:first-child)]:mt-6"
            >
              {entry.text}
            </p>
          );
        }
        if (entry.kind === "note") {
          return (
            <p key={i} className="text-body text-fg-3">
              {entry.text}
            </p>
          );
        }
        const isActive = i === lastStep && isRunning;
        return (
          <div key={i} className="flex gap-3 text-body">
            <span className="mt-0.5 shrink-0 text-fg-3">
              {isActive ? (
                <BrikLoader size={14} />
              ) : (
                <span className="text-ok" aria-hidden>
                  ✓
                </span>
              )}
            </span>
            <span className={isActive ? "text-fg" : "text-fg-2"}>{entry.text}</span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export function SolanaPanel({
  program,
  tx,
  balance,
  hasProgram,
}: {
  program?: string;
  tx?: string;
  balance: number;
  hasProgram: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-auto p-4">
        <dl className="space-y-3 font-mono text-code-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-3">Cluster</dt>
            <dd className="text-fg">localnet</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-3">Wallet</dt>
            <dd className="text-fg">Bq4v…7Yhz</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-3">Balance</dt>
            <dd className="text-fg">{balance.toFixed(2)} SOL</dd>
          </div>
        </dl>

        <div>
          <div className="meta-label mb-2 text-fg-3">Program</div>
          {program ? (
            <p className="rounded-control border border-hairline bg-sunken px-3 py-2 font-mono text-code-sm break-all text-fg">
              {program}
            </p>
          ) : (
            <p className="text-body text-fg-3">
              {hasProgram ? "Not deployed yet." : "This project has no program."}
            </p>
          )}
        </div>

        <div>
          <div className="meta-label mb-2 text-fg-3">Recent transactions</div>
          {tx ? (
            <div className="rounded-control border border-hairline bg-sunken px-3 py-2">
              <p className="font-mono text-code-sm break-all text-fg-2">
                {tx.slice(0, 22)}…
              </p>
              <p className="meta-label mt-1.5 text-ok">Confirmed</p>
            </div>
          ) : (
            <p className="text-body text-fg-3">No transactions yet.</p>
          )}
        </div>

        <Meter filled={2} label="Workspace hours" value="0.4 / 5" />
      </div>
    </div>
  );
}

const TERMINAL_TONE: Record<string, string> = {
  cmd: "text-fg",
  ok: "text-ok",
  err: "text-err",
  muted: "text-fg-3",
};

export function Terminal({ lines }: { lines: TerminalLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length]);

  return (
    <div className="literal h-full overflow-auto bg-sunken p-4 font-mono text-code-sm leading-[1.8]">
      {lines.map((line, i) => (
        <div key={i} className={TERMINAL_TONE[line.tone ?? "muted"]}>
          {line.text}
        </div>
      ))}
      <div ref={endRef} className="text-fg-2">
        ${" "}
        <span className="inline-block h-[1em] w-[7px] translate-y-[2px] bg-fg-3" />
      </div>
    </div>
  );
}
