"use client";

import type { Status } from "../../components/ui";
import { SegmentMeter, type LampState } from "../../components/chassis";

/**
 * The status foot: a readout strip, not a status bar with a spinner in it.
 *
 * The meter latches a segment as the run completes a step, so it measures the
 * toolchain rather than pacing an animation against it. Every number here is
 * tabular.
 */

const FOOT_STATUS: Record<Status, string> = {
  sleeping: "SLEEPING",
  ready: "READY",
  building: "BUILDING",
  testing: "TESTING",
  failed: "FAILED",
  deployed: "DEPLOYED",
};

const FOOT_COLOR: Record<Status, string> = {
  sleeping: "var(--brik-etch)",
  ready: "var(--brik-etch)",
  building: "var(--brik-lamp-busy-fg)",
  testing: "var(--brik-lamp-busy-fg)",
  failed: "var(--brik-lamp-fail-fg)",
  deployed: "var(--brik-lamp-live-fg)",
};

const METER_TONE: Record<Status, LampState> = {
  sleeping: "busy",
  ready: "busy",
  building: "busy",
  testing: "busy",
  failed: "fail",
  deployed: "live",
};

export function StatusFoot({
  status,
  lit,
  balance,
  isTerminalOpen,
  onToggleTerminal,
  modifier,
}: {
  status: Status;
  /** Segments latched, out of fourteen. Derived from completed run steps. */
  lit: number;
  balance?: number;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  modifier: string;
}) {
  return (
    <footer className="brik-chassis-bar-foot flex h-9 shrink-0 items-center justify-between gap-4 px-4 font-mono text-[10.5px] tracking-[0.14em] text-[var(--brik-etch-faint)] sm:px-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleTerminal}
          aria-expanded={isTerminalOpen}
          aria-keyshortcuts={`${modifier === "⌘" ? "Meta" : "Control"}+J`}
          className="brik-key shrink-0 px-3 py-[5px] tracking-[0.14em]"
          style={{ borderRadius: 5, color: "var(--brik-key-fg)" }}
        >
          TERMINAL <span aria-hidden>{isTerminalOpen ? "▾" : "▴"}</span>
        </button>
        <span
          className="hidden min-w-[92px] [text-shadow:0_1px_0_rgba(0,0,0,.9)] sm:inline"
          style={{ color: FOOT_COLOR[status] }}
        >
          {FOOT_STATUS[status]}
        </span>
        <SegmentMeter lit={lit} tone={METER_TONE[status]} label="Run progress" />
      </div>

      <div className="flex shrink-0 items-center gap-4 sm:gap-[18px]">
        {balance !== undefined && (
          <span className="brik-figures hidden [text-shadow:0_1px_0_rgba(0,0,0,.9)] sm:inline">
            {balance.toFixed(2)} SOL
          </span>
        )}
        <span className="hidden [text-shadow:0_1px_0_rgba(0,0,0,.9)] sm:inline">
          LOCALNET
        </span>
      </div>
    </footer>
  );
}
