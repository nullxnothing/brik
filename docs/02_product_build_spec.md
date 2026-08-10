# BRICK Product & Build Specification

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

**Buy, don't build (v1 decision):** orchestration comes from a managed sandbox provider (E2B, Modal, Daytona, Fly Machines, or equivalent). Brick builds the Solana toolchain image, agent harness, Solana panel, and deploy workflow on top. Keep the provider integration behind an internal interface so it can be swapped or in-sourced at scale.

**Anonymous ephemeral sandboxes:** minutes-long TTL, aggressive teardown, locked-down egress, no secrets, rate-limited per IP/fingerprint. Signup converts an ephemeral sandbox into a saved project. Abuse controls ship in the same release as the anonymous flow, not after.

### Shareable previews
Every project exposes a live public devnet preview URL with a share card, subtle Built with Brick attribution, and a Fork button that clones the project into the visitor's own workspace. This is the primary growth loop and is MVP scope, not polish.

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
- **Mainnet deploy economics:** program deploys cost real SOL (often several SOL in rent depending on binary size). Decide who funds deploy rent, how it flows through billing, and where the custody boundary sits so Brick never holds user funds. Devnet-only until this is designed.

## Brick MCP server / CLI (post-alpha)
Expose Brick's Solana environment — build, test, devnet deploy, transaction inspection — as an MCP server and CLI usable from Cursor, Claude Code, and other agent editors. Experienced developers keep their editor; Brick owns Solana execution and the deploy path. Scope after the browser core loop is reliable, targeted for the distribution phase.

## Non-goals v1
Multi-chain; proprietary foundation model; full AWS/Vercel replacement; marketplace/token; heavy enterprise IAM; dozens of integrations; mainnet deploys (until economics/custody are designed).

## 90-day roadmap
### Days 1-7
Daemon reuse audit: editor, terminal, agent harness, Git, execution, Solana, auth, billing, deployment. Mark reuse/refactor/replace/remove.

### Days 8-20
Workspace foundation on a managed sandbox provider: provider integration, Solana toolchain image, startup speed, terminal, GitHub import, editor, hibernation, usage events. No in-house orchestration.

### Days 21-35
Agent loop: tool API, routing, file/search/shell, build/test, diff review, cost limits.

### Days 25-40
Solana experience: toolchain image, devnet wallet, Solana panel, logs/transactions, one-click devnet deployment.

### Days 36-50
Private alpha with 20-40 target builders. Measure activation, reliability, and cost/session.

### Days 51-65
Billing, plan limits, persistence, overages, mainnet workflow.

### Days 66-80
Distribution: shareable previews + fork loop hardened, Open in Brick placements (official docs, Anchor tutorials, ecosystem repos), 3-5 templates, interactive tutorials, hackathon mode + credits, MCP/CLI beta, founder-led launch content on X.

### Days 81-90
Decision gate: W1/W4 retention, deployments, paid conversion, COGS, customer pain.

**Reliability and time-to-success outrank feature count.**
