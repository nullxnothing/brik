"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The three parts of the shell and the seams between them.
 *
 * A seam is a joint with tolerance, so it moves. mousedown captures the pointer
 * and the size the part started at, the move applies a clamped delta, and the
 * tracked dimension carries no transition while a drag is live.
 */

export type Pane = "rail" | "agent" | "terminal";

interface Bounds {
  min: number;
  base: number;
  max: number;
  /** The seam sits after the rail and before the other two, so their deltas
   *  run the other way. */
  inverted: boolean;
  axis: "x" | "y";
}

export const PANES: Record<Pane, Bounds> = {
  rail: { min: 150, base: 224, max: 380, inverted: false, axis: "x" },
  agent: { min: 260, base: 388, max: 620, inverted: true, axis: "x" },
  terminal: { min: 60, base: 172, max: 460, inverted: true, axis: "y" },
};

export type PaneSizes = Record<Pane, number>;

const STORAGE_KEY = "brik.panes";
/** One arrow press. Coarse enough to be worth pressing, fine enough to aim. */
const STEP = 16;

const clamp = (value: number, { min, max }: Bounds) =>
  Math.max(min, Math.min(max, Math.round(value)));

function readStored(): PaneSizes | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PaneSizes>;
    return {
      rail: clamp(parsed.rail ?? PANES.rail.base, PANES.rail),
      agent: clamp(parsed.agent ?? PANES.agent.base, PANES.agent),
      terminal: clamp(parsed.terminal ?? PANES.terminal.base, PANES.terminal),
    };
  } catch {
    // Private modes refuse storage, and a corrupt entry is not worth failing
    // a workspace over. The defaults are good sizes.
    return null;
  }
}

export function usePanes() {
  const [sizes, setSizes] = useState<PaneSizes>({
    rail: PANES.rail.base,
    agent: PANES.agent.base,
    terminal: PANES.terminal.base,
  });
  const [dragging, setDragging] = useState<Pane | null>(null);
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;

  // Read the visitor's own sizes after mount, so the server and the client
  // render the same first pass.
  useEffect(() => {
    const stored = readStored();
    if (stored) setSizes(stored);
  }, []);

  const commit = useCallback((next: PaneSizes) => {
    setSizes(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // As above: the size still applies to this page, it just will not
      // survive a reload.
    }
  }, []);

  const startDrag = useCallback(
    (pane: Pane) => (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const bounds = PANES[pane];
      const origin = bounds.axis === "x" ? event.clientX : event.clientY;
      const start = sizesRef.current[pane];
      setDragging(pane);

      const move = (moved: PointerEvent) => {
        const now = bounds.axis === "x" ? moved.clientX : moved.clientY;
        const delta = (now - origin) * (bounds.inverted ? -1 : 1);
        setSizes((prev) => ({ ...prev, [pane]: clamp(start + delta, bounds) }));
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        setDragging(null);
        commit(sizesRef.current);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
    },
    [commit],
  );

  /** A seam a pointer can move, a keyboard must be able to move too. */
  const nudge = useCallback(
    (pane: Pane) => (event: React.KeyboardEvent<HTMLElement>) => {
      const bounds = PANES[pane];
      const grow = bounds.axis === "x" ? "ArrowRight" : "ArrowDown";
      const shrink = bounds.axis === "x" ? "ArrowLeft" : "ArrowUp";
      let next: number;
      if (event.key === grow || event.key === shrink) {
        const delta = (event.key === grow ? STEP : -STEP) * (bounds.inverted ? -1 : 1);
        next = clamp(sizesRef.current[pane] + delta, bounds);
      } else if (event.key === "Home") next = bounds.min;
      else if (event.key === "End") next = bounds.max;
      else return;

      event.preventDefault();
      commit({ ...sizesRef.current, [pane]: next });
    },
    [commit],
  );

  return { sizes, dragging, startDrag, nudge };
}
