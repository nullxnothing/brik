"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GitHubLogo, XLogo } from "./icons";
import { BrikWordmark } from "./logo";
import { ButtonLink } from "./ui";

const LINKS = [
  { label: "Build", href: "/#build", id: "build" },
  { label: "Templates", href: "/#templates", id: "templates" },
  { label: "About", href: "/#about", id: "about" },
];

const SOCIAL = [
  { label: "Brik on X", href: "https://x.com/brikbuilders", Icon: XLogo },
  {
    label: "Brik on GitHub",
    href: "https://github.com/nullxnothing/Brick",
    Icon: GitHubLogo,
  },
];

/**
 * The bar earns its hairline: at the top of the page it is part of the hero and
 * carries no edge, and it only separates itself from the content once there is
 * content above it to separate from. The current section is marked with a tick
 * under the link rather than a colour change, so the mark reads at a glance and
 * never relies on colour alone.
 */
export function SiteNav({ wide = false }: { wide?: boolean }) {
  const [lifted, setLifted] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map(({ id }) => document.getElementById(id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setCurrent(hit.target.id);
      },
      // A band counts as current while it holds the upper third of the screen.
      { rootMargin: "-12% 0px -66% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="brik-nav sticky top-0 z-20" data-lifted={lifted}>
      <div
        className={`${wide ? "brik-landing-frame" : "shell"} flex h-14 items-center justify-between`}
      >
        <Link
          href="/"
          aria-label="Brik home"
          className="rounded-control text-fg transition-opacity duration-150 hover:opacity-80"
        >
          <BrikWordmark size={22} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={current === link.id ? "true" : undefined}
              className="brik-nav-link meta-label hidden px-3 py-2 text-fg-2 sm:block"
            >
              {link.label}
            </Link>
          ))}
          <span
            aria-disabled="true"
            title="Coming soon"
            className="brik-nav-link meta-label hidden cursor-default px-3 py-2 normal-case text-fg-2 md:block"
          >
            $brik
          </span>
          <span
            className="mx-2 hidden h-4 w-px bg-line sm:block"
            aria-hidden
          />
          {SOCIAL.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="hidden size-9 place-items-center rounded-control text-fg-2 transition-colors duration-150 hover:bg-selected hover:text-fg sm:grid"
            >
              <Icon size={15} />
            </a>
          ))}
          <ButtonLink href="/new" variant="primary" compact className="ml-2">
            Start building
          </ButtonLink>
        </div>
      </div>
    </nav>
  );
}
