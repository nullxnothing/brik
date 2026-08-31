# TASKS

## Done

- **Social launch library** — 15 publish-ready X posts paired one-to-one with
  15 verified 1200 × 675 Brik cards. The set uses generated text-free plates,
  live UI captures, official brand geometry, and a deterministic renderer. It
  names unshipped boundaries instead of implying devnet deploys or persistence.
- **Toolchain image** — `brik/solana-toolchain:dev`, pinned and pre-warmed, now
  carrying the union of template dependencies so a workspace with egress off can
  still build and test what it is given.
- **Local validator per workspace** — `brik-localnet`, boots in ~2s, funds 1000
  SOL, works with egress off. No faucet anywhere in the flow.
- **Provider bake-off harness** — `pnpm bakeoff`, Docker baseline measured.
- **Landing page** — live, and it names the company: the closing band says Brik
  is a product of Brik Builders LLC, a Colorado software company, at display
  size above the footer, with an About link in the nav. The "Coming soon"
  buttons are gone and every CTA points at `/new`.
- **Product-led landing composition** — the promise and actions now share a shallow masthead with
  measured run telemetry before leading into the animated workspace. Environment proof is one
  autonomous Localnet → Toolchain → Agent run: it boots, resolves versions, exposes and repairs a
  compiler type error, then proves the build at 7.9s. Hover pause, replay, and a reduced-motion final
  state are included; the old four-column explanation is gone. The frame remains readable at large
  desktop widths, continues below the opening viewport, and the full story stacks without horizontal
  overflow at 390px. Verified locally; deployment pending.
- **Evidence-driven landing motion** — the workflow now advances through real queued, running,
  failed, retried, verified, and deployed states as it crosses the viewport. A live evidence strip
  replaces the oversized return loop, the page edge carries a restrained run-position meter on large
  screens, and reduced motion resolves directly to the verified state. Verified locally; not deployed.
- **Unified landing frame and controls** — the landing navbar, 55/35 masthead, and workspace share
  one frame with measured 24px, 28px, and 48px vertical relationships. `/new` shares the halftone
  field without the spotlight, start-building arrows are removed, button feedback is bounded, the
  footer credit links to `@brikbuilders`, and `$brik` is present as a dormant lowercase nav tab.
  Verified locally; not deployed.
- **Real workspace run** — browser to a real `anchor build` and `anchor deploy`
  in a container that did not exist before the request, streamed live. Failure
  and cleanup paths verified (see STATE.md).
- **Real templates** — four Anchor programs with test suites, written into the
  workspace and proven by `pnpm verify-templates`: 12 tests passing across four
  templates, each built, deployed, and tested in 12 to 14 seconds.
- **The fabricated demo is off the internet** — `/workspace` was publicly
  reachable and served the old scripted demo, with a hardcoded program id and a
  fake deploy. `/workspace`, `/new`, and both `/api/workspace` routes now answer
  404 in production, open only where `BRIK_WORKSPACE_ENABLED` or a development
  build says otherwise. Deployed and verified against the live domain; the
  deployment and the Vercel change it needed are in STATE.md.
- **The landing page says only what is true** — the hero animation ran a
  fabricated build, the toolchain card had four wrong versions, and the devnet
  card claimed a preview URL and a fork count that were invented. All of it is
  measured now, and a closed route lands on a real page instead of Next's
  default 404. What remains on that page is intent rather than fabrication, and
  it is listed below.
- **The agent is connected** — the composer runs it against the workspace on
  screen, over the same streaming protocol a run uses. Proven in a browser on a
  real container, both ways: a change it made is on disk and the editor shows
  the container's copy, and an impossible request ends in a refusal backed by a
  command rather than a fabricated success. STATE.md has both transcripts and
  the two bugs driving it turned up.
- **A visitor cannot exhaust the budget** — Upstash Redis holds the workspace
  count for the whole deployment and, per visitor per hour, workspace starts and
  agent messages. Both refusals driven against the deployed site; the per-visitor
  one turns a request away before any sandbox is allocated. Details and the four
  decisions behind it are in STATE.md.
- **The agent is metered in money** — a turn is not a fixed price, so counting
  turns was never a spending limit. The loop reports each model call's usage and
  the route charges it at Opus 5 list price against a per-visitor hourly budget.
  A visitor who runs out is offered their own key, held in their tab and never
  stored here, rather than a wall. Driven in a browser at a one-cent budget.
