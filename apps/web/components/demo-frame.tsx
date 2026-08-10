"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBadge, type Status } from "./ui";

const FINAL_TICK = 7;

const AGENT_STEPS = [
  { at: 0, label: "Read the project and plan the change" },
  { at: 1, label: "Write the send_tip instruction" },
  { at: 4, label: "anchor build · finished in 14.2s" },
  { at: 5, label: "Tests passing 3/3" },
  { at: 7, label: "Deployed to devnet" },
];

const TERMINAL_LINES = [
  { at: 3, text: "$ anchor build", ok: false },
  { at: 4, text: "Finished release [optimized] in 14.2s", ok: true },
  { at: 6, text: "$ anchor deploy --provider.cluster devnet", ok: false },
  { at: 7, text: "Deploy success · 7xKX…gAsU", ok: true },
];

function statusAt(tick: number): Status {
  if (tick >= FINAL_TICK) return "deployed";
  if (tick >= 5) return "testing";
  if (tick >= 3) return "building";
  return "ready";
}

/** Plays the build sequence once when scrolled into view, then rests. */
export function DemoFrame() {
  const [tick, setTick] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setTick(FINAL_TICK);
        return;
      }
      let current = 0;
      const interval = window.setInterval(() => {
        current += 1;
        setTick(current);
        if (current >= FINAL_TICK) window.clearInterval(interval);
      }, 700);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const reveal = (at: number) =>
    `transition-opacity duration-150 ease-out ${tick >= at ? "opacity-100" : "opacity-0"}`;

  return (
    <div
      ref={frameRef}
      className="overflow-hidden rounded-card border border-line bg-surface-alt"
    >
      <div className="meta-label flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 text-fg-2">
        <span className="truncate">tip-jar · devnet</span>
        <StatusBadge status={statusAt(tick)} />
      </div>

      <div className="grid md:grid-cols-[164px_1fr_248px]">
        <div className="hidden border-r border-line p-4 font-mono text-code-sm leading-[1.9] text-fg-2 md:block">
          <div>programs/</div>
          <div className="text-fg">&nbsp;&nbsp;lib.rs</div>
          <div>app/</div>
          <div>&nbsp;&nbsp;page.tsx</div>
          <div>&nbsp;&nbsp;wallet.tsx</div>
          <div>tests/</div>
          <div>&nbsp;&nbsp;tip-jar.ts</div>
          <div>Anchor.toml</div>
        </div>

        <pre className="overflow-x-auto bg-canvas p-4 font-mono text-code-sm leading-[1.85] text-fg-2">
          <span className="text-fg-3">#[program]</span>
          {"\n"}
          <span className="font-medium text-cream">pub mod</span> tip_jar {"{"}
          {"\n"}
          {"    "}
          <span className="font-medium text-cream">pub fn</span> send_tip(
          {"\n"}
          {"        "}ctx: Context&lt;SendTip&gt;,
          {"\n"}
          {"        "}amount: u64,
          {"\n"}
          {"    "}) -&gt; Result&lt;()&gt; {"{"}
          {"\n"}
          <span className={reveal(2)}>
            {"        "}
            <span className="font-medium text-cream">let</span> jar = &amp;
            <span className="font-medium text-cream">mut</span> ctx.accounts.jar;
            {"\n"}
            {"        "}jar.total = jar.total.checked_add(amount)?;{"\n"}
            {"        "}Ok(()){"\n"}
          </span>
          {"    "}
          {"}"}
          {"\n"}
          {"}"}
        </pre>

        <div className="border-t border-line p-4 md:border-t-0 md:border-l">
          <div className="meta-label mb-3 text-fg-3">Agent</div>
          <div className="space-y-2 font-mono text-code-sm text-fg-2">
            {AGENT_STEPS.map((step) => (
              <div key={step.label} className={`flex gap-2 ${reveal(step.at)}`}>
                <span className="text-ok" aria-hidden>
                  ✓
                </span>
                <span className="min-w-0">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-sunken px-4 py-3 font-mono text-code-sm leading-[1.85]">
        {TERMINAL_LINES.map((line) => (
          <div
            key={line.text}
            className={`truncate ${reveal(line.at)} ${line.ok ? "text-ok" : "text-fg-2"}`}
          >
            {line.text}
          </div>
        ))}
      </div>

      <div className="meta-label flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-2.5 text-fg-3">
        <span>Devnet</span>
        <span>Wallet 2.41 SOL</span>
        <span className={`text-ok ${reveal(FINAL_TICK)}`}>Program live</span>
      </div>
    </div>
  );
}
