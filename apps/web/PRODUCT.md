# PRODUCT.md — Brik

## What it is

Brik is a browser-native development platform for Solana. A visitor describes an app or picks a
template and gets a complete cloud workspace: AI coding agent, editor, terminal, Rust/Anchor/Solana
toolchain, funded dev wallet, tests, preview, and one-click devnet deploy. No local setup, no signup
before the first success.

Positioning line: **Build on Solana. From your browser.**
Hero message: **From idea to a live Solana app. In one tab.**

Brik is not another AI editor. The editor is the creation surface; the business is the cloud
development environment and production workflow around it.

## Who it is for

Paying core: individuals and small teams already motivated to ship a Solana application
(web devs entering Solana, existing Solana devs, technical founders, hackathon builders, agencies).
Beginners are an acquisition audience, not the revenue core.

## The core loop

1. Choose a template, import a GitHub repo, or describe an idea.
2. Brik provisions an isolated cloud workspace (Git, Node, Rust, Solana CLI, Anchor preinstalled).
3. The agent plans, edits, builds, tests, and iterates with tool evidence. Never claims success
   without evidence.
4. User inspects programs, wallets, transactions, decoded logs on devnet.
5. One-click devnet deploy; live shareable preview URL with a Fork action.
6. Signup gates saving the project, never the first success.

Activation target: P95 under 5 minutes from landing to first successful devnet transaction.
North-star metric: weekly projects reaching a real execution milestone.

## Funnel

Landing → START BUILDING → `/new` ("What do you want to build?": describe · templates · import
GitHub · blank) → `/workspace` running immediately, anonymous and ephemeral → signup converts the
sandbox into a saved project.

Current build stage: the workspace runs for real and nothing else does. Opening `/workspace` starts a
container from the toolchain image, boots its own validator, writes the chosen template in, then
builds, deploys, and tests it against that validator, streaming real stdout. Four templates are real
Anchor programs with real suites. There is no agent, no auth, no database, no persistence, and no
preview URL, so the composer declines honestly and the Preview pane says what it is waiting on.
Landing-page CTAs stay gated until the workspace can run somewhere other than a developer's own
Docker. Nothing in the UI may claim a backend capability that does not exist yet (no fake login, no
fake persistence promises).

## Status vocabulary (fixed)

Ready · Building · Testing · Failed · Deployed · Sleeping

## Voice

Short, literal, technical, calm. "Deployment confirmed." "Build failed." "Deploy to devnet."
No hype, no exclamation marks, no emoji, no em dashes anywhere in UI copy. Errors name the cause and
the recovery. Success is restrained: BUILD COMPLETE, DEPLOYED, TRANSACTION CONFIRMED.

## Never

Memecoin platform aesthetics, crypto casino, purple-gradient Web3, cyberpunk HUD, LEGO/cartoon
bricks, AI sparkles, confetti, coins/rockets/chains imagery.

## Pricing (indicative, not yet live)

Free $0 · Builder $25/mo · Pro $79/mo+usage · Team from $199/mo · Scale custom.
Do not surface pricing in the UI until plans exist.
