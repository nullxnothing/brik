"use client";

import { useEffect, useRef, useState } from "react";
import { Annunciator, Etch, SegmentMeter, SEGMENTS } from "./chassis";
import { CodeLine } from "./code-line";
import { BrikWordmark } from "./logo";

const FINAL_TICK = 7;
const TICK_MS = 700;
/** One segment at a time, so the meter reads as a gauge rather than a bar. */
const LATCH_MS = 45;

/**
 * The picture of the product, built out of the same parts as the product: the
 * same chassis, tab rows, wells, gutter, composer, lamps and segment meter that
 * `/workspace` is assembled from. It is the workspace shell at rest, so it must
 * not read as a different machine.
 *
 * The seams here are fixed, so they carry no knurl. Grips only where you grab.
 *
 * As the run plays, one region at a time is lit and says what it is for, in the
 * order the run actually reaches it. The captions are the only copy on the
 * frame that is not a readout, and each one names a capability the product has.
 * It plays once and rests assembled; nothing here loops.
 *
 * Every number below is a measured tip-jar run, not a dressed-up one: see the
 * step timings in STATE.md. No program id, because the one a run produces
 * belongs to that run.
 */

type Region = "files" | "code" | "agent" | "terminal";

/** Which region is doing the work at a given tick, and what it is for. */
const FOCUS: { from: number; to: number; region: Region; caption: string }[] = [
  { from: 0, to: 1, region: "files", caption: "Every file the template wrote" },
  { from: 1, to: 2, region: "agent", caption: "Each step is a command it ran" },
  { from: 2, to: 3, region: "code", caption: "Edit it, or ask for a change" },
  {
    from: 3,
    to: 6,
    region: "terminal",
    caption: "Live stdout from the container",
  },
];

function focusAt(tick: number): { region: Region; caption: string } | null {
  const span = FOCUS.find((f) => tick >= f.from && tick < f.to);
  return span ? { region: span.region, caption: span.caption } : null;
}

const FILE_ROWS: { name: string; depth: number; entry?: boolean }[] = [
  { name: "programs/", depth: 0 },
  { name: "project/src/", depth: 1 },
  { name: "lib.rs", depth: 2, entry: true },
  { name: "tests/", depth: 0 },
  { name: "project.ts", depth: 1 },
  { name: "Anchor.toml", depth: 0 },
  { name: "Cargo.toml", depth: 0 },
];

/** The instruction the tip jar template ships, with the body written in at the
 *  tick the agent reports having written it. */
