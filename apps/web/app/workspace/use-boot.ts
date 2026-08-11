"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The shell assembling itself, once, when the workspace page opens.
 *
 * Only the chassis is on a clock here: power-on, the annunciator self-test, the
 * seams, the wells being milled open, and the etched markings. Everything with
 * a fact in it — the file tree, the source, the terminal, the meter — is driven
 * by the run's own events, because a step that finishes faster than an
 * animation must not wait for one.
 *
 * Order and minimum dwell are what the sequence is; the timings below are the
 * dwell. Reduced motion skips to the assembled state with no cues.
 */

export interface BootState {
  /** Shell opacity 0 -> 1 over 300ms. */
  power: boolean;
  /** The self-test pattern while it runs, then null: the lamps go back to
   *  reporting the run. */
  selfTest: { fail: boolean; busy: boolean; live: boolean } | null;
  seams: { a: boolean; b: boolean; c: boolean };
  cuts: { rail: boolean; editor: boolean; terminal: boolean };
  labels: { files: boolean; code: boolean; agent: boolean; terminal: boolean };
  /** The nameplate may arrive; whether it stays is the editor's business. */
  plate: boolean;
  /** Every cut has finished. The clips come off the wells from here on. */
  settled: boolean;
}

const ASSEMBLED: BootState = {
  power: true,
  selfTest: null,
  seams: { a: true, b: true, c: true },
  cuts: { rail: true, editor: true, terminal: true },
  labels: { files: true, code: true, agent: true, terminal: true },
  plate: true,
  settled: true,
};

const DARK: BootState = {
  power: false,
  selfTest: { fail: false, busy: false, live: false },
  seams: { a: false, b: false, c: false },
  cuts: { rail: false, editor: false, terminal: false },
  labels: { files: false, code: false, agent: false, terminal: false },
  plate: false,
  settled: false,
};

/** t=0 is the moment the shell is mounted. Every value is a minimum dwell. */
const CUES: [number, (s: BootState) => BootState][] = [
  [0, (s) => ({ ...s, power: true })],
  [190, (s) => ({ ...s, selfTest: { fail: true, busy: false, live: false } })],
  [260, (s) => ({ ...s, selfTest: { fail: true, busy: true, live: false } })],
  [330, (s) => ({ ...s, selfTest: { fail: true, busy: true, live: true } })],
  [425, (s) => ({ ...s, seams: { ...s.seams, a: true } })],
  [500, (s) => ({ ...s, selfTest: { fail: false, busy: false, live: false } })],
  [505, (s) => ({ ...s, seams: { ...s.seams, b: true } })],
  [590, (s) => ({ ...s, seams: { ...s.seams, c: true } })],
  [615, (s) => ({ ...s, cuts: { ...s.cuts, editor: true } })],
  [710, (s) => ({ ...s, cuts: { ...s.cuts, rail: true } })],
  [800, (s) => ({ ...s, cuts: { ...s.cuts, terminal: true } })],
  [1015, (s) => ({ ...s, labels: { ...s.labels, files: true } })],
  [1085, (s) => ({ ...s, labels: { ...s.labels, code: true } })],
  [1155, (s) => ({ ...s, labels: { ...s.labels, agent: true } })],
  [1225, (s) => ({ ...s, labels: { ...s.labels, terminal: true } })],
  // The self-test has decayed by now, so the lamps hand back to the run.
  [1300, (s) => ({ ...s, selfTest: null })],
  [1390, (s) => ({ ...s, plate: true })],
  // The last cut starts at 800 and runs 380ms; give it room to land.
  [1300, (s) => ({ ...s, settled: true })],
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useBoot(): BootState {
  // The server and the first client pass render the dark shell, so the
  // power-on transition has somewhere to come from.
  const [state, setState] = useState<BootState>(DARK);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setState(ASSEMBLED);
      return;
    }
    const timers = CUES.map(([at, step]) =>
      setTimeout(() => setState(step), at),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return state;
}

/**
 * Reveal `count` items one tick apart, so content arrives as a machine fills a
 * surface rather than as a block that was always there. Anything already
 * revealed stays revealed: a stream that grows never replays.
 *
 * `budgetMs` caps the whole reveal, because a real project has three hundred
 * lines and nobody waits eighteen seconds to read the first one.
 */
export function useStagger(count: number, stepMs: number, budgetMs: number) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  shownRef.current = shown;

  const skip = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    if (count <= shownRef.current) {
      // The list shrank (a rerun, a different file). Snap to the new length.
      if (count < shownRef.current) setShown(count);
      return;
    }
    if (skip) {
      setShown(count);
      return;
    }
    const pending = count - shownRef.current;
    const tick = Math.min(stepMs, Math.max(8, budgetMs / pending));
    const timer = setInterval(() => {
      setShown((n) => {
        if (n >= count) return n;
        return n + 1;
      });
    }, tick);
    return () => clearInterval(timer);
  }, [count, stepMs, budgetMs, skip]);

  return Math.min(shown, count);
}
