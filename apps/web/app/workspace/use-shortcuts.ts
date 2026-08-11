"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The four shortcuts printed on the legend plate, and the modifier key it
 * prints them with.
 *
 * The plate is reference that is always true, so every legend on it is bound
 * here. Nothing is printed that the shell does not answer.
 */

interface Bindings {
  onFiles: () => void;
  onTerminal: () => void;
  onBuild: () => void;
  onAgent: () => void;
}

/** Rendered into the keycaps. The trailing space is deliberate: "Ctrl B". */
const MAC = "⌘";
const OTHER = "Ctrl ";

export function useShortcuts(bindings: Bindings): string {
  // Resolved after mount so the server and the client render the same plate.
  const [modifier, setModifier] = useState(OTHER);

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setModifier(MAC);
  }, []);

  // The callbacks close over render state, so they are read at press time
  // rather than captured when the listener is attached.
  const latest = useRef(bindings);
  latest.current = bindings;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const action =
        key === "b"
          ? latest.current.onFiles
          : key === "j"
            ? latest.current.onTerminal
            : key === "enter"
              ? latest.current.onBuild
              : key === "/"
                ? latest.current.onAgent
                : null;
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return modifier;
}
