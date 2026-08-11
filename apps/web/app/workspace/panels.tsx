"use client";

import { useEffect, useRef, useState } from "react";
import { BrikLoader } from "../../components/logo";
import type { Entry, TerminalLine } from "../../lib/workspace/events";
import { Etch } from "./chassis";

/**
 * The agent stream stays a task runner, never chat bubbles: an objective with a
 * knurled left rule, then the steps, each one a command the workspace ran.
 */
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
      {entries.map((entry, i) => {
        if (entry.kind === "task") {
          return (
            <p
              key={i}
              className="border-l-2 border-[var(--brik-grip)] pl-3.5 text-body font-medium text-fg [&:not(:first-child)]:mt-3"
            >
              {entry.text}
            </p>
          );
        }
        if (entry.kind === "note") {
          return (
            <p key={i} className="text-[13.5px] leading-[1.65] text-[#8a8a84]">
              {entry.text}
            </p>
          );
        }
        // A step that reported how it ended says so; one that did not falls
        // back to the run's convention, where the last step is the live one.
        const isActive = entry.state
          ? entry.state === "running"
          : i === lastStep && isRunning;
        const hasFailed = entry.state === "failed";
        return (
          <div key={i} className="flex gap-3 text-body">
            <span className="mt-0.5 shrink-0 text-fg-3">
              {isActive ? (
                <BrikLoader size={14} />
              ) : (
                <span className={hasFailed ? "text-err" : "text-ok"} aria-hidden>
                  {hasFailed ? "✗" : "✓"}
                </span>
              )}
            </span>
            <span className={isActive ? "text-fg" : "text-fg-2"}>
              {hasFailed && <span className="sr-only">Failed: </span>}
              {entry.text}
            </span>
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

/** A reading on the case: etched term, measured value. */
function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="tracking-[0.12em] text-[var(--brik-etch-dim)]">{term}</dt>
      <dd className="brik-figures truncate text-[#8a8a84]">{value}</dd>
    </div>
  );
}

/** A value long enough to need its own well. */
function Readout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="brik-etch mb-2 block text-[10px]">{label}</div>
      {children}
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
    <div className="min-h-0 flex-1 space-y-6 overflow-auto p-5">
      <dl className="space-y-2.5 font-mono text-[11.5px]">
        <Row term="CLUSTER" value="localnet" />
        <Row term="WALLET" value={wallet ? shortAddress(wallet) : "--"} />
        <Row
          term="BALANCE"
          value={balance === undefined ? "--" : `${balance.toFixed(2)} SOL`}
        />
        {hasLease && (
          <Row
            term="LEASE"
            value={`${Math.ceil(secondsLeft / 60)} min left`}
          />
        )}
      </dl>

      <Readout label="PROGRAM">
        {program ? (
          <p className="brik-well break-all px-3 py-2.5 font-mono text-[11.5px] leading-[1.7] text-fg">
            {program}
          </p>
        ) : (
          <p className="text-[13.5px] leading-[1.65] text-[#8a8a84]">
            Not deployed yet.
          </p>
        )}
      </Readout>

      <Readout label="LAST TRANSACTION">
        {tx ? (
          <div className="brik-well px-3 py-2.5">
            <p className="break-all font-mono text-[11.5px] leading-[1.7] text-[#8a8a84]">
              {tx}
            </p>
            <p className="mt-1.5 font-mono text-[10px] tracking-[0.16em] text-ok">
              CONFIRMED
            </p>
          </div>
        ) : (
          <p className="text-[13.5px] leading-[1.65] text-[#8a8a84]">
            No transactions yet.
          </p>
        )}
      </Readout>
    </div>
  );
}

const TERMINAL_TONE: Record<string, string> = {
  cmd: "text-[#8a8a84]",
  ok: "text-[#8fa97a]",
  err: "text-[var(--brik-lamp-fail)]",
  muted: "text-[#6f6f6b]",
};

/**
 * The terminal screen. Darker than the panels because it emits, and the only
 * other surface in the shell allowed to.
 */
export function Terminal({
  lines,
  open,
  settled,
  labelled,
  isRunning,
}: {
  lines: TerminalLine[];
  open: boolean;
  /** The cut has finished, so the clip comes off. */
  settled: boolean;
  labelled: boolean;
  isRunning: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length]);

  return (
    <div
      className="brik-well-screen brik-scan brik-cut h-full"
      data-open={open}
      data-settled={settled}
    >
      <div className="literal absolute inset-0 overflow-auto px-[18px] pb-3.5 font-mono text-[12px] leading-[1.9] text-[#7c7c77]">
        {/* A marking on the case, not a line of output: it stays put while the
            log scrolls under it. */}
        <div className="sticky top-0 z-10 bg-[var(--brik-well-screen)] pt-3.5 pb-1.5">
          <Etch on={labelled} className="text-[10.5px]">
            TERMINAL · anchor
          </Etch>
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap ${TERMINAL_TONE[line.tone ?? "muted"]}`}
          >
            {line.text}
          </div>
        ))}
        <div ref={endRef}>
          {!isRunning && (
            <>
              <span className="text-[var(--brik-etch)]">$ </span>
              <span className="brik-caret" aria-hidden />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
