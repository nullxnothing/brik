import { applyEdits, type Template } from "./types";

const BASE = [
  "use anchor_lang::prelude::*;",
  "use anchor_lang::system_program;",
  "",
  'declare_id!("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");',
  "",
  "#[program]",
  "pub mod tip_jar {",
  "    use super::*;",
  "",
  "    pub fn send_tip(ctx: Context<SendTip>, amount: u64) -> Result<()> {",
  "        require!(amount > 0, TipError::ZeroAmount);",
  "",
  "        system_program::transfer(",
  "            CpiContext::new(",
  "                ctx.accounts.system_program.to_account_info(),",
  "                system_program::Transfer {",
  "                    from: ctx.accounts.sender.to_account_info(),",
  "                    to: ctx.accounts.jar.to_account_info(),",
  "                },",
  "            ),",
  "            amount,",
  "        )?;",
  "",
  "        let jar = &mut ctx.accounts.jar;",
  "        jar.total = jar.total.checked_add(amount).ok_or(TipError::Overflow)?;",
  "        Ok(())",
  "    }",
  "}",
];

const MINIMUM = applyEdits(BASE, [
  {
    at: 5,
    lines: ["/// 0.01 SOL, in lamports.", "const MIN_TIP: u64 = 10_000_000;", ""],
  },
  {
    at: 10,
    remove: 1,
    lines: ["        require!(amount >= MIN_TIP, TipError::BelowMinimum);"],
  },
]);

export const TIP_JAR: Template = {
  slug: "tip-jar",
  name: "Tip jar",
  tagline: "Accept SOL tips with an on-chain total and a public page.",
  stack: "ANCHOR · NEXT.JS",
  task: "Build a tip jar with a send_tip instruction",
  project: "tip-jar",
  entryFile: "programs/tip-jar/src/lib.rs",
  files: [
    "programs/tip-jar/src/lib.rs",
    "programs/tip-jar/Cargo.toml",
    "app/page.tsx",
    "app/wallet.tsx",
    "tests/tip-jar.ts",
    "Anchor.toml",
  ],
  unit: "send_tip instruction",
  tests: [
    "initializes the jar (412ms)",
    "accepts a tip and increments the total (388ms)",
    "rejects a zero amount (204ms)",
  ],
  source: BASE,
  followUp: {
    chip: "Set a minimum tip of 0.01 SOL",
    unit: "minimum tip check",
    test: "rejects a tip below the minimum (196ms)",
    source: MINIMUM.source,
    added: MINIMUM.added,
  },
};
