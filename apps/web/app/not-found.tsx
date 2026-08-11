import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";
import { ButtonLink } from "../components/ui";

export const metadata: Metadata = {
  title: "Not found",
};

/**
 * Where a closed route lands, as well as an address that never existed. The
 * copy has to be true of both, so it names neither.
 */
export default function NotFound() {
  return (
    <>
      <SiteNav />
      {/* Fills the screen under the nav so the footer does not float in the
          middle of an otherwise empty page. */}
      <main className="shell flex min-h-[calc(100svh-3.5rem)] items-center py-24">
        <div className="mx-auto max-w-[560px]">
          <p className="meta-label text-fg-3">404</p>
          <h1 className="font-display mt-4 text-display-md font-semibold">
            Nothing here.
          </h1>
          <p className="mt-4 max-w-[46ch] text-body-lg text-fg-2">
            This address does not exist, or it leads somewhere that is not open
            yet.
          </p>
          <div className="mt-9">
            <ButtonLink href="/">
              Back to the start <span className="glyph">→</span>
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
