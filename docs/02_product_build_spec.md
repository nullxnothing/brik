# BRIK Product & Build Specification

## MVP goal
A user can start or import a Solana project, use an AI agent to modify it, successfully build/test it, preview it, and deploy to devnet without local setup — with **no signup required before the first success**.

**Activation target: P95 time from landing to first successful devnet transaction under 5 minutes.**

## User stories
- Open a template into a running anonymous ephemeral workspace directly from the landing page — no account.
- Start from a production-quality template.
- Import a GitHub repository.
- Ask AI to implement a feature.
- Review the agent's diff.
- Build and test inside the cloud workspace.
- Inspect compiler and Solana transaction failures.
- Preview the frontend.
- Share a live devnet preview URL; visitors can fork it into their own workspace.
- Deploy to devnet.
- Sign up to save the project (signup gates persistence, never the first success).
- Push changes back to GitHub.
- Resume a persistent workspace on paid plans.

## Core screens
1. Home/template gallery.
2. Create/import project.
3. Workspace.
4. Diff/review.
5. Deploy flow.
6. Project settings.
7. Usage/billing.

## Architecture
**Browser → control plane → workspace orchestrator → isolated workspace → agent tools → Solana/external services**

### Browser
Monaco-class editor, terminal, streaming, preview, AI task timeline, diff review, Solana panel. Secrets and privileged execution remain server-side.

### Control plane
Authentication, organizations, projects, workspace lifecycle, entitlements, secrets metadata, billing/metering, tasks, deployments, and audit events.

### Workspace
Isolated Linux environment with Git, Node/pnpm/npm, Rust, Solana CLI, Anchor, and build utilities.

Required: filesystem/process isolation, CPU/RAM/disk quotas, network policy, hibernation/resume, persistent volumes for eligible plans, cached base images/dependencies.

**Buy, don't build (v1 decision):** orchestration comes from a managed sandbox provider (E2B, Modal, Daytona, Fly Machines, or equivalent). Brik builds the Solana toolchain image, agent harness, Solana panel, and deploy workflow on top. Keep the provider integration behind an internal interface so it can be swapped or in-sourced at scale.

**Anonymous ephemeral sandboxes:** minutes-long TTL, aggressive teardown, locked-down egress, no secrets, rate-limited per IP/fingerprint. Signup converts an ephemeral sandbox into a saved project. Abuse controls ship in the same release as the anonymous flow, not after.

### Shareable previews
Every project exposes a live public devnet preview URL with a share card, subtle Built with Brik attribution, and a Fork button that clones the project into the visitor's own workspace. This is the primary growth loop and is MVP scope, not polish.

## AI agent
### Ask mode
Explain code, architecture, Solana concepts, and errors.

### Build mode
Plan → inspect → edit → execute → observe → fix → test → present result.

### Tools
- read/search/edit files;
- run terminal commands;
- Git status/diff/commit;
- build/test;
- preview status;
- inspect/simulate transactions;
- deploy devnet.

Never claim build/test/deploy success without tool evidence.

## AI cost strategy
- Commercial model APIs initially.
- Cheap models for classification/simple edits.
- Default coding model for normal implementation.
- Frontier model only for hard debugging/architecture.
- Prompt caching and targeted repository retrieval.
- Task budgets and retry limits.
- Vendor-neutral agent harness.
- BYOK after managed AI is stable.

## Security
Treat every workspace as untrusted. Use strong isolation, quotas, egress controls, encrypted secrets, separate dev/production credentials, approval gates for external/mainnet actions, simulation where possible, and audit records.

## Open design questions (resolve before mainnet tooling ships)
- **Mainnet deploy economics:** program deploys cost real SOL (often several SOL in rent depending on binary size). Decide who funds deploy rent, how it flows through billing, and where the custody boundary sits so Brik never holds user funds. Devnet-only until this is designed.

## Brik MCP server / CLI (post-alpha)
Expose Brik's Solana environment — build, test, devnet deploy, transaction inspection — as an MCP server and CLI usable from Cursor, Claude Code, and other agent editors. Experienced developers keep their editor; Brik owns Solana execution and the deploy path. Scope after the browser core loop is reliable, targeted for the distribution phase.

## Non-goals v1
Multi-chain; proprietary foundation model; full AWS/Vercel replacement; marketplace/token; heavy enterprise IAM; dozens of integrations; mainnet deploys (until economics/custody are designed).

## Roadmap (AI-agent velocity)
Development is done by AI coding agents with founder direction and review. Build phases run 3–5x faster than a human-team plan and workstreams run in parallel; **learning phases don't compress** — alpha observation, retention windows, interviews, and partnership outreach are calendar-bound. Rules that survive the speedup: reliability and time-to-success outrank feature count; the sandbox security boundary, secrets handling, and egress policy get **human review**, not agent-only merges; and the pre-build gate in `07_pre_build_research_agenda.md` clears before the core-loop sprint starts.

### Days 1-2
Daemon reuse audit: editor, terminal, agent harness, Git, execution, Solana, auth, billing, deployment. Mark reuse/refactor/replace/remove — reused because it's good, not because it exists.

### Days 1-5 (parallel)
Technical spikes from the pre-build agenda: sandbox provider bake-off and decision, Anchor build-time budget (pre-warmed workspaces, dependency caches, prebuilt first-run binaries), RPC/faucet strategy, agent eval set drafted. Discovery interviews and design-partner recruitment start day 1 (calendar-bound).

### Days 3-10
Workspace foundation on the chosen managed sandbox provider: provider integration behind an internal interface, Solana toolchain image, startup speed, terminal, GitHub import, editor, hibernation, usage events. No in-house orchestration.

### Days 6-14 (parallel)
Agent loop: tool API, routing, file/search/shell, build/test, diff review, cost limits, eval-set pass rate as the quality bar.

### Days 10-16 (parallel)
Solana experience and growth surfaces: devnet wallet + funded faucet, Solana panel, logs/transactions, one-click devnet deployment, shareable preview URLs + share cards + fork flow, anonymous ephemeral sandboxes **with abuse controls in the same release**.

### Days 15-18
Hardening: reliability of the golden path, analytics events end-to-end, human security review of the sandbox boundary, load/abuse testing of the anonymous tier.

### Days 19-45 — Private alpha (calendar-bound)
20–40 committed design partners. Observe activation live, fix blockers daily, measure cost/session and P95 landing-to-first-devnet-transaction. This window cannot shrink: W1 retention needs weeks to exist.

### Days 25-35 (parallel with alpha)
Billing, plan limits, persistence, metering, overages. Mainnet workflow only if the economics/custody design (open questions above) is resolved.

### Days 30-50 (parallel with alpha)
Distribution build: Open in Brik placements (official docs, Anchor tutorials, ecosystem repos), 3–5 templates, interactive tutorials, hackathon mode + credits, MCP/CLI beta, founder-led launch content on X.

### Days 46-60
Monetization beta: Builder plan live to the alpha cohort; first paid conversions; W1 retention readable.

### Days 60-75
Decision gate: W1 retention, deployments, paid conversion, COGS, customer pain — double down, reposition, or stop. W4 paid retention confirms the call by ~day 90; that confirmation is calendar time no build speed can buy.
