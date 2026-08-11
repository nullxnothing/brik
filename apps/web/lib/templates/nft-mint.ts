import type { Template } from "./types";

/**
 * NFT mint. The program and the suite below are written into the workspace
 * verbatim, and are the exact source the container builds, tests, and deploys.
 * Both are generated from a copy that was compiled and run in the toolchain
 * image, so neither is hand-transcribed.
 */
export const NFT_MINT: Template = {
  slug: "nft-mint",
  name: "NFT mint",
  tagline: "Mint from a capped collection, with Metaplex metadata and a master edition.",
  stack: "ANCHOR · METAPLEX",
  task: "Build an NFT mint for a 1,000 piece collection",

  program: `use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3,
        mpl_token_metadata::types::{Creator, DataV2},
        CreateMasterEditionV3, CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

declare_id!("eJvmgeW5TbyYZ1SU3WYCKyCz11FQa9U29gj8EcZZ96V");

#[program]
pub mod project {
    use super::*;

    /// Open a collection. The collection PDA is the mint authority for every
    /// NFT in it, so the program controls supply rather than a wallet.
    pub fn create_collection(
        ctx: Context<CreateCollection>,
        name: String,
        symbol: String,
        uri: String,
        max_supply: u64,
        price_lamports: u64,
    ) -> Result<()> {
        require!(max_supply > 0, MintError::SupplyZero);
        require!(name.len() <= Collection::NAME_LEN, MintError::TextTooLong);
        require!(symbol.len() <= Collection::SYMBOL_LEN, MintError::TextTooLong);
        require!(uri.len() <= Collection::URI_LEN, MintError::TextTooLong);

        let collection = &mut ctx.accounts.collection;
        collection.authority = ctx.accounts.authority.key();
        collection.name = name;
        collection.symbol = symbol;
        collection.uri = uri;
        collection.max_supply = max_supply;
        collection.minted = 0;
        collection.price_lamports = price_lamports;
        collection.bump = ctx.bumps.collection;
        Ok(())
    }

    /// Mint one NFT: a fresh mint with supply 1, its metadata, and a master
    /// edition so it is a real non-fungible token rather than a 1-supply SPL.
    pub fn mint_one(ctx: Context<MintOne>) -> Result<()> {
        let collection = &ctx.accounts.collection;
        require!(collection.minted < collection.max_supply, MintError::SoldOut);

        let authority = collection.authority;
        let edition = collection.minted + 1;
        let data = DataV2 {
            name: format!("{} #{}", collection.name, edition),
            symbol: collection.symbol.clone(),
            uri: collection.uri.clone(),
            seller_fee_basis_points: 500,
            creators: Some(vec![Creator {
                address: authority,
                verified: false,
                share: 100,
            }]),
            collection: None,
            uses: None,
        };

        let bump = collection.bump;
        let seeds: &[&[u8]] = &[b"collection", authority.as_ref(), &[bump]];
        let signer = &[seeds];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.buyer_tokens.to_account_info(),
                    authority: ctx.accounts.collection.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.collection.to_account_info(),
                    update_authority: ctx.accounts.collection.to_account_info(),
                    payer: ctx.accounts.buyer.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            data,
            true,
            true,
            None,
        )?;

        create_master_edition_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMasterEditionV3 {
                    edition: ctx.accounts.master_edition.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    update_authority: ctx.accounts.collection.to_account_info(),
                    mint_authority: ctx.accounts.collection.to_account_info(),
                    payer: ctx.accounts.buyer.to_account_info(),
                    metadata: ctx.accounts.metadata.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer,
            ),
            Some(0),
        )?;

        ctx.accounts.collection.minted = edition;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Collection {
    pub authority: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub uri: String,
    pub max_supply: u64,
    pub minted: u64,
    pub price_lamports: u64,
    pub bump: u8,
}

impl Collection {
    pub const NAME_LEN: usize = 32;
    pub const SYMBOL_LEN: usize = 10;
    pub const URI_LEN: usize = 200;
}

#[derive(Accounts)]
pub struct CreateCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Collection::INIT_SPACE,
        seeds = [b"collection", authority.key().as_ref()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintOne<'info> {
    #[account(
        mut,
        seeds = [b"collection", collection.authority.as_ref()],
        bump = collection.bump
    )]
    pub collection: Account<'info, Collection>,

    #[account(
        init,
        payer = buyer,
        mint::decimals = 0,
        mint::authority = collection,
        mint::freeze_authority = collection,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub buyer_tokens: Account<'info, TokenAccount>,

    /// CHECK: the token metadata program creates and owns this account.
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: the token metadata program creates and owns this account.
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub token_metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum MintError {
    #[msg("Collection supply must be greater than zero")]
    SupplyZero,
    #[msg("Collection metadata field is too long")]
    TextTooLong,
    #[msg("The collection is sold out")]
    SoldOut,
}
`,

  test: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { assert } from "chai";
import { Project } from "../target/types/project";

/** Metaplex Token Metadata. The workspace validator loads it from disk, so this
 *  works with the network switched off. */
const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

describe("nft mint", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.project as Program<Project>;
  const authority = provider.wallet.publicKey;

  const [collection] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("collection"), authority.toBuffer()],
    program.programId,
  );

  function metadataFor(mint: anchor.web3.PublicKey) {
    const seeds = [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()];
    const [metadata] = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      TOKEN_METADATA_PROGRAM_ID,
    );
    const [masterEdition] = anchor.web3.PublicKey.findProgramAddressSync(
      [...seeds, Buffer.from("edition")],
      TOKEN_METADATA_PROGRAM_ID,
    );
    return { metadata, masterEdition };
  }

  it("opens a collection", async () => {
    await program.methods
      .createCollection("Orbital Series", "ORB", "https://example.com/orbital.json", new anchor.BN(1000), new anchor.BN(0))
      .accountsPartial({ collection, authority })
      .rpc();

    const account = await program.account.collection.fetch(collection);
    assert.equal(account.name, "Orbital Series");
    assert.equal(account.maxSupply.toNumber(), 1000);
    assert.equal(account.minted.toNumber(), 0);
  });

  it("mints one NFT with metadata and a master edition", async () => {
    const mint = anchor.web3.Keypair.generate();
    const buyerTokens = getAssociatedTokenAddressSync(mint.publicKey, authority);
    const { metadata, masterEdition } = metadataFor(mint.publicKey);

    await program.methods
      .mintOne()
      .accountsPartial({
        collection,
        mint: mint.publicKey,
        buyerTokens,
        metadata,
        masterEdition,
        buyer: authority,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    assert.equal(Number((await getAccount(provider.connection, buyerTokens)).amount), 1);
    assert.equal((await program.account.collection.fetch(collection)).minted.toNumber(), 1);

    const created = await provider.connection.getAccountInfo(metadata);
    assert.isNotNull(created, "the metadata account should exist");
    assert.equal(created.owner.toBase58(), TOKEN_METADATA_PROGRAM_ID.toBase58());

    const edition = await provider.connection.getAccountInfo(masterEdition);
    assert.isNotNull(edition, "the master edition should exist");
  });
});
`,
};
