import type { Template } from "./types";

/**
 * Tip jar. The program and the suite below are written into the workspace
 * verbatim, and are the exact source the container builds, tests, and deploys.
 * Both are generated from a copy that was compiled and run in the toolchain
 * image, so neither is hand-transcribed.
 */
export const TIP_JAR: Template = {
  slug: "tip-jar",
  name: "Tip jar",
  tagline: "Accept SOL tips, with the running total and the tip count on chain.",
  stack: "ANCHOR · SYSTEM PROGRAM",
  task: "Build a tip jar with a send_tip instruction",

  program: `use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("eJvmgeW5TbyYZ1SU3WYCKyCz11FQa9U29gj8EcZZ96V");

#[program]
pub mod project {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let jar = &mut ctx.accounts.jar;
        jar.owner = ctx.accounts.owner.key();
        jar.total = 0;
        jar.count = 0;
        jar.bump = ctx.bumps.jar;
        Ok(())
    }

    pub fn send_tip(ctx: Context<SendTip>, amount: u64) -> Result<()> {
        require!(amount > 0, TipJarError::AmountZero);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.tipper.to_account_info(),
                    to: ctx.accounts.jar.to_account_info(),
                },
            ),
            amount,
        )?;

        let jar = &mut ctx.accounts.jar;
        jar.total = jar.total.checked_add(amount).ok_or(TipJarError::Overflow)?;
        jar.count = jar.count.checked_add(1).ok_or(TipJarError::Overflow)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let rent = Rent::get()?.minimum_balance(8 + TipJar::INIT_SPACE);
        let jar = ctx.accounts.jar.to_account_info();
        let available = jar.lamports().saturating_sub(rent);
        require!(available > 0, TipJarError::NothingToWithdraw);

        **jar.try_borrow_mut_lamports()? -= available;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += available;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct TipJar {
    pub owner: Pubkey,
    pub total: u64,
    pub count: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + TipJar::INIT_SPACE,
        seeds = [b"jar", owner.key().as_ref()],
        bump
    )]
    pub jar: Account<'info, TipJar>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendTip<'info> {
    #[account(mut, seeds = [b"jar", jar.owner.as_ref()], bump = jar.bump)]
    pub jar: Account<'info, TipJar>,
    #[account(mut)]
    pub tipper: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = [b"jar", owner.key().as_ref()], bump = jar.bump, has_one = owner)]
    pub jar: Account<'info, TipJar>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[error_code]
pub enum TipJarError {
    #[msg("Tip amount must be greater than zero")]
    AmountZero,
    #[msg("Tip jar balance overflowed")]
    Overflow,
    #[msg("Nothing above rent to withdraw")]
    NothingToWithdraw,
}
`,

  test: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { Project } from "../target/types/project";

describe("tip jar", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.project as Program<Project>;
  const connection = provider.connection;

  // A fresh owner each run. The jar's address is derived from it, so a suite
  // that used the provider's own wallet could only be run once against a given
  // validator: the second run finds the account already in use.
  const owner = anchor.web3.Keypair.generate();

  const [jar] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("jar"), owner.publicKey.toBuffer()],
    program.programId,
  );

  before(async () => {
    const airdrop = await connection.requestAirdrop(
      owner.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(airdrop, "confirmed");
  });

  it("opens a jar with an empty total", async () => {
    await program.methods
      .initialize()
      .accountsPartial({ jar, owner: owner.publicKey })
      .signers([owner])
      .rpc();

    const account = await program.account.tipJar.fetch(jar);
    assert.equal(account.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(account.total.toNumber(), 0);
    assert.equal(account.count.toNumber(), 0);
  });

  it("records a tip and moves the lamports", async () => {
    const amount = 2 * anchor.web3.LAMPORTS_PER_SOL;
    const before = await connection.getBalance(jar);

    await program.methods
      .sendTip(new anchor.BN(amount))
      .accountsPartial({ jar, tipper: provider.wallet.publicKey })
      .rpc();

    const account = await program.account.tipJar.fetch(jar);
    assert.equal(account.total.toNumber(), amount);
    assert.equal(account.count.toNumber(), 1);
    assert.equal(await connection.getBalance(jar), before + amount);
  });

  it("rejects a zero tip", async () => {
    try {
      await program.methods
        .sendTip(new anchor.BN(0))
        .accountsPartial({ jar, tipper: provider.wallet.publicKey })
        .rpc();
      assert.fail("a zero tip should not be accepted");
    } catch (err) {
      assert.include((err as Error).toString(), "AmountZero");
    }
  });

  it("withdraws everything above rent to the owner", async () => {
    await program.methods
      .withdraw()
      .accountsPartial({ jar, owner: owner.publicKey })
      .signers([owner])
      .rpc();

    const rent = await connection.getMinimumBalanceForRentExemption(
      8 + 32 + 8 + 8 + 1,
    );
    assert.equal(await connection.getBalance(jar), rent);
  });
});
`,
};
