"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

if (typeof window !== "undefined") gsap.registerPlugin(useGSAP);

const VERSION_ROWS = [
  { label: "rustc", value: "1.85.0" },
  { label: "solana · anchor", value: "3.1.9 · 0.31.1" },
  { label: "node", value: "22.23.2" },
];

function setText(node: Element, value: string) {
  node.textContent = value;
}

export function AutonomousDemo() {
  const rootRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hoveredRef = useRef(false);
  const visibleRef = useRef(false);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const terminal = root.querySelector("[data-terminal]");
      const cursor = root.querySelector("[data-cursor]");
      const status = root.querySelector("[data-status]");
      const statusWrap = root.querySelector("[data-status-wrap]");
      const validator = root.querySelector("[data-validator]");
      const validatorState = root.querySelector("[data-validator-state]");
      const command = root.querySelector("[data-command]");
      const typeValue = root.querySelector("[data-type-value]");
      const error = root.querySelector("[data-error]");
      const result = root.querySelector("[data-result]");
      const signalFills = Array.from(root.querySelectorAll("[data-signal-fill]"));
      const routeNodes = Array.from(root.querySelectorAll("[data-route-node]"));
      const versionValues = Array.from(root.querySelectorAll("[data-version-value]"));
      const stages = Array.from(root.querySelectorAll("[data-boot-stage]"));
      const pulse = root.querySelector("[data-panel-pulse]");

      const nodes = [
        terminal,
        cursor,
        status,
        statusWrap,
        validator,
        validatorState,
        command,
        typeValue,
        error,
        result,
        pulse,
      ];
      if (nodes.some((node) => !node)) return;

      const setStage = (index: number, state: string) => {
        (stages[index] as HTMLElement).dataset.state = state;
        (routeNodes[index] as HTMLElement).dataset.state = state;
      };
      const setStatus = (label: string, tone: string) => {
        setText(status!, label);
        (statusWrap as HTMLElement).dataset.tone = tone;
      };
      const reset = () => {
        root.dataset.ready = "false";
        setStatus("STANDBY", "neutral");
        setText(terminal!, "");
        setText(validator!, "idle");
        setText(validatorState!, "neutral");
        setText(command!, "waiting");
        setText(typeValue!, "u32");
        (typeValue as HTMLElement).dataset.state = "neutral";
        setText(error!, "error[E0308] · expected u64, found u32");
        setText(result!, "Awaiting build");
        versionValues.forEach((node) => setText(node, "—"));
        stages.forEach((stage) => ((stage as HTMLElement).dataset.state = "neutral"));
        routeNodes.forEach((node) => ((node as HTMLElement).dataset.state = "neutral"));
        gsap.set(signalFills, { scaleX: 0, transformOrigin: "left" });
        gsap.set(error, { autoAlpha: 0, scaleY: 1, transformOrigin: "top" });
        gsap.set(result, { autoAlpha: 1, scale: 1 });
        gsap.set(typeValue, { autoAlpha: 1, scale: 1 });
        gsap.set(cursor, { autoAlpha: 1 });
        gsap.set(pulse, { autoAlpha: 0, xPercent: -110 });
        gsap.set(root, { autoAlpha: 1 });
      };
      const complete = () => {
        reset();
        root.dataset.ready = "true";
        setStatus("READY · 7.9s", "ready");
        setText(terminal!, "Workspace created");
        setText(validator!, "running");
        setText(validatorState!, "ready");
        setText(command!, "anchor build");
        setText(typeValue!, "u64");
        (typeValue as HTMLElement).dataset.state = "fixed";
        setText(result!, "Build passed");
        versionValues.forEach((node, index) => setText(node, VERSION_ROWS[index].value));
        stages.forEach((_, index) => setStage(index, "ready"));
        gsap.set(signalFills, { scaleX: 1 });
        gsap.set(error, { autoAlpha: 0 });
        gsap.set(cursor, { autoAlpha: 0 });
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        complete();
        return;
      }

      const timeline = gsap.timeline({
        repeat: -1,
        defaults: { duration: 0.28, ease: "power2.out" },
      });
      timelineRef.current = timeline;
      timeline.call(reset, [], 0);
      timeline.call(() => setStatus("BOOTING", "active"), [], 0.12);

      const phrase = "Creating workspace…";
      const irregular = [0.08, 0.11, 0.07, 0.13, 0.09, 0.08, 0.12, 0.07];
      let typeAt = 0.25;
      Array.from(phrase).forEach((_, index) => {
        timeline.call(() => setText(terminal!, phrase.slice(0, index + 1)), [], typeAt);
        typeAt += irregular[index % irregular.length];
      });

      timeline.call(() => setStage(0, "active"), [], 1.95);
      timeline.to(signalFills[0], { scaleX: 1, duration: 0.44, ease: "power1.inOut" }, 2.0);
      timeline.call(() => {
        setText(validator!, "starting");
        setText(validatorState!, "boot");
      }, [], 2.12);
      timeline.call(() => {
        setText(validator!, "running");
        setText(validatorState!, "ready");
        setStage(0, "ready");
        setStage(1, "active");
      }, [], 2.62);

      [2.88, 3.1, 3.32].forEach((at, index) => {
        timeline.call(() => setText(versionValues[index], VERSION_ROWS[index].value), [], at);
        timeline.fromTo(
          versionValues[index],
          { autoAlpha: 0.24, x: -4 },
          { autoAlpha: 1, x: 0, duration: 0.22 },
          at,
        );
      });
      timeline.call(() => setStage(1, "ready"), [], 3.54);
      timeline.to(signalFills[1], { scaleX: 1, duration: 0.44, ease: "power1.inOut" }, 3.58);
      timeline.call(() => setStage(2, "active"), [], 3.98);

      timeline.call(() => {
        setText(command!, "anchor build");
        setText(result!, "Building…");
      }, [], 4.15);
      timeline.to(error, { autoAlpha: 1, duration: 0.2 }, 4.78);
      timeline.call(() => {
        (typeValue as HTMLElement).dataset.state = "error";
        setStatus("TYPE ERROR", "error");
      }, [], 4.82);
      timeline.to(typeValue, { scale: 1.08, duration: 0.16 }, 5.08);
      timeline.to(typeValue, { scale: 1, duration: 0.18 }, 5.24);
      timeline.to(typeValue, { autoAlpha: 0, duration: 0.12 }, 5.55);
      timeline.call(() => {
        setText(typeValue!, "u64");
        (typeValue as HTMLElement).dataset.state = "fixed";
      }, [], 5.67);
      timeline.to(typeValue, { autoAlpha: 1, duration: 0.16 }, 5.67);
      timeline.call(() => {
        setText(command!, "anchor build · retry");
        setText(result!, "Rebuilding…");
        setStatus("VERIFYING", "active");
      }, [], 5.98);
      timeline.to(error, { autoAlpha: 0, scaleY: 0.45, duration: 0.24 }, 6.28);
      timeline.to(result, { autoAlpha: 0, duration: 0.12 }, 6.36);
      timeline.call(() => setText(result!, "Build passed"), [], 6.48);
      timeline.to(result, { autoAlpha: 1, scale: 1.02, duration: 0.22 }, 6.48);
      timeline.to(result, { scale: 1, duration: 0.16 }, 6.7);
      timeline.call(() => {
        setStage(2, "ready");
        root.dataset.ready = "true";
      }, [], 6.84);
      timeline.fromTo(
        pulse,
        { autoAlpha: 0, xPercent: -110 },
        { autoAlpha: 0.22, xPercent: 110, duration: 0.58, ease: "power1.inOut" },
        7.12,
      );
      timeline.to(pulse, { autoAlpha: 0, duration: 0.18 }, 7.62);
      timeline.call(() => {
        setStatus("READY · 7.9s", "ready");
        gsap.set(cursor, { autoAlpha: 0 });
      }, [], 7.9);
      timeline.to(root, { autoAlpha: 1, duration: 3.82 }, 7.9);
      timeline.to(root, { autoAlpha: 0.62, duration: 0.08, ease: "none" }, 11.72);
      timeline.to(root, { autoAlpha: 1, duration: 0.14, ease: "power1.out" }, 11.8);

      const syncPlayback = () => {
        const shouldPause = hoveredRef.current || !visibleRef.current || document.hidden;
        if (shouldPause) timeline.pause();
        else timeline.resume();
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          visibleRef.current = entry.isIntersecting;
          syncPlayback();
        },
        { threshold: 0.2 },
      );
      const onVisibility = () => syncPlayback();
      observer.observe(root);
      document.addEventListener("visibilitychange", onVisibility);
      syncPlayback();

      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        timeline.kill();
        timelineRef.current = null;
      };
    },
    { scope: rootRef },
  );

  const pause = () => {
    hoveredRef.current = true;
    timelineRef.current?.pause();
  };
  const resume = () => {
    hoveredRef.current = false;
    if (visibleRef.current && !document.hidden) timelineRef.current?.resume();
  };
  const replay = () => {
    hoveredRef.current = false;
    timelineRef.current?.restart();
  };

  return (
    <section
      ref={rootRef}
      className="brik-boot"
      data-ready="false"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <span className="brik-boot-pulse" data-panel-pulse aria-hidden />
      <header className="brik-boot-header">
        <span>Autonomous workspace · live run</span>
        <div className="brik-boot-header-actions">
          <span className="brik-boot-status" data-status-wrap data-tone="neutral">
            <i aria-hidden />
            <span data-status>STANDBY</span>
          </span>
          <button type="button" className="brik-boot-replay" onClick={replay}>
            Replay build
          </button>
        </div>
      </header>

      <div className="brik-boot-route" aria-hidden>
        <i data-route-node data-state="neutral" />
        <span><b data-signal-fill /></span>
        <i data-route-node data-state="neutral" />
        <span><b data-signal-fill /></span>
        <i data-route-node data-state="neutral" />
      </div>

      <div className="brik-boot-grid">
        <section className="brik-boot-stage" data-boot-stage data-state="neutral">
          <h3 className="meta-label">Localnet</h3>
          <dl>
            <div>
              <dt>terminal</dt>
              <dd className="brik-boot-terminal"><span data-terminal /><i data-cursor aria-hidden /></dd>
            </div>
            <div>
              <dt>validator</dt>
              <dd data-validator>idle</dd>
            </div>
            <div>
              <dt>state</dt>
              <dd data-validator-state>neutral</dd>
            </div>
          </dl>
        </section>

        <section className="brik-boot-stage" data-boot-stage data-state="neutral">
          <h3 className="meta-label">Toolchain</h3>
          <dl>
            {VERSION_ROWS.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd data-version-value>—</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="brik-boot-stage" data-boot-stage data-state="neutral">
          <h3 className="meta-label">Agent</h3>
          <dl>
            <div>
              <dt>command</dt>
              <dd data-command>waiting</dd>
            </div>
            <div className="brik-boot-code-row">
              <dt>edit</dt>
              <dd>amount as <mark data-type-value data-state="neutral">u32</mark></dd>
            </div>
            <div className="brik-boot-result-row">
              <dt>result</dt>
              <dd>
                <span data-error>error[E0308] · expected u64, found u32</span>
                <span data-result>Awaiting build</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}
