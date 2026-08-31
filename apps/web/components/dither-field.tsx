"use client";

import { useEffect, useRef } from "react";

/**
 * Static halftone dot field, drawn once per resize on a 2D canvas.
 *
 * Print halftone rather than ordered dither: the dot grows with density
 * instead of appearing past a threshold, which is how a printed stamp carries
 * tone. The Bayer matrix stays on as a size ripple, so the lattice keeps its
 * grown-not-tiled texture, and two octaves of value noise break the grid into
 * islands.
 *
 * No shader, no frame loop, no WebGL context per section: the field never
 * changes once it is drawn, so animating it would only cost frames. It is
 * texture, never content, and every profile below keeps a quiet zone where the
 * copy sits so type is always read off the flat ground.
 */

const BAYER_8 = [
  0, 48, 12, 60, 3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
  8, 56, 4, 52, 11, 59, 7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
  2, 50, 14, 62, 1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58, 6, 54, 9, 57, 5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
];

interface FieldLight {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  strength: number;
}

interface FieldProfile {
  lights: FieldLight[];
  /** Where the copy sits. The field is pushed down to almost nothing here. */
  quiet: FieldLight;
}

/**
 * One profile per band, placed against that band's real layout: the field
 * brightens where the machine is and goes quiet where the words are.
 */
const FIELD_PROFILES = {
  /**
   * One ground for the whole page. The field is fixed to the viewport, so
   * these are screen positions, not page positions: light down both flanks
   * and along the bottom, quiet through the middle column where every band's
   * copy runs. Nothing here restarts when a section boundary scrolls past.
   */
  page: {
    lights: [
      { x: 0.06, y: 0.3, radiusX: 0.34, radiusY: 0.5, strength: 0.92 },
      { x: 0.95, y: 0.36, radiusX: 0.36, radiusY: 0.54, strength: 0.88 },
      { x: 0.5, y: 0.98, radiusX: 0.6, radiusY: 0.24, strength: 0.6 },
      { x: 0.5, y: 0.02, radiusX: 0.62, radiusY: 0.2, strength: 0.5 },
    ],
    quiet: { x: 0.5, y: 0.48, radiusX: 0.42, radiusY: 0.46, strength: 0.97 },
  },
} satisfies Record<string, FieldProfile>;

export type FieldVariant = keyof typeof FIELD_PROFILES;

type Accent = [number, number, number];

/** Brik cream. The field is the brand colour at very low alpha, never grey. */
const FALLBACK_ACCENT: Accent = [245, 239, 224];

/**
 * The accent lives on the enclosing section as the `--brik-field-accent` RGB
 * triplet, so the stylesheet stays the single source of truth for colour.
 */
function readAccent(element: Element): Accent {
  const raw = getComputedStyle(element).getPropertyValue("--brik-field-accent");
  const parts = raw.split(",").map((part) => Number.parseInt(part.trim(), 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return FALLBACK_ACCENT;
  return [parts[0], parts[1], parts[2]];
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = clamp((value - edge0) / (edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
}

function hash(x: number, y: number, seed: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(0, 1, x - x0);
  const ty = smoothstep(0, 1, y - y0);
  const top = hash(x0, y0, seed) * (1 - tx) + hash(x0 + 1, y0, seed) * tx;
  const bottom =
    hash(x0, y0 + 1, seed) * (1 - tx) + hash(x0 + 1, y0 + 1, seed) * tx;
  return top * (1 - ty) + bottom * ty;
}

function radialValue(x: number, y: number, light: FieldLight) {
  const distance = Math.hypot(
    (x - light.x) / light.radiusX,
    (y - light.y) / light.radiusY,
  );
  return Math.pow(1 - smoothstep(0.12, 1, distance), 1.45) * light.strength;
}

function renderField(
  canvas: HTMLCanvasElement,
  profile: FieldProfile,
  accent: Accent,
  seed: number,
  cellSize: number,
  pixelSize: number,
  intensity: number,
) {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;

  // The cells are CSS-sized and intentionally coarse, so a DPR above 1.5 adds
  // canvas memory without improving the visible lattice.
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.max(1, Math.round(bounds.width * dpr));
  const height = Math.max(1, Math.round(bounds.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  context.clearRect(0, 0, width, height);

  const pitch = Math.max(4, Math.round(cellSize * dpr));
  const pixel = Math.max(1, Math.round(pixelSize * dpr));
  const columns = Math.ceil(width / pitch);
  const rows = Math.ceil(height / pitch);
  const [red, green, blue] = accent;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column / Math.max(1, columns - 1);
      const y = row / Math.max(1, rows - 1);

      const broadLight = profile.lights.reduce(
        (maximum, light) => Math.max(maximum, radialValue(x, y, light)),
        0,
      );
      const macroNoise = valueNoise(x * 2.25 + 0.35, y * 2.05 + 0.7, seed);
      const islandNoise = valueNoise(x * 4.4 + 1.8, y * 3.8 + 2.2, seed + 11);
      const islandField = macroNoise * 0.68 + islandNoise * 0.32;
      const islandGate = smoothstep(0.28, 0.62, islandField);
      const quietZone = radialValue(x, y, profile.quiet);
      const edgeFade =
        smoothstep(0, 0.08, x) *
        smoothstep(0, 0.08, 1 - x) *
        smoothstep(0, 0.07, y) *
        smoothstep(0, 0.07, 1 - y);

      let density =
        broadLight * (0.54 + macroNoise * 0.62) * (0.25 + islandGate * 0.75);
      density = clamp(density * edgeFade * (1 - quietZone * 0.98));

      const ripple = 0.82 + (BAYER_8[(row % 8) * 8 + (column % 8)] / 63) * 0.36;
      const level = density * ripple - 0.1;
      if (level <= 0.035) continue;

      const radius = Math.min(pixel * 1.35, (0.3 + level * 1.6) * pixel);
      const alpha = Math.min(0.18, (0.04 + level * 0.1) * intensity);

      context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
      context.beginPath();
      context.arc(
        column * pitch + pixel,
        row * pitch + pixel,
        radius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
}

export function DitherField({
  className = "",
  variant,
  seed = 1,
  cellSize = 6,
  pixelSize = 1.5,
  intensity = 1,
}: {
  className?: string;
  variant: FieldVariant;
  seed?: number;
  cellSize?: number;
  pixelSize?: number;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        renderField(
          canvas,
          FIELD_PROFILES[variant],
          readAccent(canvas),
          seed,
          cellSize,
          pixelSize,
          intensity,
        );
      });
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [cellSize, intensity, pixelSize, seed, variant]);

  return (
    <div aria-hidden className={`brik-field ${className}`}>
      <canvas ref={canvasRef} role="presentation" />
    </div>
  );
}