- **Redeploy does not break the tests** — three of the four suites derived their
  accounts from the provider's own wallet or a fixed order id, so a visitor who
  pressed Redeploy got two failing tests that were not their fault. Fixed, and
  `pnpm verify-templates` now runs every template twice against the same
  workspace so it can see this class of bug at all. Confirmed against the old
  tip jar, which fails that second run.
- **Nothing is left running that nobody is waiting on** — a cron reaps sandboxes
  the provider is running and the store has no claim for. Proven on the deployed
  site: a planted orphan was gone 282 seconds later, well inside its own 900s
  TTL.
- **The workspace is open to the internet** — https://www.brik.builders runs a
  real Anchor project in an E2B sandbox for anyone who presses Start building,
  and the agent changes it on request. Verified on the deployed site, including
  that leaving the page releases the sandbox. What that took, and what it does
  not yet include, is in STATE.md.

- **The workspace shell is machined** — built to the workspace-depth handoff:
  three planes with one light source, a material on the chassis, lamps instead of
  status text, knurled seams that drag, and a boot sequence that assembles the
  case once on arrival. The animation is the case only; every readout stays
  driven by the run's own events, and the six values the reference prototype
  invented were replaced with measured ones rather than shipped. Verified against
  a real sandbox at desktop and 390px (STATE.md).

## Next, in dependency order

1. **A lease store.** Reconnecting to an E2B sandbox by id covers the agent turn
   and the release, and Redis now holds the counts, so what is left is the
   sweeper and an adopted lease's deadline being a ceiling rather than the
   sandbox's real one. Smaller than it was.

2. **An approval step.** `requiresApproval()` already says write and run need
   one, and nothing asks. The agent writes files and runs commands unsupervised,
   which is survivable only because the sandbox has no egress and a TTL. A
   stranger can reach it now, so this has stopped being theoretical.

3. **Devnet deploy, preview URLs, fork.** The growth loop, and what the Preview
   pane is waiting on. Needs a funded treasury; ~1.27 SOL of rent per deploy.

4. **Auth and persistence.** Per docs/02 signup gates saving and never the first
   success. Nothing survives a closed tab today, and the UI does not yet say so.

## Worth doing, not blocking

- **Replace the planning ceiling with a measured one.** `BRIK_AGENT_CENTS_PER_HOUR`
  is 500 because `docs/07` says $2 to $5 per anonymous session, and that doc also
  says the COGS spreadsheet comes before free-tier limits. It has not been built.
  The meter now emits the number that would fill it in: every turn reports its
  own cost, so a week of real traffic replaces the guess with a distribution.
- **Keep the price table and the model in step.** `limits.ts` prices tokens at
  Opus 5's $5/$25 and `packages/agent` picks the model. Nothing checks that the
  two agree, so a tier change silently mis-charges until someone notices.

Three more, each with the evidence already gathered and none taken:

- **Shrink the image further.** 7.65GB to 6.11GB extracted so far, which already
  clears E2B's free 10GB ceiling. What is left is the risky tier: roughly 600MB
  of Agave perf-libs, ledger-tool, and unused platform-tools triples, plus about
  690MB of rustup docs that only a minimal profile or a flatten stage reaches.
- **Close the first-build gap on E2B.** 13.2s after a template overlay against
  2.2s on Docker, because a snapshot hydrates its filesystem lazily and the
  825MB target directory is read cold. Worth attention only if activation time
  becomes the constraint, which at 40s per run it is not.
- **Decide what the landing page is allowed to promise.** No invented numbers
  are left on it, but three cards describe capabilities the product does not
  have yet, and each is a different distance away. The agent card is closest:
  the loop is verified and only the wiring is missing (slice 1). "Push to devnet
  when you want a URL to share" is slice 6. "Git is wired in from the first
  commit. Push to your own repo" has nothing behind it at all — GitHub push is
  in Not started. The git card is the one that reads as a shipped feature, and
  it matters more now that the CTAs promise a working app rather than a
  waiting list.
- **Swap the validator to Agave 3.0.14** to drop `seccomp=unconfined`
  (STATE.md, verified). Demoted to insurance: E2B runs the 3.1.9 validator
  unmodified, so this only matters if a container-based provider returns, and it
  costs feature-set fidelity against devnet.

## Not started

Billing, GitHub import (the `/new` field accepts a repo URL and the workspace
ignores it), GitHub push, collaboration, mainnet anything.
