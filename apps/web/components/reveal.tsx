"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One scroll reveal for the whole page, so every section arrives the same way.
 *
 * The motion is deliberately small: content only rises the last few pixels, so
 * nothing is withheld from a reader while an animation runs.
 *
 * It fails open. The hidden state is applied by the effect below, not by the
 * server render, so content is visible unless JavaScript has run and armed it.
 * An observer that never fires, a script that never loads, or a browser without
 * IntersectionObserver all leave the section on screen rather than blank, which
 * is the only acceptable default for a reveal wrapping real copy.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Steps of 60ms, for staggering siblings. Keep the whole run under ~4. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "header";
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      setShown(true);
      return;
    }
    // Only hide it once we know we can bring it back.
    setArmed(true);

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setShown(true);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    /**
     * The backstop, and the reason this is not observer-only: a fast flick or a
     * jump to an anchor can coalesce past the observer's callbacks, and a
     * section that never gets one would stay invisible. This measures the
     * element directly, so whatever the scroll did, anything on screen shows.
     */
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = node.getBoundingClientRect();
        if (box.top < window.innerHeight * 0.94 && box.bottom > 0) reveal();
      });
    };

    observer.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`brik-reveal ${className}`}
      data-armed={armed}
      data-shown={shown}
      style={delay ? { transitionDelay: `${delay * 60}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
