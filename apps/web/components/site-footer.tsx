import { BrikMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-7">
        <span className="meta-label flex items-center gap-3 text-fg-3">
          <BrikMark size={14} />
          Build on Solana. From your browser.
        </span>
        <span className="meta-label flex items-center gap-6 text-fg-3">
          <a
            href="https://github.com/nullxnothing/Brick"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-150 hover:text-fg"
          >
            GitHub <span className="glyph">↗</span>
          </a>
          <span>© 2026 Brik</span>
        </span>
      </div>
    </footer>
  );
}
