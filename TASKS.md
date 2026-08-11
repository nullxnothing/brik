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

1. **A managed sandbox provider.** The blocker for anything being live: the
   control plane shells out to the docker CLI and Vercel has no Docker daemon.
   Research points at E2B, whose Firecracker guest kernel is built with
   `CONFIG_IO_URING=y`, with Fly Machines as runner-up; Railway is out because
   its seccomp blocks io_uring. E2B's free tier is enough to settle it, but only
   with a smaller image than the 10.1GB one shipped today.

   Two decisions ride along with it, both with evidence already gathered and
   neither taken:
   - **Shrink the image further.** Done so far: 7.65GB to 6.11GB extracted,
     which already clears E2B's free 10GB ceiling. What is left is the risky
     tier, roughly 600MB of Agave perf-libs, ledger-tool, and unused
     platform-tools triples, plus about 690MB of rustup docs on the stable
     toolchain that only a minimal profile or a flatten stage can reach. Neither
     is needed to answer the provider question, so both can wait until there is
     a reason.
   - **Swap the validator to Agave 3.0.14** to drop `seccomp=unconfined`
     (STATE.md, verified). Only needed if the provider is container-based, and
     it costs feature-set fidelity against devnet.
2. **A lease store.** Forced by (1): leases live in one Node process today, and
   serverless gives every request a different one.
3. **The agent.** `packages/agent` is types and a comment. This is what makes
   the composer answer honestly instead of declining, and what brings back the
   suggested-change chip.
4. **Devnet deploy, preview URLs, fork.** The growth loop, and what the Preview
   pane is waiting on. Needs a funded treasury; ~1.27 SOL of rent per deploy.
5. **Auth, persistence, and abuse controls.** Per docs/02 the rate limits ship
   in the same release as the anonymous flow, not after.

## Not started

Billing, GitHub import (the `/new` field accepts a repo URL and the workspace
ignores it), GitHub push, collaboration, mainnet anything.
