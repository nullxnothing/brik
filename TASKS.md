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

1. **Put the toolchain image on E2B, then point the control plane at it.**
   The provider is decided and `E2BProvider` is verified (STATE.md). Two things
   remain before `/workspace` can run anywhere but a developer's own Docker:

   - **Publish the image as an E2B template.** Nothing else can happen first: a
     sandbox can only start from a template that exists on their side. Watch the
     documented one-hour build cap, and redirect `TMPDIR` to `/var/tmp`, since
     `/tmp` is RAM-backed at about 3.9GB and the build writes more than that.
   - **Choose the provider by config** rather than importing `DockerProvider`
     into the registry. Docker stays the local default; E2B takes over when
     `E2B_API_KEY` and a template are set.

   Then `pnpm bakeoff` gives the numbers that matter, which the base template
   cannot: warm `anchor build` on a snapshot-restored sandbox, and whether the
   pre-built cargo fingerprints survive a snapshot at all.

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
     (STATE.md, verified). Now demoted to insurance: E2B runs the 3.1.9
     validator unmodified, so this is only worth doing if a container-based
     provider ever comes back into scope, and it costs feature-set fidelity
     against devnet.
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
