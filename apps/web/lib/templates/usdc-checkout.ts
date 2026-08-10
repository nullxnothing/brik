import { applyEdits, type Template } from "./types";

const BASE = [
  'import { createTransferCheckedInstruction } from "@solana/spl-token";',
  'import { PublicKey, Transaction } from "@solana/web3.js";',
  "",
  'const USDC = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");',
  "const DECIMALS = 6;",
  "",
  "export function buildPayment(",
  "  from: PublicKey,",
  "  to: PublicKey,",
  "  amountUsdc: number,",
  "): Transaction {",
  "  const amount = BigInt(Math.round(amountUsdc * 10 ** DECIMALS));",
  "",
  "  return new Transaction().add(",
  "    createTransferCheckedInstruction(",
  "      from,",
  "      USDC,",
  "      to,",
  "      from,",
  "      amount,",
  "      DECIMALS,",
  "    ),",
  "  );",
  "}",
];

const WITH_FEE = applyEdits(BASE, [
  {
    at: 5,
    lines: [
      'const PLATFORM = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");',
      "const FEE_BPS = 100n;",
      "",
    ],
  },
  {
    at: 12,
    lines: ["  const fee = (amount * FEE_BPS) / 10_000n;"],
  },
  {
    at: 19,
    remove: 1,
    lines: ["      amount - fee,"],
  },
  {
    at: 22,
    lines: [
      "  ).add(",
      "    createTransferCheckedInstruction(",
      "      from,",
      "      USDC,",
      "      PLATFORM,",
      "      from,",
      "      fee,",
      "      DECIMALS,",
      "    ),",
    ],
  },
]);

export const USDC_CHECKOUT: Template = {
  slug: "usdc-checkout",
  name: "USDC checkout",
  tagline: "Take USDC payments with confirmations you can verify.",
  stack: "NEXT.JS · SPL",
  task: "Build a USDC checkout with payment confirmation",
  project: "usdc-checkout",
  entryFile: "lib/checkout.ts",
  files: [
    "lib/checkout.ts",
    "app/page.tsx",
    "app/pay-button.tsx",
    "app/api/confirm/route.ts",
    "tests/checkout.test.ts",
    "package.json",
  ],
  unit: "transfer builder",
  tests: [
    "builds a transfer for the exact amount (255ms)",
    "creates the recipient token account when missing (410ms)",
    "confirms the signature before returning (302ms)",
  ],
  source: BASE,
  followUp: {
    chip: "Take a 1% platform fee",
    unit: "fee split",
    test: "splits the fee from the merchant amount (241ms)",
    source: WITH_FEE.source,
    added: WITH_FEE.added,
  },
};
