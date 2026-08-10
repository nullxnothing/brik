import Link from "next/link";
import { BrikMark, BrikWordmark } from "../../components/logo";

export const metadata = {
  title: "Brik — Brand",
};

// Internal brand reference page: the notched-block mark and "Brik"
// wordmark evaluated at the sizes and on the surfaces that matter
// (docs/06). Not linked from public navigation.

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
        borderRadius: 12,
        background: dark ? "#0c0c0c" : "#f5efe0",
        color: dark ? "#f5efe0" : "#0c0c0c",
        padding: 48,
        display: "flex",
        flexDirection: "column",
        gap: 44,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{ fontSize: 11, opacity: 0.55, letterSpacing: "0.1em" }}
    >
      {children}
    </span>
  );
}

export default function Brand() {
  return (
    <main className="container" style={{ padding: "48px 24px 96px" }}>
      <div className="section-label" style={{ marginBottom: 24 }}>
        <Link href="/">← Brik</Link> / BRAND
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <Panel dark>
          <BrikWordmark size={120} />
          <div style={row}>
            <BrikWordmark size={56} />
            <BrikWordmark size={32} />
            <BrikWordmark size={20} />
          </div>
          <div style={row}>
            <BrikMark size={96} />
            <BrikMark size={64} />
            <BrikMark size={32} />
            <BrikMark size={16} />
            <Label>96 / 64 / 32 / 16 PX</Label>
          </div>
        </Panel>

        <Panel>
          <BrikWordmark size={120} />
          <div style={row}>
            <BrikMark size={64} />
            <BrikMark size={32} />
            <BrikMark size={16} />
            <Label>INVERTED — NEAR-BLACK ON CREAM</Label>
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
          maxWidth: 680,
        }}
      >
        <div>MARK — rounded square, stepped notch cut from the top-right corner.</div>
        <div>RADII — soft outer corners ~15% of size; rounded concave inner corner.</div>
        <div>WORDMARK — “Brik” in the rounded display face; the mark is the dot of the i.</div>
        <div>COLOR — cream #F5EFE0 on near-black #0C0C0C primary; inverts cleanly.</div>
        <div>MINIMUM — mark 16px. Never letterspace or all-caps the wordmark.</div>
        <div>AVOID — thin strokes, sharp corners, gradients, glow, brick texture.</div>
      </div>
    </main>
  );
}
