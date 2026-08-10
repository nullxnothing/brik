import Link from "next/link";
import { BrikWordmark } from "./logo";
import { ComingSoon } from "./ui";

const LINKS = [
  { label: "Build", href: "/#build" },
  { label: "Templates", href: "/#templates" },
];

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-hairline bg-canvas">
      <div className="shell flex h-14 items-center justify-between">
        <Link href="/" aria-label="Brik home" className="text-fg">
          <BrikWordmark size={22} />
        </Link>
        <div className="flex items-center gap-7">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="meta-label hidden text-fg-2 transition-colors duration-150 hover:text-fg sm:block"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/nullxnothing/Brick"
            target="_blank"
            rel="noreferrer"
            className="meta-label hidden text-fg-2 transition-colors duration-150 hover:text-fg sm:block"
          >
            GitHub <span className="glyph">↗</span>
          </a>
          <ComingSoon compact />
        </div>
      </div>
    </nav>
  );
}
