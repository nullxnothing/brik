"use client";

const KEYWORDS = new Set([
  "use", "pub", "fn", "mod", "let", "mut", "super", "impl", "struct",
  "import", "from", "export", "async", "const", "return", "function", "new",
  "typeof", "await", "if",
]);

/** Monochrome highlighting: value, not hue. Keywords carry the emphasis. */
function CodeLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (trimmed.startsWith("#[") || trimmed.startsWith("//")) {
    return <span className="text-fg-3">{line}</span>;
  }
  const parts = line.split(/([A-Za-z_][A-Za-z0-9_]*|"[^"]*")/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('"')) {
          return (
            <span key={i} className="text-cream/70">
              {part}
            </span>
          );
        }
        if (KEYWORDS.has(part)) {
          return (
            <span key={i} className="font-medium text-cream">
              {part}
            </span>
          );
        }
        if (/^[A-Za-z_]/.test(part)) {
          return (
            <span key={i} className="text-fg">
              {part}
            </span>
          );
        }
        return (
          <span key={i} className="text-fg-3">
            {part}
          </span>
        );
      })}
    </>
  );
}

export function Editor({
  source,
  added = [],
}: {
  source: string[];
  /** Indices rendered as additions once an agent edits the file. */
  added?: number[];
}) {
  const addedSet = new Set(added);
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4 font-mono text-code leading-[1.7]">
      <pre className="min-w-max">
        {source.map((line, i) => {
          const isAdded = addedSet.has(i);
          return (
            <div
              key={i}
              className="flex"
              style={isAdded ? { background: "var(--brik-ok-tint)" } : undefined}
            >
              <span className="w-9 shrink-0 select-none text-right text-fg-3">
                {i + 1}
              </span>
              <span
                className={`w-5 shrink-0 select-none text-center ${
                  isAdded ? "text-ok" : "text-transparent"
                }`}
                aria-hidden
              >
                +
              </span>
              <span>
                <CodeLine line={line} />
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

function directoryOf(path: string) {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "" : path.slice(0, cut);
}

/** Group by directory, root files first. A real project has two Cargo.toml
 *  files, so a flat list of basenames would be ambiguous. */
function groupByDirectory(files: string[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const path of files) {
    const directory = directoryOf(path);
    const group = groups.get(directory);
    if (group) group.push(path);
    else groups.set(directory, [path]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
}

export function Files({
  files,
  entryFile,
  changed = [],
}: {
  files: string[];
  entryFile?: string;
  /** Paths an agent has modified since the workspace started. */
  changed?: string[];
}) {
  return (
    <div className="overflow-auto p-3">
      <div className="meta-label px-2 pb-3 text-fg-3">Files</div>
      {groupByDirectory(files).map(([directory, paths]) => (
        <div key={directory} className="[&:not(:first-child)]:mt-3">
          {directory && (
            <div
              className="truncate px-2 pb-1 font-mono text-code-sm text-fg-3"
              title={directory}
            >
              {directory}/
            </div>
          )}
          {paths.map((path) => (
            <div
              key={path}
              title={path}
              className={`flex items-center justify-between gap-2 rounded-control px-2 py-1.5 font-mono text-code-sm ${
                path === entryFile ? "bg-selected text-fg" : "text-fg-2"
              } ${directory ? "pl-4" : ""}`}
            >
              <span className="truncate">{fileName(path)}</span>
              {changed.includes(path) && <span className="text-warn">M</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
