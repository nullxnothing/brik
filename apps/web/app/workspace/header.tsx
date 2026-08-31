"use client";

import Link from "next/link";
import { BrikWordmark } from "../../components/logo";
import { Annunciator, type Lamps } from "../../components/chassis";

/**
 * The top bar: a translucent tint over the chassis, so the grain and the sheen
 * run through it rather than stopping at its edge.
 *
 * Status is lamps, not text. The Deploy key is the only cream object in the
 * shell, and it is dead until there is something to deploy.
 */
export function WorkspaceHeader({
  project,
  named,
  lamps,
  status,
  isBusy,
  isDeployed,
  onDeploy,
}: {
  /** The project inside the container, once the workspace has reported it. */
  project?: string;
  /** The chassis markings have been stamped; the name goes on with them. */
  named: boolean;
  lamps: Lamps;
  /** The run status in words, for a screen reader and the Deploy label. */
  status: string;
  isBusy: boolean;
  isDeployed: boolean;
  onDeploy: () => void;
}) {
  return (
    <header className="brik-chassis-bar flex h-[60px] shrink-0 items-center justify-between gap-3 px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/"
          aria-label="Brik home"
          className="brik-stamped shrink-0 rounded-[4px]"
        >
          <BrikWordmark size={21} />
        </Link>
        {project && (
          <span
            className="brik-stamp-in hidden truncate font-mono text-[11.5px] text-fg-3 [text-shadow:0_1px_0_rgba(0,0,0,.85)] sm:block"
            data-on={named}
          >
            {project}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <Annunciator lamps={lamps} status={status} />
        <span className="brik-etch-sm hidden lg:inline">LOCALNET</span>
        <button
          type="button"
          onClick={onDeploy}
          disabled={isBusy}
          className="brik-key brik-key-primary h-[38px] px-4 text-[14.5px] sm:px-[22px]"
          aria-label={isDeployed ? "Redeploy the program" : "Deploy the program"}
          aria-keyshortcuts="Meta+Enter Control+Enter"
        >
          {isDeployed ? "Redeploy" : "Deploy"}
        </button>
      </div>
    </header>
  );
}
