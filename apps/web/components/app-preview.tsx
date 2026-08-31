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
  action,
}: {
  status: Status;
  detail: string;
  /** Where the thing this pane is pointing at actually lives. A state that
   *  names another panel should be able to open it. */
  action?: { label: string; onClick: () => void };
}) {
  const isSettled = status === "deployed" || status === "failed";
  // Never "your app will appear here": a deploy produces no URL yet, so the
  // empty state would promise exactly what the deployed state has to retract.
  const headline =
    status === "deployed"
      ? "Deployed to the workspace validator"
      : status === "failed"
        ? "The run stopped"
        : "Nothing to preview yet";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      {isSettled ? <BrikMark size={22} /> : <BrikLoader size={28} />}
      <div className="max-w-[46ch]">
        <p className="text-body-lg text-fg">{headline}</p>
        <p className="mt-2 text-body text-fg-2">{detail}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="brik-key brik-touch px-4 py-2 text-body"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
