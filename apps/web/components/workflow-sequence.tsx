"use client";

import { useEffect, useRef, useState } from "react";
import { BrikMark } from "./logo";

type Phase = "idle" | "write" | "test" | "retry" | "build" | "deploy" | "complete";
type StepState = "pending" | "active" | "complete" | "error";

const PHASES: Array<{ at: number; phase: Phase }> = [
  { at: 0.86, phase: "complete" },
  { at: 0.7, phase: "deploy" },
  { at: 0.5, phase: "build" },
  { at: 0.36, phase: "retry" },
  { at: 0.2, phase: "test" },
  { at: 0.04, phase: "write" },
];

const PHASE_COPY: Record<Phase, { status: string; evidence: string; tone: string }> = {
  idle: {
    status: "Ready to run",
    evidence: "Every claim is held until a command reports it.",
    tone: "idle",
  },
  write: {
    status: "Writing change",
    evidence: "edit programs/project/src/lib.rs",
    tone: "active",
  },
  test: {
    status: "Tests failed",
    evidence: "error[E0308] · jar.total expects u64, found u32",
    tone: "error",
  },
  retry: {
    status: "Returning to evidence",
    evidence: "failed test → return to programs/project/src/lib.rs",
    tone: "error",
  },
  build: {
    status: "Build verified",
    evidence: "4/4 tests passing · anchor build complete · 3s",
    tone: "ok",
  },
  deploy: {
    status: "Deploying localnet",
    evidence: "anchor deploy · workspace validator",
    tone: "active",
  },
  complete: {
    status: "Deployment proved",
    evidence: "deploy success · 4.3s · 1.266 SOL rent",
    tone: "ok",
  },
};

function stateForStep(index: number, phase: Phase): StepState {
  if (phase === "idle") return "pending";
  if (phase === "write") return index === 0 ? "active" : "pending";
  if (phase === "test") {
    if (index === 0) return "complete";
    return index === 1 ? "error" : "pending";
  }
  if (phase === "retry") {
    if (index === 0) return "active";
    return index === 1 ? "error" : "pending";
  }
  if (phase === "build") {
    if (index < 2) return "complete";
    return index === 2 ? "active" : "pending";
  }
  if (phase === "deploy") return index < 3 ? "complete" : "active";
  return "complete";
}

function phaseAt(progress: number): Phase {
  return PHASES.find(({ at }) => progress >= at)?.phase ?? "idle";
}

export function WorkflowSequence({
  steps,
}: {
  steps: ReadonlyArray<{ step: string; body: string }>;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (motion.matches) {
        setPhase("complete");
        return;
      }

      const box = root.getBoundingClientRect();
      const start = window.innerHeight * 0.84;
      const finish = window.innerHeight * 0.16;
      const progress = Math.min(1, Math.max(0, (start - box.top) / (start - finish)));
      setPhase((current) => {
        const next = phaseAt(progress);
        return current === next ? current : next;
      });
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  const copy = PHASE_COPY[phase];

  return (
    <section ref={rootRef} className="brik-sequence" data-phase={phase}>
      <header className="brik-sequence-header">
        <span>Evidence loop · workspace run</span>
        <span className="brik-sequence-status" data-tone={copy.tone}>
          <span aria-hidden />
          {copy.status}
        </span>
      </header>

      <ol className="brik-sequence-rail">
        {steps.map((item, index) => {
          const state = stateForStep(index, phase);
          return (
            <li key={item.step} className="brik-sequence-step" data-state={state}>
              <div className="brik-sequence-node-row">
                <span className="brik-sequence-node" aria-hidden>
                  <BrikMark size={13} />
                </span>
                <span className="brik-sequence-step-state">
                  {state === "complete"
                    ? "verified"
                    : state === "error"
                      ? "failed"
                      : state === "active"
                        ? "running"
                        : "queued"}
                </span>
              </div>
              <h3 className="meta-label text-fg">{item.step}</h3>
              <p className="text-body text-fg-2">{item.body}</p>
            </li>
          );
        })}
      </ol>

      <footer className="brik-sequence-evidence" data-tone={copy.tone}>
        <span className="meta-label text-fg-3">Latest evidence</span>
        <code>{copy.evidence}</code>
      </footer>
    </section>
  );
}
