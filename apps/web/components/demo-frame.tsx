"use client";

import { useEffect, useRef, useState } from "react";
import { Annunciator, Etch, SegmentMeter, SEGMENTS } from "./chassis";
import { BrikWordmark } from "./logo";

const FINAL_TICK = 7;
const TICK_MS = 700;
/** One segment at a time, so the meter reads as a gauge rather than a bar. */
const LATCH_MS = 45;

/**
 * The picture of the product, built out of the same parts as the product: one
 * light source, chassis and wells, lamps rather than status text, and the
 * segment meter from the workspace foot. It is the workspace shell at rest, so
 * it must not read as a different machine.
 *
 * The seams here are fixed, so they carry no knurl. Grips only where you grab.
 *
 * Every number below is a measured tip-jar run, not a dressed-up one: see the
 * step timings in STATE.md. No program id, because the one a run produces
 * belongs to that run.
 */

const FILE_ROWS: { name: string; depth: number; entry?: boolean }[] = [
  { name: "programs/", depth: 0 },
  { name: "project/src/", depth: 1 },
  { name: "lib.rs", depth: 2, entry: true },
  { name: "tests/", depth: 0 },
  { name: "project.ts", depth: 1 },
  { name: "Anchor.toml", depth: 0 },
  { name: "Cargo.toml", depth: 0 },
];

const AGENT_STEPS = [
  { at: 0, label: "Read the project and plan the change" },
  { at: 1, label: "Write the send_tip instruction" },
  { at: 4, label: "anchor build · finished in 3s" },
  { at: 5, label: "Tests passing 4/4" },
  { at: 7, label: "Deployed to the workspace validator" },
];

const TERMINAL_LINES = [
  { at: 3, text: "$ anchor build", ok: false },
  { at: 4, text: "Finished release [optimized] in 3s", ok: true },
  { at: 6, text: "$ anchor deploy", ok: false },
  { at: 7, text: "Deploy success · 4.3s · 1.266 SOL rent", ok: true },
];

function footStatus(tick: number): string {
  if (tick >= FINAL_TICK) return "DEPLOYED";
  if (tick >= 5) return "TESTING";
  if (tick >= 3) return "BUILDING";
  return "READY";
}

interface Cuts {
  editor: boolean;
  terminal: boolean;
  settled: boolean;
}

const CUT_OPEN: Cuts = { editor: true, terminal: true, settled: true };

