"use client";

import { Etch } from "./chassis";
import { useStagger } from "./use-boot";

const KEYWORDS = new Set([
  "use", "pub", "fn", "mod", "let", "mut", "super", "impl", "struct",
  "import", "from", "export", "async", "const", "return", "function", "new",
  "typeof", "await", "if",
]);

/** Monochrome highlighting: value, not hue. Keywords carry the emphasis, and
 *  the state hues stay reserved for the lamps that report the run. */
function CodeLine({ line }: { line: string }) {
  const trimmed = line.trim();
  if (trimmed.startsWith("#[") || trimmed.startsWith("//")) {
    return <span className="text-[#4e4e4a]">{line}</span>;
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
          <span key={i} className="text-[#8a8a84]">
            {part}
          </span>
        );
      })}
    </>
  );
}

/**
 * The editor screen: a well cut into the chassis, milled open on boot and
 * darker than the panels around it because it emits.
 */
export function Editor({
  source,
  added = [],
  open,
  settled,
  nameplate,
}: {
  source: string[];
  /** Indices rendered as additions once an agent edits the file. */
  added?: number[];
  /** The well has been milled open. Content inside it never scales. */
  open: boolean;
  /** The cut has finished, so the clip comes off. */
  settled: boolean;
  /** The legend plate, shown while the file is empty. */
  nameplate?: React.ReactNode;
}) {
  const addedSet = new Set(added);
  const written = useStagger(source.length, 61, 900);
  const isWriting = written > 0 && written < source.length;

  return (
    <div className="min-h-0 flex-1 px-4 pt-3.5 pb-3.5">
      <div
        className="brik-well-screen brik-scan brik-cut h-full"
        data-open={open}
        data-settled={settled}
      >
        <div className="literal absolute inset-0 overflow-auto">
          <pre className="min-w-max px-6 py-[22px] font-mono text-[12.5px] leading-[2.05]">
            {source.slice(0, written).map((line, i) => (
              <div
                key={i}
                className="flex gap-5"
                style={
                  addedSet.has(i) ? { background: "var(--brik-ok-tint)" } : undefined
                }
              >
                <span className="w-[22px] shrink-0 select-none text-right text-[#3e3e3b]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <CodeLine line={line} />
                </span>
              </div>
            ))}
            {isWriting && (
              <div className="flex gap-5" aria-hidden>
                <span className="w-[22px] shrink-0" />
                <span className="brik-caret" />
              </div>
            )}
          </pre>
        </div>
        {nameplate}
      </div>
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

type Row = { key: string; label: string; depth: number; path?: string };

/** Group by directory, root files first. A real project has two Cargo.toml
 *  files, so a flat list of basenames would be ambiguous. */
function toRows(files: string[]): Row[] {
  const groups = new Map<string, string[]>();
  for (const path of files) {
    const directory = directoryOf(path);
    const group = groups.get(directory);
    if (group) group.push(path);
    else groups.set(directory, [path]);
  }
  const rows: Row[] = [];
  for (const [directory, paths] of [...groups].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (directory) {
      rows.push({ key: `dir:${directory}`, label: `${directory}/`, depth: 0 });
    }
    for (const path of paths) {
      rows.push({
        key: path,
        label: fileName(path),
        depth: directory ? 1 : 0,
        path,
      });
    }
  }
  return rows;
}

/**
 * The file rail: an etched marking on the chassis over a well the tree fills
 * one row at a time.
 */
export function Files({
  files,
  entryFile,
  changed = [],
  open,
  settled,
  labelled,
}: {
  files: string[];
  entryFile?: string;
  /** Paths an agent has modified since the workspace started. */
  changed?: string[];
  open: boolean;
  settled: boolean;
  labelled: boolean;
}) {
  const rows = toRows(files);
  const filled = useStagger(rows.length, 65, 900);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col p-3.5 pt-4">
      <div className="mb-3.5 flex items-center justify-between px-1">
        <Etch on={labelled}>FILES</Etch>
        <Etch on={labelled} className="brik-etch-dim brik-figures tracking-normal">
          {files.length > 0 ? files.length : "--"}
        </Etch>
      </div>
      <div
        className="brik-well brik-cut min-h-0 flex-1 overflow-auto px-2 py-2.5 font-mono text-[11.5px]"
        data-open={open}
        data-settled={settled}
      >
        <div className="flex flex-col gap-0.5">
          {rows.slice(0, filled).map((row) => {
            const isEntry = row.path !== undefined && row.path === entryFile;
            return (
              <div
                key={row.key}
                title={row.path ?? row.label}
                className={`flex items-center justify-between gap-2 truncate rounded-[5px] py-[5px] pr-2 ${
                  isEntry ? "text-fg" : "text-[#6f6f6b]"
                }`}
                style={{
                  paddingLeft: 8 + row.depth * 12,
                  background: isEntry ? "linear-gradient(#1B1B1B,#161616)" : undefined,
                  boxShadow: isEntry
                    ? "inset 0 1px 0 rgba(255,255,255,.06), 0 1px 0 rgba(0,0,0,.6)"
                    : undefined,
                }}
              >
                <span className="truncate">{row.label}</span>
                {row.path !== undefined && changed.includes(row.path) && (
                  <span className="text-[var(--brik-lamp-busy)]">M</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
