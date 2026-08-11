"use client";

/**
 * Parts of the case, shared by the workspace shell and the picture of it on the
 * landing page. One definition of a lamp, so the two cannot drift.
 *
 * Everything here is structure or readout. Nothing glows that is not a lamp.
 */

export type LampState = "fail" | "busy" | "live";

export interface Lamps {
  fail: boolean;
  busy: boolean;
  live: boolean;
}

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

const LAMPS: LampState[] = ["fail", "busy", "live"];

/** The lamp cluster, punched into the top bar. The label carries the state for
 *  anyone who cannot see the colour; the live region announces the change. */
export function Annunciator({
  lamps,
  status,
  compact = false,
}: {
  lamps: Lamps;
  status: string;
  /** Drop the labels where the bar is too narrow to hold them. */
  compact?: boolean;
}) {
  return (
    <div className="brik-annunciator" data-compact={compact || undefined}>
      {LAMPS.map((state) => (
        <div key={state} className="flex items-center gap-2">
          <Lamp state={state} on={lamps[state]} />
          <span
            className={`brik-lamp-text font-mono text-[10px] tracking-[0.16em] ${
              compact ? "hidden" : "hidden sm:inline"
            }`}
            data-on={lamps[state]}
            style={{ color: LAMP_FG[state] }}
            aria-hidden
          >
            {state.toUpperCase()}
          </span>
        </div>
      ))}
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  );
}

export const SEGMENTS = 14;

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