/** Plays the build sequence once when scrolled into view, then rests. */
export function DemoFrame() {
  const [tick, setTick] = useState(0);
  const [cuts, setCuts] = useState<Cuts>({
    editor: false,
    terminal: false,
    settled: false,
  });
  const [lit, setLit] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const timers: number[] = [];
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCuts(CUT_OPEN);
        setTick(FINAL_TICK);
        setLit(SEGMENTS);
        return;
      }
      // The wells are milled open before anything moves inside them, the same
      // order the shell itself assembles in.
      timers.push(
        window.setTimeout(() => setCuts((c) => ({ ...c, editor: true })), 40),
        window.setTimeout(() => setCuts((c) => ({ ...c, terminal: true })), 130),
        window.setTimeout(() => setCuts(CUT_OPEN), 560),
      );
      let current = 0;
      const interval = window.setInterval(() => {
        current += 1;
        setTick(current);
        if (current >= FINAL_TICK) window.clearInterval(interval);
      }, TICK_MS);
      timers.push(interval);
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
    return () => {
      observer.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, []);

  const target = Math.round((Math.min(tick, FINAL_TICK) / FINAL_TICK) * SEGMENTS);

  // Segments latch one at a time toward whatever the run has reached.
  useEffect(() => {
    if (lit >= target) return;
    const id = window.setTimeout(() => setLit((n) => n + 1), LATCH_MS);
    return () => window.clearTimeout(id);
  }, [lit, target]);

  const reveal = (at: number) =>
    `transition-opacity duration-150 ease-out ${tick >= at ? "opacity-100" : "opacity-0"}`;

  const isLive = tick >= FINAL_TICK;
  const lamps = { fail: false, busy: tick >= 3 && !isLive, live: isLive };

  return (
    <div
      ref={frameRef}
      className="brik-chassis overflow-hidden rounded-[var(--brik-radius-shell)]"
    >
      <div className="brik-chassis-bar flex h-[46px] items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="brik-stamped shrink-0">
            <BrikWordmark size={17} />
          </span>
          <span className="truncate font-mono text-[11px] text-fg-3 [text-shadow:0_1px_0_rgba(0,0,0,.85)]">
            tip-jar
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Annunciator
            lamps={lamps}
            status={`Workspace ${footStatus(tick).toLowerCase()}`}
            compact
          />
          <span
            className="brik-key brik-key-primary hidden px-4 py-1.5 text-[13px] sm:inline-block"
            aria-disabled={!isLive}
          >
            Deploy
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-[152px_3px_minmax(0,1fr)_3px_232px]">
        {/* The layout a workspace actually opens: a template writes the
            program and the suite into the pre-built Anchor project, and
            nothing else. */}
        <div className="hidden min-h-0 flex-col p-3 md:flex">
          <div className="mb-3 flex items-center justify-between px-1">
            <Etch className="text-[10px]">FILES</Etch>
            <Etch className="brik-etch-dim brik-figures text-[10px] tracking-normal">
              {FILE_ROWS.length}
            </Etch>
          </div>
          <div
            className="brik-well brik-cut flex-1 px-1.5 py-2 font-mono text-[11px]"
            data-open={cuts.editor}
            data-settled={cuts.settled}
          >
            {FILE_ROWS.map((row) => (
              <div
                key={row.name}
                className={`truncate rounded-[5px] py-[3px] pr-1.5 ${
                  row.entry ? "text-fg" : "text-[#6f6f6b]"
                }`}
                style={{
                  paddingLeft: 7 + row.depth * 10,
                  background: row.entry ? "linear-gradient(#1B1B1B,#161616)" : undefined,
                  boxShadow: row.entry
                    ? "inset 0 1px 0 rgba(255,255,255,.06), 0 1px 0 rgba(0,0,0,.6)"
                    : undefined,
                }}
              >
                {row.name}
              </div>
            ))}
          </div>
        </div>

        <div className="brik-seam-v brik-seam-fixed hidden md:block" aria-hidden />

        <div className="min-h-0 p-3">
          <div
            className="brik-well-screen brik-scan brik-scroll-x brik-cut literal h-full"
            data-open={cuts.editor}
            data-settled={cuts.settled}
          >
            <pre className="relative min-w-max px-4 py-3.5 font-mono text-[11.5px] leading-[1.95] text-[#8a8a84]">
              <span className="text-[#4e4e4a]">#[program]</span>
              {"\n"}
              <span className="font-medium text-cream">pub mod</span> project {"{"}
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
                {"        "}jar.total = jar.total.checked_add(amount){"\n"}
                {"            "}.ok_or(TipJarError::Overflow)?;{"\n"}
                {"        "}Ok(()){"\n"}
              </span>
              {"    "}
              {"}"}
              {"\n"}
              {"}"}
            </pre>
          </div>
        </div>

        <div className="brik-seam-v brik-seam-fixed hidden md:block" aria-hidden />

        <div className="p-3 md:pl-4">
          <Etch className="mb-3 block text-[10px]">AGENT</Etch>
          <div className="space-y-2 text-[12.5px] leading-[1.5] text-[#8a8a84]">
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

      <div className="brik-seam-h brik-seam-fixed" aria-hidden />

      <div className="p-3">
        <div
          className="brik-well-screen brik-scan brik-cut literal"
          data-open={cuts.terminal}
          data-settled={cuts.settled}
        >
          <div className="relative px-4 py-3 font-mono text-[11.5px] leading-[1.9]">
            <Etch className="mb-1 block text-[10px]">TERMINAL · anchor</Etch>
            {TERMINAL_LINES.map((line) => (
              <div
                key={line.text}
                className={`truncate ${reveal(line.at)} ${
                  line.ok ? "text-[#8fa97a]" : "text-[#8a8a84]"
                }`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="brik-chassis-bar-foot flex h-9 items-center justify-between gap-4 px-4 font-mono text-[10.5px] tracking-[0.14em] text-[var(--brik-etch-faint)]">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="hidden min-w-[76px] [text-shadow:0_1px_0_rgba(0,0,0,.9)] sm:inline"
            style={{
              color: isLive ? "var(--brik-lamp-live-fg)" : "var(--brik-lamp-busy-fg)",
            }}
          >
            {footStatus(tick)}
          </span>
          <SegmentMeter lit={lit} tone={isLive ? "live" : "busy"} label="Run progress" />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="brik-figures [text-shadow:0_1px_0_rgba(0,0,0,.9)]">
            1000.00 SOL
          </span>
          <span className="hidden [text-shadow:0_1px_0_rgba(0,0,0,.9)] sm:inline">
            LOCALNET
          </span>
        </div>
      </div>
    </div>
  );
}
