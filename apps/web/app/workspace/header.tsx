"use client";

import Link from "next/link";
import { BrikLoader, BrikWordmark } from "../../components/logo";
import { StatusBadge, type Status } from "../../components/ui";

export function WorkspaceHeader({
  project,
  status,
  isRunning,
  isDeployed,
  onDeploy,
}: {
  project: string;
  status: Status;
  isRunning: boolean;
  isDeployed: boolean;
  onDeploy: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-line px-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" aria-label="Brik home" className="shrink-0 text-fg">
          <BrikWordmark size={18} />
        </Link>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <span className="hidden truncate font-mono text-code-sm text-fg sm:block">
          {project}
        </span>
        <span className="hidden font-mono text-code-sm text-fg-3 md:block">main</span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="meta-label hidden text-fg-3 lg:block">Localnet</span>
        <StatusBadge status={status} />
        <button
          type="button"
          onClick={onDeploy}
          className="btn btn-primary btn-compact"
          disabled={isRunning}
          aria-label={isDeployed ? "Redeploy the program" : "Deploy the program"}
        >
          {isRunning ? (
            <>
              <BrikLoader size={13} />
              <span className="hidden sm:inline">
                {status === "testing" ? "Testing" : "Building"}
              </span>
            </>
          ) : isDeployed ? (
            "Redeploy"
          ) : (
            "Deploy"
          )}
        </button>
      </div>
    </header>
  );
}
