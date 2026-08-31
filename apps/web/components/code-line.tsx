/**
 * One definition of how source reads, shared by the workspace editor and the
 * picture of it on the landing page, so the two cannot drift.
 *
 * Monochrome highlighting: value, not hue. Keywords carry the emphasis, and the
 * state hues stay reserved for the lamps that report the run.
 */

const KEYWORDS = new Set([
  "use", "pub", "fn", "mod", "let", "mut", "super", "impl", "struct",
  "import", "from", "export", "async", "const", "return", "function", "new",
  "typeof", "await", "if",
]);

export function CodeLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (trimmed.startsWith("#[") || trimmed.startsWith("//")) {
    return <span className="text-[#4e4e4a]">{line}</span>;
  }
  const parts = line.split(/([A-Za-z_][A-Za-z0-9_]*|"[^"]*")/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('"')) {
          return (
            <span key={i} className="text-cream/70">
              {part}
            </span>
          );
        }
        if (KEYWORDS.has(part)) {
          return (
            <span key={i} className="font-medium text-cream">
              {part}
            </span>
          );
        }
        if (/^[A-Za-z_]/.test(part)) {
          return (
            <span key={i} className="text-fg">
              {part}
            </span>
          );
        }
        return (
          <span key={i} className="text-[#8a8a84]">
            {part}
          </span>
        );
      })}
    </>
  );
}
