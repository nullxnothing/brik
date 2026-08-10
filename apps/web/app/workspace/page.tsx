import type { Metadata } from "next";
import { DEFAULT_TEMPLATE, findTemplate } from "../../lib/templates";
import { WorkspaceShell } from "./workspace-shell";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "A running Solana workspace: agent, editor, terminal, and a one-click devnet deploy.",
};

export default async function Workspace({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; template?: string; repo?: string }>;
}) {
  const { task, template, repo } = await searchParams;
  const preset = findTemplate(template) ?? DEFAULT_TEMPLATE;

  const objective =
    task?.slice(0, 160) ??
    (repo
      ? `Set up and build ${repo.replace(/^https:\/\/github\.com\//, "")}`
      : preset.task);

  return <WorkspaceShell task={objective} template={preset} />;
}
