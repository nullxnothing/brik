export interface FollowUp {
  /** Suggested change shown under the composer. */
  chip: string;
  /** What the agent says it is writing. */
  unit: string;
  test: string;
  /** The whole file after the change, so the editor never shows a half-edit. */
  source: string[];
  /** Indices in `source` that are new, rendered as additions. */
  added: number[];
}

export interface Template {
  slug: string;
  name: string;
  tagline: string;
  stack: string;
  task: string;
  /** Workspace project folder and header label. */
  project: string;
  entryFile: string;
  files: string[];
  /** The instruction or unit the agent writes, used in its step labels. */
  unit: string;
  tests: string[];
  source: string[];
  followUp: FollowUp;
}

export function isAnchorProject(template: Template): boolean {
  return template.entryFile.startsWith("programs/");
}

export interface Edit {
  /** Index in the base file to splice at. */
  at: number;
  /** Base lines replaced by this edit. */
  remove?: number;
  lines: string[];
}

/**
 * Splice edits into a file and report which resulting lines are new, so the
 * editor can render a diff without anyone hand-counting line numbers.
 */
export function applyEdits(base: string[], edits: Edit[]) {
  const ordered = [...edits].sort((a, b) => a.at - b.at);
  const source: string[] = [];
  const added: number[] = [];
  let cursor = 0;

  for (const edit of ordered) {
    source.push(...base.slice(cursor, edit.at));
    for (const line of edit.lines) {
      added.push(source.length);
      source.push(line);
    }
    cursor = edit.at + (edit.remove ?? 0);
  }
  source.push(...base.slice(cursor));

  return { source, added };
}
