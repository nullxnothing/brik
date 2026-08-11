"use client";

import { useEffect, useRef, useState } from "react";
import { BrikLoader } from "../../components/logo";
import { Meter } from "../../components/ui";
import type { Entry, TerminalLine } from "../../lib/workspace/events";

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

const TTL_TICK_MS = 30_000;

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Seconds left on the workspace lease, recomputed on a coarse tick. */
function useSecondsLeft(expiresAt?: number): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAt === undefined) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), TTL_TICK_MS);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (expiresAt === undefined) return null;
  return Math.max(0, Math.round((expiresAt - now) / 1000));
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-fg-3">{term}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}

export function SolanaPanel({
  wallet,
  program,
  tx,
  balance,
  expiresAt,
  ttlSeconds,
}: {
  wallet?: string;
  program?: string;
  tx?: string;
  balance?: number;
  expiresAt?: number;
  ttlSeconds?: number;
}) {
  const secondsLeft = useSecondsLeft(expiresAt);
  const hasLease = secondsLeft !== null && ttlSeconds !== undefined;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-auto p-4">
        <dl className="space-y-3 font-mono text-code-sm">
          <Row term="Cluster" value="localnet" />
          <Row term="Wallet" value={wallet ? shortAddress(wallet) : "not funded"} />
          <Row
            term="Balance"
            value={balance === undefined ? "unknown" : `${balance.toFixed(2)} SOL`}
          />
        </dl>

        <div>
          <div className="meta-label mb-2 text-fg-3">Program</div>
          {program ? (
            <p className="rounded-control border border-hairline bg-sunken px-3 py-2 font-mono text-code-sm break-all text-fg">
              {program}
            </p>
          ) : (
            <p className="text-body text-fg-3">Not deployed yet.</p>
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

        {hasLease && (
          <Meter
            filled={Math.ceil((secondsLeft / ttlSeconds) * 10)}
            label="Workspace time left"
            value={`${Math.ceil(secondsLeft / 60)} min`}
          />
        )}
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
