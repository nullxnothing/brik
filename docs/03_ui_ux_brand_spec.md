# BRIK UI/UX & Brand Specification

## UX principle
BRIK should feel easier than installing a toolchain, not like a cloud console.

## Home
# What do you want to build?

Primary actions: **Describe an idea · Choose a template · Import GitHub · Blank project**. Show recent projects below.

## Project creation
Template/import/prompt → project name → create. Hide infrastructure configuration by default.

## Workspace layout
- **Left:** Files, Search, Git, Projects.
- **Center:** Editor; preview can split or replace it.
- **Right:** AI Agent by default; switchable to Solana context.
- **Bottom:** Terminal/build/test output, collapsible.
- **Top:** Project, branch, network, workspace status, usage, Deploy.

## Solana panel
Network, dev wallet balance, programs, recent transactions, build state. Failed transaction → decoded logs → **Ask AI to fix**.

## Agent UX
Show task objective, compact plan, live actions, errors, changed files, build/test result, and **Review Changes**. Avoid endless chat bubbles; agent work should feel like a task runner.

## Onboarding
The first session should end in a successful result — **before signup**. Clicking a template on the landing page drops the visitor straight into a running anonymous workspace: code visible, build running, devnet transaction firing. Use a guided starter with a preconfigured project and one obvious AI task. Signup is prompted only to save the project, never to try it. Target: P95 under 5 minutes from landing to first successful devnet transaction.

## Share & fork UX
Every project has a **Share** action producing a live public devnet preview URL with a polished share card (project name, screenshot, Built with Brik attribution). Visitors to a shared preview see a prominent **Fork this** button that clones the project into their own workspace. A public gallery of user-built apps (opt-in) serves as social proof and a browse-to-fork surface.

## Interactive tutorials
A "learn Solana by shipping" track lives in-product: each tutorial is a guided project ending in a deployed app with a shareable URL. Each tutorial also renders as a public page targeting a concrete search query, with a one-click Open in Brik entry.

## Deploy UX
Devnet can be one-click after successful build. Mainnet requires network, wallet, program, estimated cost, simulation/result where possible, and explicit confirmation.

# Brand

**BRIK**  
**Domain: TBD**  
**Build on Solana. From your browser.**

## Personality
Technical, approachable, modern, minimal, fast, confident. Developer-first without crypto clichés.

## Visual direction
Use construction abstractly: modular blocks, grids, snapping, layers, assembly. Avoid LEGO imitation/cartoon briks.

Use neutral surfaces, one restrained accent, strong contrast, compact developer density without clutter, and generous spacing on marketing pages.

## Logo
Geometric BRIK wordmark plus compact B/stacked-block mark. Must work at favicon size.

## Core components
Buttons, inputs, command bar, tabs, panels, editor chrome, terminal, status badge, usage meter, deploy dialog, diff view, toast, modal, template card, project card.

## Status vocabulary
Ready · Building · Testing · Failed · Deployed · Sleeping

## Copy
Short, literal, action-oriented. Prefer **Deploy to devnet** over clever microcopy.

## Avoid
Generic crypto purple gradients, coins, chains, rockets, flames, excessive glow, and visual noise.

# Landing page

## Hero
# From idea to a live Solana app. In one tab.
Describe it or pick a template — Brik builds, tests, and deploys it to devnet while you watch. No Rust, Anchor or Solana setup required.

**Primary CTA:** Start building — no signup  
**Secondary CTA:** Import GitHub

The hero CTA opens a running workspace directly; the landing page is one continuous demo of a specific outcome (payments checkout, token-gated site, NFT mint page), not a feature tour.

## Demo
Choose/describe → workspace starts (no signup) → AI implements → build succeeds → preview works → devnet transaction succeeds → shareable URL.

## Proof sections
1. **Zero setup** — Rust, Anchor, Solana CLI, and tooling are ready.
2. **AI that runs the project** — edits, executes, reads errors, iterates.
3. **Built for Solana** — programs, wallets, transactions, logs, network context.
4. **Your code stays yours** — GitHub in, GitHub out.
5. **Ship and share** — devnet deploys with live URLs anyone can open and fork.

Below the proof sections: a gallery strip of real user-built apps, each opening to its live preview with a Fork button.

Final CTA: **Start building. No signup, no local setup.**
