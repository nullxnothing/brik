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

1. **The agent.** The loop exists and is verified; what remains is a key and the
   wiring. `packages/agent` has the bounded tool-calling loop, four sandbox
   tools, risk classification, and the Anthropic provider. `pnpm verify-agent`
   runs it against a real container with a scripted model: 11 checks, including
   that the file the agent wrote is on disk and the compiler accepted it.

   `pnpm verify-agent --live` swaps in a real model: Claude Opus 5 took
   "add a ping instruction and build it", made the edit, compiled it, and
   checked the generated IDL to confirm the instruction was dispatchable rather
   than merely compiling. Seven checks, all passing.

   One thing is left: **wire it to the workspace.** The composer still declines
   every request. The run emits `RunEvent`s and the loop emits `TaskStep`s, so
   this is a mapping between two existing shapes plus a route that takes a
   message.

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
