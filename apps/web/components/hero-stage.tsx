"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's three depth planes move at different rates while the visitor
 * leaves the opening screen. The range stays deliberately small so the
 * workspace remains crisp and the motion reads as camera depth, not drift.
 */
export function HeroStage({ children }: { children: React.ReactNode }) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = Math.max(1, hero.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / distance));
      hero.style.setProperty("--hero-field-shift", `${progress * 18}px`);
      hero.style.setProperty("--hero-glow-shift", `${progress * 10}px`);
      hero.style.setProperty("--hero-product-shift", `${progress * -14}px`);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <header ref={heroRef} className="brik-hero">
      <div className="brik-hero-field" aria-hidden />
      <div className="brik-hero-glow" aria-hidden />
      <div className="brik-hero-axis brik-hero-axis-x" aria-hidden />
      <div className="brik-hero-axis brik-hero-axis-y" aria-hidden />
      {children}
    </header>
  );
}
