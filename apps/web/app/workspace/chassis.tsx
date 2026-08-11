"use client";

import { PANES, type Pane } from "./use-panes";

/**
 * The parts of the case: lamps, the annunciator they sit in, the segment meter,
 * and the seams between the three moulded parts of the shell.
 *
 * Everything here is structure or readout. Nothing here is decoration, and
 * nothing here glows that is not a lamp or a screen.
 */

export type LampState = "fail" | "busy" | "live";

export function Lamp({ state, on }: { state: LampState; on: boolean }) {
  return (
    <span className="brik-lamp" data-state={state} data-on={on} aria-hidden>
      <i />
    </span>
  );
}

const LAMP_FG: Record<LampState, string> = {
  fail: "var(--brik-lamp-fail-fg)",
  busy: "var(--brik-lamp-busy-fg)",
  live: "var(--brik-lamp-live-fg)",
};

const LAMPS: { state: LampState; label: string }[] = [
  { state: "fail", label: "Fail" },
  { state: "busy", label: "Busy" },
  { state: "live", label: "Live" },
];

export interface Lamps {
  fail: boolean;
  busy: boolean;
  live: boolean;
}

/** The lamp cluster, punched into the top bar. The label carries the state for
 *  anyone who cannot see the colour; the live region announces the change. */
export function Annunciator({ lamps, status }: { lamps: Lamps; status: string }) {
  return (
    <div className="brik-annunciator">
      {LAMPS.map(({ state, label }) => (
        <div key={state} className="flex items-center gap-2">
          <Lamp state={state} on={lamps[state]} />
          <span
            className="brik-lamp-text hidden font-mono text-[10px] tracking-[0.16em] sm:inline"
            data-on={lamps[state]}
            style={{ color: LAMP_FG[state] }}
            aria-hidden
          >
            {label.toUpperCase()}
          </span>
        </div>
      ))}
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  );
}

const SEGMENTS = 14;

/**
 * A readout, not a spinner: segments latch on in discrete ticks as the run
 * completes steps, amber while it works and green once it is live.
 */
export function SegmentMeter({
  lit,
  tone,
  label,
}: {
  lit: number;
  tone: LampState;
  label: string;
}) {
  const pct = Math.round((lit / SEGMENTS) * 100);
  return (
    <>
      <span
        className="brik-meter"
        role="img"
        aria-label={`${label}: ${pct}% complete`}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span key={i} data-lit={i < lit ? tone : undefined} />
        ))}
      </span>
      <span className="brik-figures text-[var(--brik-etch)]" aria-hidden>
        {String(pct).padStart(3, "0")}%
      </span>
    </>
  );
}

interface SeamProps {
  pane: Pane;
  size: number;
  visible: boolean;
  dragging: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

const SEAM_LABEL: Record<Pane, string> = {
  rail: "Resize the file rail",
  agent: "Resize the agent panel",
  terminal: "Resize the terminal",
};

/**
 * A joint with tolerance. Grips only where you grab: every seam that renders
 * here drags, so every one of them is knurled.
 */
export function Seam({
  pane,
  size,
  visible,
  dragging,
  onPointerDown,
  onKeyDown,
}: SeamProps) {
  const bounds = PANES[pane];
  const isVertical = bounds.axis === "x";
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={SEAM_LABEL[pane]}
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      aria-valuenow={size}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      className={isVertical ? "brik-seam-v" : "brik-seam-h"}
      data-dragging={dragging}
      style={{ opacity: visible ? 1 : 0 }}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <span className={isVertical ? "brik-grip-v" : "brik-grip-h"} aria-hidden>
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

/** A marking on the case, not content. */
export function Etch({
  children,
  on = true,
  className = "",
}: {
  children: React.ReactNode;
  on?: boolean;
  className?: string;
}) {
  return (
    <span className={`brik-etch brik-stamp-in ${className}`} data-on={on}>
      {children}
    </span>
  );
}
