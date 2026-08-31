/**
 * The two primitives every band on the landing page is built from.
 *
 * A panel is a flat 1px surface: the machined edge belongs to the workspace
 * shell and the demo frame, and marketing keeps the base system's border. Depth
 * out here comes from overlap and stacking order instead.
 *
 * A reading is the page's one way of stating a fact: etched term on the left,
 * the measured value it produced on the right, figures tabular so a column of
 * them holds its edge. Every claim on the page that has a number behind it is
 * set this way, which is what keeps marketing copy and instrument output
 * looking like the same product.
 */

export function Panel({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-card border border-line bg-surface p-5 ${className}`}>
      <span className="meta-label block text-fg-3">{label}</span>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function Reading({
  term,
  value,
  tone,
}: {
  term: string;
  value: string;
  tone?: "ok";
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-fg-3">{term}</dt>
      <dd className={`tabular-nums ${tone === "ok" ? "text-ok" : "text-fg"}`}>
        {value}
      </dd>
    </div>
  );
}
