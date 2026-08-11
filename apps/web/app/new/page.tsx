import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { isWorkspaceOpen } from "../../lib/workspace/gate";
import { StartForm } from "./start-form";

export function generateMetadata(): Metadata {
  if (!isWorkspaceOpen()) return { title: "Not found" };
  return {
    title: "Start a project",
    description:
      "Describe an app, open a template, or import a repository. Brik gives you a running Solana workspace in seconds.",
  };
}

export default async function NewProject({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  // Every path off this page starts a workspace, so it closes with one.
  if (!isWorkspaceOpen()) notFound();

  const { source } = await searchParams;

  return (
    <>
      <SiteNav />
      <main className="shell py-20 md:py-24">
        <div className="mx-auto max-w-[720px]">
          <h1 className="font-display text-display-md font-semibold">
            What do you want to build?
          </h1>
          <p className="mt-4 max-w-[52ch] text-body-lg text-fg-2">
            Your workspace starts immediately. Sign up later, when you want to
            keep it.
          </p>
          <div className="mt-12">
            <StartForm initialSource={source} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
