# TASKS

## Done

- **Toolchain image** — `brik/solana-toolchain:dev`, pinned and pre-warmed. The
  pre-built project at `/workspace/project` builds in ~1.5s in place.
- **Local validator per workspace** — `brik-localnet`, boots in ~2s, funds 1000
  SOL, works with egress off. No faucet anywhere in the flow.
- **Provider bake-off harness** — `pnpm bakeoff`, Docker baseline measured.
- **Landing page** — live, app-entry CTAs gated as "Coming soon".
- **Real workspace run** — browser to a real `anchor build` and `anchor deploy`
  in a container that did not exist before the request, streamed live, ending in
  a real program id. Failure and cleanup paths verified (see STATE.md).

## Next, one slice each

- **A real project to build.** Every workspace currently builds the same scratch
  program. Needs template projects that overlay onto `/workspace/project` in
  place, or the warm-build advantage is lost.
- **The agent.** The composer answers honestly that nothing is connected. This
  is the slice that makes the agent panel a plan rather than a fixed script, and
  brings back the suggested-change chip.
- **Tests in the run.** Requires deciding how `node_modules` gets into a
  workspace that runs with egress off.
- **Provider decision.** E2B and Fly are the live candidates; both must be
  proven to run this image's validator (io_uring) before either is chosen.
- **Persistence and auth.** Leases live in one Node process today, so a workspace
  cannot survive a restart or be reattached from another tab.
- **Preview URLs and devnet deploy.** What the Preview pane is waiting on.

## Not started

Billing, sharing and fork, GitHub import (the `/new` field accepts a repo URL
and the workspace ignores it), collaboration.
