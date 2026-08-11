# TASKS

## Done

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
- **The workspace is open to the internet** — https://www.brik.builders runs a
  real Anchor project in an E2B sandbox for anyone who presses Start building,
  and the agent changes it on request. Verified on the deployed site, including
  that leaving the page releases the sandbox. What that took, and what it does
  not yet include, is in STATE.md.

## Next, in dependency order

1. **Reap orphaned sandboxes.** A stream that dies without the page's DELETE
   leaves its sandbox running until the 900s TTL, because a client disconnect
   does not reach the cleanup path on Vercel the way it does locally
   (STATE.md). It is bounded and it heals, but it is the remaining way to spend
   money on nothing. E2B's API lists what is running and Redis holds what is
   claimed; anything in the first and not the second is an orphan. A cron and a
   set difference.

2. **A lease store.** Reconnecting to an E2B sandbox by id covers the agent turn
   and the release, and Redis now holds the counts, so what is left is the
   sweeper and an adopted lease's deadline being a ceiling rather than the
   sandbox's real one. Smaller than it was.

3. **An approval step.** `requiresApproval()` already says write and run need
   one, and nothing asks. The agent writes files and runs commands unsupervised,
   which is survivable only because the sandbox has no egress and a TTL. A
   stranger can reach it now, so this has stopped being theoretical.

4. **Make the template suites rerunnable.** Found by the agent on the live site:
   a jar PDA derived from the wallet pubkey means running a suite twice against
   the same validator fails, `initialize` on an account already in use and then
   an accumulated balance. `pnpm verify-templates` cannot see it because every
   template gets a fresh sandbox. Anyone who redeploys inside one workspace can.

5. **Devnet deploy, preview URLs, fork.** The growth loop, and what the Preview
   pane is waiting on. Needs a funded treasury; ~1.27 SOL of rent per deploy.

6. **Auth and persistence.** Per docs/02 signup gates saving and never the first
   success. Nothing survives a closed tab today, and the UI does not yet say so.

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
