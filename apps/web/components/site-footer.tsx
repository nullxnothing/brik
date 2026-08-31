import Link from "next/link";
import { GitHubLogo, XLogo } from "./icons";
import { BrikWordmark } from "./logo";

const SOCIAL = [
  { label: "Brik on X", href: "https://x.com/brikbuilders", Icon: XLogo },
  {
    label: "Brik on GitHub",
    href: "https://github.com/nullxnothing/Brick",
    Icon: GitHubLogo,
  },
];

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Start building", href: "/new" },
      { label: "Templates", href: "/#templates" },
      { label: "How it works", href: "/#build" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Brand", href: "/brand" },
    ],
  },
];

/**
 * The page ends on the same grid it ran on: the mark and what the product is
 * on the left, what you can reach on the right, and the one address that
 * belongs to a person underneath. No rule above it, because the closing band
 * already carries the turn.
 */
export function SiteFooter() {
  return (
    <footer className="relative">
      <div className="shell grid gap-x-10 gap-y-12 pt-16 pb-10 md:grid-cols-12 md:pt-20">
        <div className="md:col-span-5">
          <BrikWordmark size={20} />
          <p className="mt-4 max-w-[30ch] text-body text-fg-3">
            Build on Solana. From your browser.
          </p>
          <div className="mt-6 flex items-center gap-1">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid size-11 place-items-center rounded-control text-fg-3 transition-colors duration-150 hover:bg-selected hover:text-fg sm:size-9"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-x-10 gap-y-10 md:col-span-6 md:col-start-7">
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="meta-label text-fg-off">{column.heading}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body text-fg-2 transition-colors duration-150 hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-4 border-t border-hairline py-6">
        <a
          href="mailto:dylan@brik.builders"
          className="font-mono text-code-sm text-fg-3 transition-colors duration-150 hover:text-fg"
        >
          Dylan@brik.builders
        </a>
        <a
          href="https://x.com/brikbuilders"
          target="_blank"
          rel="noreferrer"
          aria-label="Brik Builders on X"
          className="font-mono text-code-sm text-fg-off transition-colors duration-150 hover:text-fg"
        >
          @brikbuilders
        </a>
      </div>
    </footer>
  );
}
