import Link from "next/link";
import { BrikMark, BrikWordmark } from "../../components/logo";

export const metadata = {
  title: "BRIK — Brand",
};

// Internal brand reference page: the wordmark and mark evaluated at the
// sizes and on the surfaces that matter (docs/06). Not linked from
// public navigation.

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 40,
  flexWrap: "wrap",
};

function Panel({
  dark,
  children,
}: {
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: dark ? "#0d0d0d" : "#f4f3ef",
        color: dark ? "#f1f0eb" : "#111111",
        padding: 48,
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {children}
    </div>
  );
}

export default function Brand() {
  return (
    <main className="container" style={{ padding: "48px 24px 96px" }}>
      <div className="section-label" style={{ marginBottom: 24 }}>
        <Link href="/">← BRIK</Link> / BRAND
      </div>

      <div style={{ display: "grid", gap: 1 }}>
        <Panel>
          <BrikWordmark height={72} />
          <div style={row}>
            <BrikWordmark height={32} />
            <BrikWordmark height={20} />
            <BrikWordmark height={12} />
          </div>
          <div style={row}>
            <BrikMark size={64} />
            <BrikMark size={32} />
            <BrikMark size={16} />
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--fg-meta)", letterSpacing: "0.1em" }}
            >
              64 / 32 / 16 PX
            </span>
          </div>
          <div style={row}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <BrikMark size={16} />
              <BrikWordmark height={13} />
            </span>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--fg-meta)", letterSpacing: "0.1em" }}
            >
              LOCKUP — NAVIGATION SCALE
            </span>
          </div>
        </Panel>

        <Panel dark>
          <BrikWordmark height={72} />
          <div style={row}>
            <BrikMark size={64} />
            <BrikMark size={32} />
            <BrikMark size={16} />
          </div>
        </Panel>
      </div>

      <div
        className="mono"
        style={{
          marginTop: 32,
          fontSize: 12,
          lineHeight: 2,
          color: "var(--fg-secondary)",
          maxWidth: 640,
        }}
      >
        <div>CONSTRUCTION — rectangular primitives on a 10u grid, 2u stroke.</div>
        <div>COUNTERS — perfect rectangles. No curves, no diagonals except stepped.</div>
        <div>MARK — four blocks; the fourth at 45% — the last piece snapping in.</div>
        <div>MINIMUM — mark 16px, wordmark 12px height.</div>
        <div>AVOID — thin strokes, letterspacing for elegance, gradients, glow.</div>
      </div>
    </main>
  );
}
