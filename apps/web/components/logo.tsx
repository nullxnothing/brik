/**
 * Brik mark and wordmark. Official geometry from the icon handoff:
 * one path on a 640-unit grid, outer radius 96 (15%), notch 256x256,
 * concave fillet 64. The small cut tightens radii for 16-32px rendering.
 */

export const MARK_PATH =
  "M96 0H288A96 96 0 0 1 384 96V192A64 64 0 0 0 448 256H544A96 96 0 0 1 " +
  "640 352V544A96 96 0 0 1 544 640H96A96 96 0 0 1 0 544V96A96 96 0 0 1 96 0Z";

export const MARK_SMALL_PATH =
  "M72 0H312A72 72 0 0 1 384 72V216A40 40 0 0 0 424 256H568A72 72 0 0 1 " +
  "640 328V568A72 72 0 0 1 568 640H72A72 72 0 0 1 0 568V72A72 72 0 0 1 72 0Z";

export const BLOCK_PATH =
  "M288 0H544A96 96 0 0 1 640 96V352A96 96 0 0 0 544 256H448A64 64 0 0 1 " +
  "384 192V96A96 96 0 0 0 288 0Z";

interface MarkProps {
  size?: number;
  className?: string;
}

export function BrikMark({ size = 20, className }: MarkProps) {
  const path = size < 32 ? MARK_SMALL_PATH : MARK_PATH;
  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Brik"
    >
      <path d={path} />
    </svg>
  );
}

export function BrikBlock({ size = 20, className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d={BLOCK_PATH} />
    </svg>
  );
}

/**
 * Live-type wordmark: the display face with the mark covering the tittle of
 * the i. The offsets are measured from the face rather than carried over, so
 * they move when the face does. Space Grotesk 500: "Br" advances 1.05em, the
 * dotless i advances 0.256em (centre 1.178em), x-height is 0.50em, and with
 * line-height 1 the baseline sits 0.155em above the box, putting the stem top
 * at 0.655em. The mark is 0.21em wide and clears the stem by 0.075em.
 */
export function BrikWordmark({ size = 24 }: { size?: number }) {
  const tittlePath = size * 0.21 < 32 ? MARK_SMALL_PATH : MARK_PATH;
  return (
    <span
      className="font-display relative inline-block font-medium"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-label="Brik"
    >
      <span aria-hidden>Br{"ı"}k</span>
      <svg
        viewBox="0 0 640 640"
        fill="currentColor"
        aria-hidden
        style={{
          position: "absolute",
          left: "1.073em",
          bottom: "0.73em",
          width: "0.21em",
          height: "0.21em",
        }}
      >
        <path d={tittlePath} />
      </svg>
    </span>
  );
}

/**
 * The notch loader: the mark at rest opacity with the missing course
 * snapping in. Both paths share the viewBox, so they union exactly.
 */
export function BrikLoader({ size = 16 }: { size?: number }) {
  return (
    <span
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Working"
    >
      <svg viewBox="0 0 640 640" fill="currentColor" className="absolute inset-0 opacity-[0.22]">
        <path d={size < 32 ? MARK_SMALL_PATH : MARK_PATH} />
      </svg>
      <svg
        viewBox="0 0 640 640"
        fill="currentColor"
        className="animate-brik-snap absolute inset-0"
      >
        <path d={BLOCK_PATH} />
      </svg>
    </span>
  );
}
