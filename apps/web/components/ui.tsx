import Link from "next/link";
import type { Status } from "../lib/status";
import { MARK_SMALL_PATH } from "./logo";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  compact?: boolean;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({
  href,
  variant = "secondary",
  compact = false,
  external = false,
  className = "",
  children,
}: ButtonLinkProps) {
  const classes = `btn btn-${variant} ${compact ? "btn-compact" : ""} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** The app is not open yet. Disabled rather than hidden, per components.md. */
export function ComingSoon({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      disabled
      className={`btn btn-primary ${compact ? "btn-compact" : ""}`}
    >
      Coming soon
    </button>
  );
}

export type { Status } from "../lib/status";

const STATUS_TONE: Record<Status, { dot: string; text: string }> = {
  ready: { dot: "#3A3A3A", text: "var(--brik-fg-3)" },
  sleeping: { dot: "#3A3A3A", text: "var(--brik-fg-3)" },
  building: { dot: "var(--brik-warn)", text: "var(--brik-warn)" },
  testing: { dot: "var(--brik-warn)", text: "var(--brik-warn)" },
  failed: { dot: "var(--brik-err)", text: "var(--brik-err)" },
  deployed: { dot: "var(--brik-ok)", text: "var(--brik-ok)" },
};

export function StatusBadge({ status }: { status: Status }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className="meta-label inline-flex items-center gap-2 rounded-[7px] border border-line px-3 py-[7px]"
      style={{ color: tone.text }}
    >
      <span
        className="size-[7px] rounded-[2px]"
        style={{ background: tone.dot }}
        aria-hidden
      />
      {status}
    </span>
  );
}

/** Usage meter: ten discrete blocks. Never animates. */
export function Meter({
  filled,
  label,
  value,
  tone = "var(--brik-cream)",
}: {
  filled: number;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="meta-label mb-2 flex justify-between text-fg-2">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="flex gap-[3px]" role="img" aria-label={`${label}: ${value}`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-2 flex-1 rounded-[2px]"
            style={{ background: i < filled ? tone : "var(--brik-line)" }}
          />
        ))}
      </div>
    </div>
  );
}

/** Workflow indicator: four notched marks. Complete steps at full opacity. */
export function WorkflowMarks({ complete = 4 }: { complete?: number }) {
  const steps = ["Write", "Test", "Build", "Deploy"];
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          {i > 0 && (
            <span className="glyph mr-2 text-code-sm text-fg-3" aria-hidden>
              →
            </span>
          )}
          <svg
            viewBox="0 0 640 640"
            width={15}
            height={15}
            fill="currentColor"
            style={{ opacity: i < complete ? 1 : 0.22 }}
            aria-hidden
          >
            <path d={MARK_SMALL_PATH} />
          </svg>
          <span className="meta-label text-fg-2">{step}</span>
        </li>
      ))}
    </ol>
  );
}
