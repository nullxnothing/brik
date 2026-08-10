import type { Template } from "../../lib/templates";
import type { Status } from "../../components/ui";

export interface TerminalLine {
  text: string;
  tone?: "cmd" | "ok" | "err" | "muted";
}

export interface Frame {
  /** Milliseconds after the previous frame. */
  delay: number;
  status?: Status;
  /** Appends an agent step; earlier steps are marked complete. */
  agent?: string;
  term?: TerminalLine[];
  /** Number of source lines revealed in the editor. */
  code?: number;
  file?: string;
  program?: string;
  tx?: string;
  balance?: number;
}

export const PROGRAM_ID = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
export const TX_SIGNATURE =
  "5jTb9wKq3Rn7vY2mAe4XcHs1pLdF8gUzNc6QrWvBhTyKmE3sPnJdVxRoZaCuMi9L";

const IS_ANCHOR = (t: Template) => t.entryFile.startsWith("programs/");

export function buildFrames(t: Template): Frame[] {
  const source = t.source;
  const anchor = IS_ANCHOR(t);
  const buildCmd = anchor ? "anchor build" : "pnpm build";
  const testCmd = anchor ? "anchor test" : "pnpm test";
  const buildOk = anchor
    ? "Finished release [optimized] in 14.2s"
    : "Compiled successfully in 8.4s";
  const deployCmd = anchor
    ? "anchor deploy --provider.cluster devnet"
    : "brik deploy --cluster devnet";

  return [
    { delay: 300, agent: "Read the project and plan the change", status: "ready" },
    {
      delay: 1100,
      agent: `Write the ${t.unit}`,
      file: t.entryFile,
      code: Math.ceil(source.length * 0.4),
    },
    { delay: 700, code: Math.ceil(source.length * 0.75) },
    { delay: 600, code: source.length },
    {
      delay: 700,
      agent: "Build the project",
      status: "building",
      term: [{ text: `$ ${buildCmd}`, tone: "cmd" }],
    },
    {
      delay: 1400,
      status: "failed",
      term: [
        { text: "error: type mismatch", tone: "err" },
        { text: `  --> ${t.entryFile}:${Math.min(source.length, 14)}`, tone: "muted" },
        { text: "  expected u64, found u32", tone: "muted" },
      ],
    },
    {
      delay: 1100,
      agent: "Read the compiler output and correct the type",
      status: "building",
      term: [{ text: `$ ${buildCmd}`, tone: "cmd" }],
    },
    { delay: 1500, term: [{ text: buildOk, tone: "ok" }] },
    {
      delay: 600,
      agent: "Run the test suite",
      status: "testing",
      term: [{ text: `$ ${testCmd}`, tone: "cmd" }],
    },
    {
      delay: 1500,
      term: [
        { text: `  ${t.project}`, tone: "muted" },
        ...t.tests.map((name) => ({ text: `    ✓ ${name}`, tone: "ok" as const })),
        { text: `  ${t.tests.length} passing (2.4s)`, tone: "ok" },
      ],
    },
    {
      delay: 700,
      agent: "Deploy to devnet",
      term: [{ text: `$ ${deployCmd}`, tone: "cmd" }],
    },
    {
      delay: 1800,
      status: "deployed",
      term: anchor
        ? [
            { text: `Program Id: ${PROGRAM_ID}`, tone: "muted" },
            { text: "Deploy success", tone: "ok" },
          ]
        : [
            { text: `Preview: https://${t.project}.brik.app`, tone: "muted" },
            { text: "Deploy success", tone: "ok" },
          ],
      program: anchor ? PROGRAM_ID : undefined,
      tx: TX_SIGNATURE,
      balance: anchor ? 1.83 : 2.41,
    },
  ];
}
