/**
 * BRIK logo — the notched block mark and the "Brik" wordmark, per
 * docs/06_frontend_brand_direction.md.
 *
 * The mark is a rounded square with a stepped cut removed from the
 * top-right corner — a brick with one course missing. The wordmark is
 * "Brik" in the rounded display face (Fredoka), with the mark replacing
 * the dot of the i. Both render in currentColor.
 */

export const BLOCK_PATH =
  "M 0 20 Q 0 0 20 0 L 46 0 Q 56 0 56 10 L 56 24 Q 56 34 66 34 L 84 34 " +
  "Q 100 34 100 50 L 100 80 Q 100 100 80 100 L 20 100 Q 0 100 0 80 Z";

export function BrikMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label="Brik mark"
    >
      <path d={BLOCK_PATH} />
    </svg>
  );
}

export function BrikWordmark({ size = 24 }: { size?: number }) {
  // Ratios tuned at display scale: dot ≈ 0.26em wide, floating
  // ≈ 0.07em below the line-box top, centered on the dotless ı.
  const dot = size * 0.26;
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "0.01em",
        display: "inline-block",
      }}
      aria-label="Brik"
    >
      Br
      <span style={{ position: "relative", display: "inline-block" }} aria-hidden>
        ı
        <svg
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: size * 0.07,
            width: dot,
            height: dot,
          }}
          fill="currentColor"
        >
          <path d={BLOCK_PATH} />
        </svg>
      </span>
      k
    </span>
  );
}
