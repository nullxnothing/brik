import { applyEdits, type Template } from "./types";

const BASE = [
  'import { NextResponse } from "next/server";',
  'import { getTokenBalance } from "@/lib/helius";',
  "",
  'const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";',
  "const MIN_BALANCE = 100;",
  "",
  "export async function POST(request: Request) {",
  "  const { owner } = await request.json();",
  "",
  '  if (typeof owner !== "string" || owner.length < 32) {',
  '    return NextResponse.json({ error: "Invalid owner" }, { status: 400 });',
  "  }",
  "",
  "  const balance = await getTokenBalance(owner, MINT);",
  "",
  "  return NextResponse.json({",
  "    unlocked: balance >= MIN_BALANCE,",
  "    balance,",
  "  });",
  "}",
];

const CACHED = applyEdits(BASE, [
  {
    at: 5,
    lines: ["// Balances are re-read at most once a minute per wallet.", "const TTL_MS = 60_000;", ""],
  },
  {
    at: 13,
    lines: [
      "  const cached = readCache(owner);",
      "  if (cached && Date.now() - cached.at < TTL_MS) {",
      "    return NextResponse.json(cached.body);",
      "  }",
      "",
    ],
  },
]);

export const TOKEN_GATE: Template = {
  slug: "token-gate",
  name: "Token-gated site",
  tagline: "Content that unlocks when the visitor holds your token.",
  stack: "NEXT.JS · DAS",
  task: "Build a site gated by an SPL token balance",
  project: "token-gate",
  entryFile: "app/api/verify/route.ts",
  files: [
    "app/api/verify/route.ts",
    "app/page.tsx",
    "app/gate.tsx",
    "lib/helius.ts",
    "tests/verify.test.ts",
    "package.json",
  ],
  unit: "balance verification route",
  tests: [
    "unlocks for a wallet above the threshold (301ms)",
    "stays locked below the threshold (188ms)",
    "rejects a malformed public key (96ms)",
  ],
  source: BASE,
  followUp: {
    chip: "Cache each balance for 60 seconds",
    unit: "balance cache",
    test: "serves the second request from cache (74ms)",
    source: CACHED.source,
    added: CACHED.added,
  },
};
