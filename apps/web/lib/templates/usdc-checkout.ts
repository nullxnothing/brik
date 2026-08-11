import type { Template } from "./types";

/**
 * USDC checkout. The program and the suite below are written into the workspace
 * verbatim, and are the exact source the container builds, tests, and deploys.
 * Both are generated from a copy that was compiled and run in the toolchain
 * image, so neither is hand-transcribed.
 */
export const USDC_CHECKOUT: Template = {
  slug: "usdc-checkout",
  name: "USDC checkout",
  tagline: "Take USDC payments where the order account is the receipt.",
  stack: "ANCHOR · SPL TOKEN",
  task: "Build a USDC checkout with payment confirmation",

  program: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("eJvmgeW5TbyYZ1SU3WYCKyCz11FQa9U29gj8EcZZ96V");

#[program]
pub mod project {
    use super::*;

    /// Open an order for a fixed amount of one SPL token, priced by the merchant.
    pub fn create_order(ctx: Context<CreateOrder>, order_id: u64, amount: u64) -> Result<()> {
        require!(amount > 0, CheckoutError::AmountZero);

        let order = &mut ctx.accounts.order;
        order.merchant = ctx.accounts.merchant.key();
        order.mint = ctx.accounts.mint.key();
        order.order_id = order_id;
        order.amount = amount;
        order.paid_by = None;
        order.bump = ctx.bumps.order;
        Ok(())
    }

    /// Pay an open order. The order account is the receipt: it records who paid,
    /// so a server can verify payment by reading one account.
    pub fn pay(ctx: Context<Pay>) -> Result<()> {
        require!(ctx.accounts.order.paid_by.is_none(), CheckoutError::AlreadyPaid);
        let amount = ctx.accounts.order.amount;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_tokens.to_account_info(),
                    to: ctx.accounts.merchant_tokens.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            amount,
        )?;

        ctx.accounts.order.paid_by = Some(ctx.accounts.buyer.key());
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub merchant: Pubkey,
    pub mint: Pubkey,
    pub order_id: u64,
    pub amount: u64,
    pub paid_by: Option<Pubkey>,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateOrder<'info> {
    #[account(
        init,
        payer = merchant,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", merchant.key().as_ref(), &order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub merchant: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Pay<'info> {
    #[account(
        mut,
        seeds = [b"order", order.merchant.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, token::mint = order.mint, token::authority = buyer)]
    pub buyer_tokens: Account<'info, TokenAccount>,
    #[account(mut, token::mint = order.mint, token::authority = order.merchant)]
    pub merchant_tokens: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum CheckoutError {
    #[msg("Order amount must be greater than zero")]
    AmountZero,
    #[msg("This order has already been paid")]
    AlreadyPaid,
}
`,

  test: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { Project } from "../target/types/project";

describe("usdc checkout", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.project as Program<Project>;
  const connection = provider.connection;
  const merchant = provider.wallet.publicKey;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const buyer = anchor.web3.Keypair.generate();

  /** 49 USDC, which has six decimals. */
  const AMOUNT = 49_000_000;

  // A fresh id each run. The order's address is derived from it, so a fixed id
  // could only be used once against a given validator: the second run finds the
  // order already in use. Real orders are unique for the same reason.
  const orderId = new anchor.BN(Date.now());

  let mint: anchor.web3.PublicKey;
  let buyerTokens: anchor.web3.PublicKey;
  let merchantTokens: anchor.web3.PublicKey;
  let order: anchor.web3.PublicKey;

  before(async () => {
    const airdrop = await connection.requestAirdrop(
      buyer.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(airdrop, "confirmed");

    mint = await createMint(connection, payer, merchant, null, 6);
    merchantTokens = await createAssociatedTokenAccount(connection, payer, mint, merchant);
    buyerTokens = await createAssociatedTokenAccount(connection, payer, mint, buyer.publicKey);
    await mintTo(connection, payer, mint, buyerTokens, merchant, AMOUNT * 2);

    [order] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("order"), merchant.toBuffer(), orderId.toArrayLike(Buffer, "le", 8)],
      program.programId,
    );
  });

  it("opens an unpaid order", async () => {
    await program.methods
      .createOrder(orderId, new anchor.BN(AMOUNT))
      .accountsPartial({ order, merchant, mint })
      .rpc();

    const account = await program.account.order.fetch(order);
    assert.equal(account.amount.toNumber(), AMOUNT);
    assert.isNull(account.paidBy);
  });

  it("moves the tokens and records who paid", async () => {
    await program.methods
      .pay()
      .accountsPartial({ order, buyer: buyer.publicKey, buyerTokens, merchantTokens })
      .signers([buyer])
      .rpc();

    const account = await program.account.order.fetch(order);
    assert.equal(account.paidBy.toBase58(), buyer.publicKey.toBase58());
    assert.equal(Number((await getAccount(connection, merchantTokens)).amount), AMOUNT);
    assert.equal(Number((await getAccount(connection, buyerTokens)).amount), AMOUNT);
  });

  it("refuses to charge twice for the same order", async () => {
    try {
      await program.methods
        .pay()
        .accountsPartial({ order, buyer: buyer.publicKey, buyerTokens, merchantTokens })
        .signers([buyer])
        .rpc();
      assert.fail("the second payment should have been rejected");
    } catch (err) {
      assert.include((err as Error).toString(), "AlreadyPaid");
    }
  });
});
`,
};