const SOURCE = [
  "#[program]",
  "pub mod project {",
  "    pub fn send_tip(",
  "        ctx: Context<SendTip>,",
  "        amount: u64,",
  "    ) -> Result<()> {",
  "        let jar = &mut ctx.accounts.jar;",
  "        jar.total = jar.total.checked_add(amount)",
  "            .ok_or(TipJarError::Overflow)?;",
  "        Ok(())",
  "    }",
  "}",
];
/** Lines the agent writes, revealed together at this tick. */
const BODY_FROM = 6;
const BODY_TO = 10;
const BODY_AT = 2;

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
  const [narrates, setNarrates] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
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
      setNarrates(true);
      timers.push(
        window.setTimeout(() => setCuts((c) => ({ ...c, editor: true })), 40),
        window.setTimeout(
          () => setCuts((c) => ({ ...c, terminal: true })),
          130,
        ),
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

  const target = Math.round(
    (Math.min(tick, FINAL_TICK) / FINAL_TICK) * SEGMENTS,
  );

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
  const focus = narrates ? focusAt(tick) : null;

  /** Everything the run is not working in steps back, and nothing dims once
   *  the whole machine is live. */
  const region = (name: Region) =>
    `brik-demo-region ${focus && focus.region !== name ? "brik-demo-region-off" : ""}`;

  return (
    <figure ref={frameRef} className="m-0">
      <div className="brik-chassis overflow-hidden rounded-[var(--brik-radius-shell)]">
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
            />
            <span className="brik-etch-sm hidden lg:inline">LOCALNET</span>
            <span
              className="brik-key brik-key-primary hidden px-4 py-1.5 text-[13px] sm:inline-block"
              aria-disabled={!isLive}
            >
              Deploy
            </span>
          </div>
        </div>

        <div className="brik-demo-work grid md:grid-cols-[168px_3px_minmax(0,1fr)_3px_246px]">
          {/* The layout a workspace actually opens: a template writes the
            program and the suite into the pre-built Anchor project, and
            nothing else. */}
          <div
            className={`hidden min-h-0 flex-col p-3 md:flex ${region("files")}`}
          >
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
                    background: row.entry
                      ? "linear-gradient(#1B1B1B,#161616)"
                      : undefined,
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

          <div
            className="brik-seam-v brik-seam-fixed hidden md:block"
            aria-hidden
          />

          <div className={`flex min-h-0 flex-col ${region("code")}`}>
            {/* The same tab row the shell carries: Code while a run is in
              flight, Preview once a deploy produces something to frame. */}
            <div className="brik-chassis-bar-tabs flex h-[42px] shrink-0 items-end gap-1.5 px-4">
              <span className="px-3.5 py-1.5 text-[13px] text-[#8a8a84] [text-shadow:0_1px_0_rgba(0,0,0,.85)]">
                Preview
              </span>
              <span className="rounded-t-[var(--brik-radius-key)] border border-b-0 border-[#2C2C2C] bg-[linear-gradient(#242424,#1B1B1B)] px-3.5 py-1.5 text-[13px] text-fg shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_-3px_8px_-3px_rgba(0,0,0,.8)]">
                Code
              </span>
              <span className="brik-etch ml-auto hidden truncate pb-2 text-[10.5px] tracking-[0.12em] text-[var(--brik-etch-faint)] lg:block">
                programs/project/src/lib.rs
              </span>
            </div>
            <div className="min-h-0 flex-1 px-3 pb-3">
              <div
                className="brik-well-screen brik-scan brik-scroll-x brik-cut literal h-full"
                data-open={cuts.editor}
                data-settled={cuts.settled}
              >
                <pre className="relative min-w-max px-4 py-3 font-mono text-[11.5px] leading-[1.95]">
                  {SOURCE.map((line, i) => {
                    const isBody = i >= BODY_FROM && i < BODY_TO;
                    return (
                      <div
                        key={i}
                        className={`flex gap-4 ${isBody ? reveal(BODY_AT) : ""}`}
                      >
                        <span className="w-[18px] shrink-0 select-none text-right text-[#3e3e3b]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <CodeLine line={line} />
                        </span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          </div>

          <div
            className="brik-seam-v brik-seam-fixed hidden md:block"
            aria-hidden
          />

          <div className={`flex min-h-0 flex-col ${region("agent")}`}>
            {/* The right rail's own tab row, Agent selected the way the shell
              underlines it. */}
            <div className="brik-chassis-bar-tabs hidden h-[42px] shrink-0 items-center gap-5 px-4 md:flex">
              <span className="flex h-full items-center font-mono text-[11px] tracking-[0.14em] text-fg uppercase shadow-[inset_0_-2px_0_var(--brik-cream)]">
                agent
              </span>
              <span className="flex h-full items-center font-mono text-[11px] tracking-[0.14em] text-[var(--brik-etch)] uppercase [text-shadow:0_1px_0_rgba(0,0,0,.9)]">
                solana
              </span>
            </div>
            <div className="min-h-0 flex-1 px-4 pt-3 pb-2 md:pt-0">
              <Etch className="mb-3 block text-[10px] md:hidden">AGENT</Etch>
              <div className="space-y-2 text-[12.5px] leading-[1.5] text-[#8a8a84]">
                {AGENT_STEPS.map((step) => (
                  <div
                    key={step.label}
                    className={`flex gap-2 ${reveal(step.at)}`}
                  >
                    <span className="text-ok" aria-hidden>
                      ✓
                    </span>
                    <span className="min-w-0">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* The composer is part of the machine, so the picture carries it.
              It is a still: the frame takes no input. */}
            <div className="shrink-0 px-4 pb-3">
              <div className="brik-well px-3 py-2.5">
                <span className="block text-[12.5px] text-[var(--brik-etch)]">
                  Ask for a change
                </span>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="brik-etch text-[10px] tracking-[0.14em] text-[var(--brik-etch-dim)]">
                    ⏎ TO SEND
                  </span>
                  <span
                    className="brik-key grid h-[24px] w-7 place-items-center text-[12px]"
                    style={{ borderRadius: 6 }}
                    aria-hidden
                  >
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="brik-seam-h brik-seam-fixed" aria-hidden />

        <div className={`p-3 ${region("terminal")}`}>
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
                color: isLive
                  ? "var(--brik-lamp-live-fg)"
                  : "var(--brik-lamp-busy-fg)",
              }}
            >
              {footStatus(tick)}
            </span>
            <SegmentMeter
              lit={lit}
              tone={isLive ? "live" : "busy"}
              label="Run progress"
            />
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

      {/* One caption for the whole picture, so it never fights a well for
          room. It names the lit region and what that region is for, then
          empties out and leaves the frame to rest. The height is reserved so
          the page does not move under it. */}
      <figcaption className="brik-demo-caption" data-on={focus !== null}>
        <span className="brik-demo-caption-region">{focus?.region}</span>
        {focus?.caption}
      </figcaption>
    </figure>
  );
}
