"use client";

import { BrikLoader, BrikMark } from "./logo";
import type { Status } from "./ui";

/**
 * The centre pane's Preview tab.
 *
 * A workspace program runs on the container's own validator and is not served
 * over HTTP, so there is nothing to frame here yet. Preview URLs arrive with
 * the deploy surface; until then this pane says what the workspace is doing and
 * stops there, rather than rendering an app that does not exist.
 */
export function AppPreview({
  status,
  detail,
}: {
  status: Status;
  detail: string;
}) {
  const isSettled = status === "deployed" || status === "failed";
  const headline =
    status === "deployed"
      ? "Deployed to the workspace validator"
      : status === "failed"
        ? "The run stopped"
        : "Your app will appear here";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      {isSettled ? <BrikMark size={22} /> : <BrikLoader size={28} />}
      <div className="max-w-[46ch]">
        <p className="text-body-lg text-fg">{headline}</p>
        <p className="mt-2 text-body text-fg-2">{detail}</p>
      </div>
    </div>
  );
}
