/**
 * BRIK logo — wordmark and mark, per docs/06_frontend_brand_direction.md.
 *
 * Letterforms are constructed from rectangular primitives on a 10-unit
 * grid (stroke = 2u): squared geometry, no curves, counters are perfect
 * rectangles. The mark is four blocks; one sits at reduced opacity —
 * the last piece snapping into place. Both render in currentColor so
 * they inherit theme and remain legible at 16px.
 */

type Rect = [x: number, y: number, w: number, h: number];

const LETTERS: { ox: number; rects: Rect[] }[] = [
  // B
  {
    ox: 0,
    rects: [
      [0, 0, 2, 10],
      [0, 0, 7, 2],
      [0, 4, 7, 2],
      [0, 8, 7, 2],
      [5, 0, 2, 10],
    ],
  },
  // R — stepped leg keeps the construction rectangular
  {
    ox: 9.5,
    rects: [
      [0, 0, 2, 10],
      [0, 0, 7, 2],
      [0, 4, 7, 2],
      [5, 0, 2, 6],
      [3.5, 6, 2, 2],
      [5, 8, 2, 2],
    ],
  },
  // I
  { ox: 19, rects: [[0, 0, 2, 10]] },
  // K — stepped diagonal arms, same construction as the R leg
  {
    ox: 23.5,
    rects: [
      [0, 0, 2, 10],
      [2, 4, 2, 2],
      [3.5, 2, 2, 2.5],
      [5, 0, 2, 2.8],
      [3.5, 5.5, 2, 2.5],
      [5, 7.2, 2, 2.8],
    ],
  },
];

export function BrikWordmark({ height = 20 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 30.5 10"
      height={height}
      width={height * 3.05}
      fill="currentColor"
      role="img"
      aria-label="BRIK"
    >
      {LETTERS.flatMap((l, i) =>
        l.rects.map(([x, y, w, h], j) => (
          <rect key={`${i}-${j}`} x={l.ox + x} y={y} width={w} height={h} />
        )),
      )}
    </svg>
  );
}

export function BrikMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 10 10"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label="BRIK mark"
    >
      <rect x="0" y="0" width="4.4" height="4.4" />
      <rect x="5.6" y="0" width="4.4" height="4.4" />
      <rect x="0" y="5.6" width="4.4" height="4.4" />
      <rect x="5.6" y="5.6" width="4.4" height="4.4" opacity="0.45" />
    </svg>
  );
}
