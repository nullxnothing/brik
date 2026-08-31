"use client";

import { useEffect, useRef } from "react";

/** A quiet, measured replacement for a decorative scroll indicator. */
export function LandingScroll() {
  const meterRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const meter = meterRef.current;
    const fill = fillRef.current;
    const main = document.querySelector("main");
    if (!meter || !fill || !main) return;

    const sections = Array.from(main.querySelectorAll(":scope > header, :scope > section"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const continuous = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      let active = 0;

      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.46) active = index;
      });

      const progress = reducedMotion.matches ? (active + 1) / sections.length : continuous;
      fill.style.transform = `scaleY(${progress})`;
      meter.dataset.chapter = String(active);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <aside ref={meterRef} className="brik-scroll-meter" aria-hidden>
      <span className="brik-scroll-meter-label">RUN</span>
      <span className="brik-scroll-meter-track">
        <span ref={fillRef} className="brik-scroll-meter-fill" />
        <span className="brik-scroll-meter-ticks">
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} />
          ))}
        </span>
      </span>
    </aside>
  );
}
