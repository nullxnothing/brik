# TASKS

## Done

- **Toolchain image** — `brik/solana-toolchain:dev`, pinned and pre-warmed, now
  carrying the union of template dependencies so a workspace with egress off can
  still build and test what it is given.
- **Local validator per workspace** — `brik-localnet`, boots in ~2s, funds 1000
  SOL, works with egress off. No faucet anywhere in the flow.
- **Provider bake-off harness** — `pnpm bakeoff`, Docker baseline measured.
- **Landing page** — live, app-entry CTAs gated as "Coming soon".
- **Real workspace run** — browser to a real `anchor build` and `anchor deploy`
  in a container that did not exist before the request, streamed live. Failure
  and cleanup paths verified (see STATE.md).
- **Real templates** — four Anchor programs with test suites, written into the
  workspace and proven by `pnpm verify-templates`: 12 tests passing across four
  templates, each built, deployed, and tested in 12 to 14 seconds.

## Next, in dependency order

1. **The agent.** `packages/agent` is types and a comment. It is now the largest
   thing between BRIK and its own MVP definition: the workspace runs a template
   the visitor picked, but cannot act on what they asked for. This is what makes
   the composer answer instead of declining, and what brings back the
   suggested-change chip. Needs an LLM API key.

2. **A lease store.** Leases live in one Node process, so a restart forgets them
   and a serverless deployment gives every request a different one. Forced as
   soon as the control plane runs anywhere other than one long-lived process.

3. **Devnet deploy, preview URLs, fork.** The growth loop, and what the Preview
   pane is waiting on. Needs a funded treasury; ~1.27 SOL of rent per deploy.

4. **Auth, persistence, and abuse controls.** Per docs/02 the rate limits ship
   in the same release as the anonymous flow, not after. The concurrency cap is
   a host limit, not a per-visitor quota.

## Worth doing, not blocking

Three, each with the evidence already gathered and none taken:

- **Shrink the image further.** 7.65GB to 6.11GB extracted so far, which already
  clears E2B's free 10GB ceiling. What is left is the risky tier: roughly 600MB
  of Agave perf-libs, ledger-tool, and unused platform-tools triples, plus about
  690MB of rustup docs that only a minimal profile or a flatten stage reaches.
- **Close the first-build gap on E2B.** 13.2s after a template overlay against
  2.2s on Docker, because a snapshot hydrates its filesystem lazily and the
  825MB target directory is read cold. Worth attention only if activation time
  becomes the constraint, which at 40s per run it is not.
- **Swap the validator to Agave 3.0.14** to drop `seccomp=unconfined`
  (STATE.md, verified). Demoted to insurance: E2B runs the 3.1.9 validator
  unmodified, so this only matters if a container-based provider returns, and it
  costs feature-set fidelity against devnet.

## Not started

Billing, GitHub import (the `/new` field accepts a repo URL and the workspace
ignores it), GitHub push, collaboration, mainnet anything.
