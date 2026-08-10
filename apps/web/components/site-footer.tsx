import { BrikMark } from "./logo";

const SOCIAL = [
  { label: "X", href: "https://x.com/brikbuilders" },
  { label: "GitHub", href: "https://github.com/nullxnothing/Brick" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="shell flex flex-wrap items-center justify-between gap-6 py-7">
        <span className="meta-label flex items-center gap-3 text-fg-3">
          <BrikMark size={14} />
          Build on Solana. From your browser.
        </span>
        <nav className="flex flex-wrap items-center gap-6">
          {SOCIAL.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="meta-label text-fg-3 transition-colors duration-150 hover:text-fg"
            >
              {item.label} <span className="glyph">↗</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-4 border-t border-hairline py-5">
        <span className="meta-label text-fg-3">© 2026 Brik Builders LLC</span>
        <a
          href="mailto:Dylan@brik.builders"
          className="font-mono text-code-sm text-fg-3 transition-colors duration-150 hover:text-fg"
        >
          Dylan@brik.builders
        </a>
      </div>
    </footer>
  );
}
