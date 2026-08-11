"use client";

import { PANES, type Pane } from "./use-panes";

const SEAM_LABEL: Record<Pane, string> = {
  rail: "Resize the file rail",
  agent: "Resize the agent panel",
  terminal: "Resize the terminal",
};

/**
 * The joint between two moulded parts: a black trough with tolerance you can
 * see into. Grips only where you grab, so every seam that renders here is one
 * that drags, and every one of them is knurled. A fixed seam gets nothing.
 */
export function Seam({
  pane,
  size,
  visible,
  dragging,
  onPointerDown,
  onKeyDown,
}: {
  pane: Pane;
  size: number;
  visible: boolean;
  dragging: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}) {
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
