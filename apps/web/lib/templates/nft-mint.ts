import { applyEdits, type Template } from "./types";

const BASE = [
  "use anchor_lang::prelude::*;",
  "use anchor_spl::token::{self, MintTo, Token};",
  "",
  'declare_id!("4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gpsUa");',
  "",
  "#[program]",
  "pub mod nft_mint {",
  "    use super::*;",
  "",
  "    pub fn mint_one(ctx: Context<MintOne>) -> Result<()> {",
  "        let config = &mut ctx.accounts.config;",
  "        require!(config.minted < config.supply, MintError::SoldOut);",
  "",
  "        token::mint_to(",
  "            CpiContext::new_with_signer(",
  "                ctx.accounts.token_program.to_account_info(),",
  "                MintTo {",
  "                    mint: ctx.accounts.mint.to_account_info(),",
  "                    to: ctx.accounts.buyer_ata.to_account_info(),",
  "                    authority: ctx.accounts.config.to_account_info(),",
  "                },",
  '                &[&[b"config", &[ctx.bumps.config]]],',
  "            ),",
  "            1,",
  "        )?;",
  "",
  "        config.minted += 1;",
  "        Ok(())",
  "    }",
  "}",
];

const WALLET_LIMIT = applyEdits(BASE, [
  {
    at: 5,
    lines: ["/// Mints allowed per wallet.", "const PER_WALLET: u8 = 3;", ""],
  },
  {
    at: 12,
    lines: [
      "        let receipt = &mut ctx.accounts.receipt;",
      "        require!(receipt.count < PER_WALLET, MintError::WalletLimit);",
    ],
  },
  {
    at: 26,
    lines: ["        receipt.count += 1;"],
  },
]);

export const NFT_MINT: Template = {
  slug: "nft-mint",
  name: "NFT mint page",
  tagline: "A one-page mint for your collection, wallet connect included.",
  stack: "ANCHOR · METAPLEX",
  task: "Build an NFT mint page for a 1,000 piece collection",
  project: "nft-mint",
  entryFile: "programs/nft-mint/src/lib.rs",
  files: [
    "programs/nft-mint/src/lib.rs",
    "programs/nft-mint/Cargo.toml",
    "app/page.tsx",
    "app/mint-button.tsx",
    "tests/nft-mint.ts",
    "Anchor.toml",
  ],
  unit: "mint_one instruction",
  tests: [
    "mints one edition to the buyer (688ms)",
    "increments the minted counter (274ms)",
    "rejects a mint past the supply cap (233ms)",
  ],
  source: BASE,
  followUp: {
    chip: "Limit each wallet to 3 mints",
    unit: "per wallet limit",
    test: "rejects a fourth mint from the same wallet (317ms)",
    source: WALLET_LIMIT.source,
    added: WALLET_LIMIT.added,
  },
};
