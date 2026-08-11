import type { Template } from "./types";

/**
 * Token gate. The program and the suite below are written into the workspace
 * verbatim, and are the exact source the container builds, tests, and deploys.
 * Both are generated from a copy that was compiled and run in the toolchain
 * image, so neither is hand-transcribed.
 */
export const TOKEN_GATE: Template = {
  slug: "token-gate",
  name: "Token gate",
  tagline: "Prove an SPL balance on chain and issue a pass a server can read back.",
  stack: "ANCHOR · SPL TOKEN",
  task: "Build a gate that checks an SPL token balance",

  program: `use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

declare_id!("eJvmgeW5TbyYZ1SU3WYCKyCz11FQa9U29gj8EcZZ96V");

#[program]
pub mod project {
    use super::*;

    /// Define the gate: hold at least \`minimum\` of \`mint\` to get in.
    pub fn create_gate(ctx: Context<CreateGate>, minimum: u64) -> Result<()> {
        require!(minimum > 0, GateError::MinimumZero);

        let gate = &mut ctx.accounts.gate;
        gate.authority = ctx.accounts.authority.key();
        gate.mint = ctx.accounts.mint.key();
        gate.minimum = minimum;
        gate.members = 0;
        gate.bump = ctx.bumps.gate;
        Ok(())
    }

    /// Prove the balance on chain and write a pass a server can read back.
    /// The pass records the slot, so a stale proof is detectable.
    pub fn claim_access(ctx: Context<ClaimAccess>) -> Result<()> {
        let minimum = ctx.accounts.gate.minimum;
        let balance = ctx.accounts.holder_tokens.amount;
        require!(balance >= minimum, GateError::BalanceTooLow);

        let gate_key = ctx.accounts.gate.key();
        let holder = ctx.accounts.holder.key();
        let is_new = ctx.accounts.pass.holder == Pubkey::default();

        let pass = &mut ctx.accounts.pass;
        pass.gate = gate_key;
        pass.holder = holder;
        pass.verified_balance = balance;
        pass.verified_slot = Clock::get()?.slot;
        pass.bump = ctx.bumps.pass;

        if is_new {
            let gate = &mut ctx.accounts.gate;
            gate.members = gate.members.saturating_add(1);
        }
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Gate {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub minimum: u64,
    pub members: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AccessPass {
    pub gate: Pubkey,
    pub holder: Pubkey,
    pub verified_balance: u64,
    pub verified_slot: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct CreateGate<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Gate::INIT_SPACE,
        seeds = [b"gate", mint.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub gate: Account<'info, Gate>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: only the address is stored; balances are checked against it later.
    pub mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimAccess<'info> {
    #[account(
        mut,
        seeds = [b"gate", gate.mint.as_ref(), gate.authority.as_ref()],
        bump = gate.bump
    )]
    pub gate: Account<'info, Gate>,
    #[account(
        init_if_needed,
        payer = holder,
        space = 8 + AccessPass::INIT_SPACE,
        seeds = [b"pass", gate.key().as_ref(), holder.key().as_ref()],
        bump
    )]
    pub pass: Account<'info, AccessPass>,
    #[account(mut)]
    pub holder: Signer<'info>,
    #[account(token::mint = gate.mint, token::authority = holder)]
    pub holder_tokens: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum GateError {
    #[msg("Minimum balance must be greater than zero")]
    MinimumZero,
    #[msg("Token balance is below the gate minimum")]
    BalanceTooLow,
}
`,

  test: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { createAssociatedTokenAccount, createMint, mintTo } from "@solana/spl-token";
import { assert } from "chai";
import { Project } from "../target/types/project";

describe("token gate", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.project as Program<Project>;
  const connection = provider.connection;
  const authority = provider.wallet.publicKey;
  const payer = (provider.wallet as anchor.Wallet).payer;
  const holder = anchor.web3.Keypair.generate();
  const outsider = anchor.web3.Keypair.generate();

  const MINIMUM = 100;

  let mint: anchor.web3.PublicKey;
  let gate: anchor.web3.PublicKey;
  let holderTokens: anchor.web3.PublicKey;
  let outsiderTokens: anchor.web3.PublicKey;

  before(async () => {
    for (const wallet of [holder, outsider]) {
      const airdrop = await connection.requestAirdrop(
        wallet.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL,
      );
      await connection.confirmTransaction(airdrop, "confirmed");
    }

    mint = await createMint(connection, payer, authority, null, 0);
    holderTokens = await createAssociatedTokenAccount(connection, payer, mint, holder.publicKey);
    outsiderTokens = await createAssociatedTokenAccount(connection, payer, mint, outsider.publicKey);
    await mintTo(connection, payer, mint, holderTokens, authority, 250);
    await mintTo(connection, payer, mint, outsiderTokens, authority, 5);

    [gate] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("gate"), mint.toBuffer(), authority.toBuffer()],
      program.programId,
    );
  });

  it("defines the gate", async () => {
    await program.methods
      .createGate(new anchor.BN(MINIMUM))
      .accountsPartial({ gate, authority, mint })
      .rpc();

    const account = await program.account.gate.fetch(gate);
    assert.equal(account.minimum.toNumber(), MINIMUM);
    assert.equal(account.members.toNumber(), 0);
  });

  it("issues a pass to a holder above the minimum", async () => {
    const [pass] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pass"), gate.toBuffer(), holder.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .claimAccess()
      .accountsPartial({ gate, pass, holder: holder.publicKey, holderTokens })
      .signers([holder])
      .rpc();

    const issued = await program.account.accessPass.fetch(pass);
    assert.equal(issued.verifiedBalance.toNumber(), 250);
    assert.isAbove(issued.verifiedSlot.toNumber(), 0);
    assert.equal((await program.account.gate.fetch(gate)).members.toNumber(), 1);
  });

  it("turns away a wallet below the minimum", async () => {
    const [pass] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pass"), gate.toBuffer(), outsider.publicKey.toBuffer()],
      program.programId,
    );

    try {
      await program.methods
        .claimAccess()
        .accountsPartial({
          gate,
          pass,
          holder: outsider.publicKey,
          holderTokens: outsiderTokens,
        })
        .signers([outsider])
        .rpc();
      assert.fail("a balance below the minimum should not pass the gate");
    } catch (err) {
      assert.include((err as Error).toString(), "BalanceTooLow");
    }
  });
});
`,
};
