import { isAnchorProject, type Template } from "../../lib/templates";
import type { Status } from "../../components/ui";

export interface TerminalLine {
  text: string;
  tone?: "cmd" | "ok" | "err" | "muted";
}

/** Agent stream item. `task` is the objective, `note` is the workspace talking. */
export type Entry =
  | { kind: "task"; text: string }
  | { kind: "step"; text: string }
  | { kind: "note"; text: string };

export interface Frame {
  /** Milliseconds after the previous frame. */
  delay: number;
  status?: Status;
  /** Appends an agent step; earlier steps are marked complete. */
  agent?: string;
  term?: TerminalLine[];
  /** Number of source lines revealed in the editor. */
  code?: number;
  /** Replaces the file being edited, for a follow-up change. */
  source?: string[];
  added?: number[];
  file?: string;
  program?: string;
  tx?: string;
  balance?: number;
  /** Clears the terminal before appending, as a fresh command run does. */
  clearTerm?: boolean;
}

export const PROGRAM_ID = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
export const TX_SIGNATURE =
  "5jTb9wKq3Rn7vY2mAe4XcHs1pLdF8gUzNc6QrWvBhTyKmE3sPnJdVxRoZaCuMi9L";

const NOT_CONNECTED =
  "The sandbox is not connected in this preview, so the agent cannot run your own request yet.";

export function notConnectedNote(hasSuggestion: boolean): string {
  return hasSuggestion
    ? `${NOT_CONNECTED} Try the suggested change to watch the full loop.`
    : NOT_CONNECTED;
}

interface Commands {
  build: string;
  test: string;
  deploy: string;
  buildOk: string;
}

function commandsFor(template: Template): Commands {
  const anchor = isAnchorProject(template);
  return {
    build: anchor ? "anchor build" : "pnpm build",
    test: anchor ? "anchor test" : "pnpm test",
    deploy: anchor
      ? "anchor deploy --provider.cluster devnet"
      : `brik deploy --cluster devnet`,
    buildOk: anchor
      ? "Finished release [optimized] in 14.2s"
      : "Compiled successfully in 8.4s",
  };
}

function deployFrame(template: Template): Frame {
  const anchor = isAnchorProject(template);
  return {
    delay: 1800,
    status: "deployed",
    term: anchor
      ? [
          { text: `Program Id: ${PROGRAM_ID}`, tone: "muted" },
          { text: "Deploy success", tone: "ok" },
        ]
      : [
          { text: `Preview: https://${template.project}.brik.app`, tone: "muted" },
          { text: "Deploy success", tone: "ok" },
        ],
    program: anchor ? PROGRAM_ID : undefined,
    tx: TX_SIGNATURE,
    balance: anchor ? 1.83 : 2.41,
  };
}

/** The first run: write the project, fail once, fix, test, deploy. */
export function buildFrames(template: Template): Frame[] {
  const source = template.source;
  const cmd = commandsFor(template);

  return [
    { delay: 300, agent: "Read the project and plan the change", status: "ready" },
    {
      delay: 1100,
      agent: `Write the ${template.unit}`,
      file: template.entryFile,
      code: Math.ceil(source.length * 0.4),
    },
    { delay: 700, code: Math.ceil(source.length * 0.75) },
    { delay: 600, code: source.length },
    {
      delay: 700,
      agent: "Build the project",
      status: "building",
      term: [{ text: `$ ${cmd.build}`, tone: "cmd" }],
    },
    {
      delay: 1400,
      status: "failed",
      term: [
        { text: "error: type mismatch", tone: "err" },
        {
          text: `  --> ${template.entryFile}:${Math.min(source.length, 14)}`,
          tone: "muted",
        },
        { text: "  expected u64, found u32", tone: "muted" },
      ],
    },
    {
      delay: 1100,
      agent: "Read the compiler output and correct the type",
      status: "building",
      term: [{ text: `$ ${cmd.build}`, tone: "cmd" }],
    },
    { delay: 1500, term: [{ text: cmd.buildOk, tone: "ok" }] },
    {
      delay: 600,
      agent: "Run the test suite",
      status: "testing",
      term: [{ text: `$ ${cmd.test}`, tone: "cmd" }],
    },
    {
      delay: 1500,
      term: [
        { text: `  ${template.project}`, tone: "muted" },
        ...template.tests.map((name) => ({
          text: `    ✓ ${name}`,
          tone: "ok" as const,
        })),
        { text: `  ${template.tests.length} passing (2.4s)`, tone: "ok" },
      ],
    },
    {
      delay: 700,
      agent: "Deploy to devnet",
      term: [{ text: `$ ${cmd.deploy}`, tone: "cmd" }],
    },
    deployFrame(template),
  ];
}

/** The suggested change: edit, rebuild, retest, redeploy. No manufactured failure. */
export function buildFollowUpFrames(template: Template): Frame[] {
  const { followUp } = template;
  const cmd = commandsFor(template);
  const tests = [...template.tests, followUp.test];

  return [
    { delay: 300, agent: "Locate the code to change", status: "ready" },
    {
      delay: 900,
      agent: `Write the ${followUp.unit}`,
      source: followUp.source,
      added: followUp.added,
      code: followUp.source.length,
      file: template.entryFile,
    },
    {
      delay: 800,
      agent: "Build the project",
      status: "building",
      clearTerm: true,
      term: [{ text: `$ ${cmd.build}`, tone: "cmd" }],
    },
    { delay: 1500, term: [{ text: cmd.buildOk, tone: "ok" }] },
    {
      delay: 600,
      agent: "Run the test suite",
      status: "testing",
      term: [{ text: `$ ${cmd.test}`, tone: "cmd" }],
    },
    {
      delay: 1500,
      term: [
        { text: `  ${template.project}`, tone: "muted" },
        ...tests.map((name) => ({ text: `    ✓ ${name}`, tone: "ok" as const })),
        { text: `  ${tests.length} passing (2.7s)`, tone: "ok" },
      ],
    },
    {
      delay: 700,
      agent: "Deploy to devnet",
      term: [{ text: `$ ${cmd.deploy}`, tone: "cmd" }],
    },
    deployFrame(template),
  ];
}
