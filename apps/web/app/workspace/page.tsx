import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_TEMPLATE, findTemplate } from "../../lib/templates";
import { isWorkspaceOpen } from "../../lib/workspace/gate";
import { WorkspaceShell } from "./workspace-shell";

// Metadata is resolved even when the page renders as a 404, so a closed route
// would otherwise put "Workspace" in the tab of a page that says nothing here.
export function generateMetadata(): Metadata {
  if (!isWorkspaceOpen()) return { title: "Not found" };
  return {
    title: "Workspace",
    description:
      "A running Solana workspace: a container with the toolchain, a local validator, and a live build.",
    // Every task, template, and repo arrives here as a query string, and each
    // one was being indexed as its own page under the same title.
    alternates: { canonical: "/workspace" },
  };
}

export default async function Workspace({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; template?: string; repo?: string }>;
}) {
  // The route stays in the repo because it is the product. It answers only
  // where the container it needs can actually be started.
  if (!isWorkspaceOpen()) notFound();

  const { task, template, repo } = await searchParams;
  const preset = findTemplate(template) ?? DEFAULT_TEMPLATE;

  // The objective the visitor arrived with. It labels the run; nothing acts on
  // it until an agent exists, so it falls back to what the template does.
  const objective =
    task?.slice(0, 160) ??
    (repo
      ? `Set up and build ${repo.replace(/^https:\/\/github\.com\//, "")}`
      : preset.task);

  return <WorkspaceShell task={objective} template={preset.slug} />;
}
