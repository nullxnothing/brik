"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TEMPLATES } from "../../lib/templates";

const GITHUB_URL_PATTERN = /^(https:\/\/github\.com\/|git@github\.com:)[\w.-]+\/[\w.-]+/;

const SUGGESTIONS = [
  "A tip jar that splits SOL between two wallets",
  "A token-gated page for holders of my SPL token",
  "An NFT mint with a whitelist phase",
];

export function StartForm({ initialSource }: { initialSource?: string }) {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [repo, setRepo] = useState("");
  const [repoError, setRepoError] = useState<string | null>(null);
  const [isImport, setIsImport] = useState(initialSource === "github");

  const startIdea = (event: React.FormEvent) => {
    event.preventDefault();
    const task = idea.trim();
    if (!task) return;
    router.push(`/workspace?task=${encodeURIComponent(task)}`);
  };

  const startImport = (event: React.FormEvent) => {
    event.preventDefault();
    const url = repo.trim();
    if (!GITHUB_URL_PATTERN.test(url)) {
      setRepoError("Not a GitHub repository URL.");
      return;
    }
    setRepoError(null);
    router.push(`/workspace?repo=${encodeURIComponent(url)}`);
  };

  return (
    <div className="space-y-16">
      <section>
        {isImport ? (
          <form onSubmit={startImport}>
            <label htmlFor="repo" className="meta-label block text-fg-2">
              Repository URL
            </label>
            <div className="mt-2.5 flex flex-wrap gap-3">
              <input
                id="repo"
                value={repo}
                onChange={(event) => {
                  setRepo(event.target.value);
                  setRepoError(null);
                }}
                placeholder="https://github.com/you/your-program"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={repoError ? true : undefined}
                aria-describedby={repoError ? "repo-error" : undefined}
                className="field field-mono min-w-0 flex-1"
                style={repoError ? { borderColor: "var(--brik-err)" } : undefined}
              />
              <button type="submit" className="btn btn-primary">
                Import <span className="glyph">→</span>
              </button>
            </div>
            {repoError && (
              <p
                id="repo-error"
                className="mt-2.5 font-mono text-[11.5px] text-err"
              >
                {repoError}
              </p>
            )}
            <button
              type="button"
              onClick={() => setIsImport(false)}
              className="btn btn-ghost mt-4 px-0"
            >
              Describe an idea instead
            </button>
          </form>
        ) : (
          <form onSubmit={startIdea}>
            <label htmlFor="idea" className="meta-label block text-fg-2">
              Describe it
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  startIdea(event);
                }
              }}
              rows={3}
              placeholder="A tip jar that splits SOL between two wallets"
              className="field mt-2.5 resize-none text-body-lg"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={!idea.trim()}>
                Start building <span className="glyph">→</span>
              </button>
              <span className="meta-label text-fg-3">
                <span className="glyph">⌘</span>
                <span className="glyph">⏎</span> to start
              </span>
              <button
                type="button"
                onClick={() => setIsImport(true)}
                className="btn btn-ghost ml-auto px-0"
              >
                Import from GitHub
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setIdea(suggestion)}
                  className="btn btn-secondary btn-compact text-fg-2"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="meta-label text-fg-2">Or open a template</h2>
        <div className="seam mt-4 rounded-card border border-line sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <a
              key={template.slug}
              href={`/workspace?template=${template.slug}`}
              className="group flex items-start gap-4 p-6 transition-colors duration-150 hover:bg-selected"
            >
              <span className="min-w-0">
                <span className="block text-body font-medium">{template.name}</span>
                <span className="mt-1.5 block text-body text-fg-2">
                  {template.tagline}
                </span>
                <span className="meta-label mt-3 block text-fg-3">
                  {template.stack}
                </span>
              </span>
              <span className="glyph ml-auto text-fg-3 transition-transform duration-150 group-hover:translate-x-0.5">
                →
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-8">
        <p className="text-body text-fg-2">
          Prefer to start from nothing? An empty workspace has the same toolchain.
        </p>
        <a href="/workspace?blank=1" className="btn btn-secondary">
          Blank project
        </a>
      </section>
    </div>
  );
}
