BRIK
Build on Solana. From your browser.
Business Plan • Product Strategy • Go-to-Market • Operating Plan

Working brand: BRIK
Primary domain: TBD — redo domain/trademark diligence after the BRIK rename

# 1. Executive Summary
Brik is a browser-native development platform for Solana. It gives developers a complete preconfigured cloud workspace with an AI coding agent, editor, terminal, Solana tooling, testing, wallet context, previews, and deployment. The product removes the setup and environment burden that makes Solana development difficult for both experienced blockchain developers and conventional web developers.
Brik is not another AI editor. The editor is the acquisition and creation surface; the business is the cloud platform underneath it. Users begin free and pay as projects require persistent workspaces, premium AI, compute, mainnet deployment, hosting, monitoring, storage, team controls, and production infrastructure.
Solana is the initial wedge, not necessarily the permanent market boundary. Expansion beyond Solana happens only after retention and unit economics are proven.
## Decisions made
- Name: Brik.
- Primary domain: TBD — redo domain/trademark diligence after the BRIK rename.
- Primary promise: “Build on Solana. From your browser.”
- Positioning: browser-native Solana development platform, not a generic AI IDE.
- Acquisition messaging leads with the outcome — “From idea to a live Solana app in one tab” — while the tagline remains the positioning line.
- Workspace orchestration is bought from a managed sandbox provider for v1, not built in-house.
- Shareable devnet preview URLs are the primary growth loop; the first success requires no signup.
- Zero local setup; cloud workspaces perform builds, tests, and tool execution.
- AI is central but model-agnostic. Brik owns the agent harness, environment, context, tools, and workflow.
- Business model: freemium subscription plus usage-based AI, compute, builds, hosting, storage, and infrastructure.
- Git import/export is mandatory; users own their code.
- Do not limit the long-term brand to blockchain terminology.
# 2. Problem & Opportunity
Solana development carries a large setup burden: Rust, Solana CLI, Anchor, Node tooling, RPC configuration, wallets, devnet/local environments, program IDs, IDLs, transaction inspection, and deployment knowledge. General-purpose AI coding tools can generate code, but they do not inherently provide a deterministic Solana environment or an integrated path from generated code to a working deployment.
Brik makes the environment the advantage: generated or edited code can immediately be built, executed, tested, inspected, and shipped.
# 3. Product
## Core workflow
1. Choose a template, import a GitHub repository, or describe what to build.
1. Brik provisions an isolated Linux workspace with the supported Solana toolchain and dependencies.
1. The browser exposes an editor, file tree, terminal, preview, AI agent, Git controls, and Solana panel.
1. The agent inspects files, edits code, runs commands, compiles, tests, interprets failures, and iterates.
1. The user tests on devnet and inspects programs, wallets, transactions, logs, and state.
1. The user deploys through a guided workflow and can run supported production components on Brik or export them.
## MVP
A user can start or import a Solana project, use the AI agent to modify it, build and test it, preview it, and deploy it to devnet — without local setup and without staff help. Every MVP project gets a live, shareable devnet preview URL. Full user stories, screens, and acceptance criteria live in `02_product_build_spec.md`.

The MVP activation target: **P95 time from landing to first successful devnet transaction under 5 minutes**, with no signup required before the first success.

## Do not build first
- A proprietary foundation model.
- Multi-chain support before Solana retention is proven.
- A full AWS/Vercel replacement.
- A token, marketplace, or social network.
- Dozens of integrations before the core loop is excellent.
- Heavy enterprise governance before team demand exists.
# 4. Architecture & AI

## Workspace layer: buy, don't build
For v1, workspace orchestration (isolated containers, hibernation/resume, persistent volumes, port forwarding, quotas, egress policy) is **bought from a managed sandbox provider** (E2B, Modal, Daytona, Fly Machines, or equivalent), not built in-house. Brik's differentiation lives in the Solana toolchain image, the agent harness, the Solana panel, and the deploy workflow — none of which requires owning orchestration. Keep the integration portable enough to switch providers or in-source at scale; revisit build-vs-buy only after paid retention is proven.

## AI cost strategy
- Use commercial model APIs initially; do not train a large model.
- Route simple work to cheaper models and difficult coding/debugging to stronger models.
- Cache stable context and retrieve only relevant repository content.
- Set hard included AI budgets and transparent overages.
- Add bring-your-own-key/model support after the managed experience is stable.
- Keep the agent harness vendor-neutral.
# 5. Customer

Initial paid ICP: individuals and small teams already motivated to ship a Solana application. Beginners are an acquisition audience, not the assumed revenue core.
# 6. Business Model

## Metered revenue
- AI inference/agent credits.
- Workspace CPU/RAM time.
- Build minutes.
- Persistent storage.
- Hosting and background workers.
- Logs and monitoring.
- RPC/data usage where commercially sensible.
- Additional production environments.
The free tier must be bounded with hibernation, quotas, AI credits, abuse controls, and explicit overages.
# 7. Go-to-Market
## Acquisition principle
Market a **shippable outcome**, not an environment. Nobody wakes up wanting a browser IDE; they want the thing at the end. Positioning line: “Build on Solana. From your browser.” Acquisition/hero message: **“From idea to a live Solana app in one tab.”** The landing page is one continuous demo of a specific, desirable outcome (payments checkout, token-gated site, NFT mint page) — not a feature tour.

## Primary growth loop: shareable output
Every project gets a live public devnet URL by default, a polished share card, a **Fork this** button, and subtle “Built with Brik” attribution. A public gallery of user-built apps doubles as social proof and SEO surface. In a small market users cannot be bought — each user's output must advertise the product and bring the next user. This loop is designed first; everything else feeds it.

## Magic moment before signup
Clicking a template drops a visitor straight into a running ephemeral workspace — code visible, build running, devnet transaction firing — with signup required only to **save**, not to try. Target: P95 under 5 minutes from landing to first successful devnet transaction. Anonymous sandboxes are short-lived, cheap, and egress-locked (see abuse controls); perceived generosity stays high while real exposure stays bounded.

## Distribution spine: hackathons and official docs
1. **Get “Open in Brik” into pages we don't own where developer intent already exists**: official Solana documentation, Anchor tutorials, and major ecosystem repos (Jupiter, Metaplex, Helius examples). Solana Playground became the beginner default because the official docs embed it — that slot is the single most valuable distribution asset in this market and is an explicit business-development goal.
2. **Hackathons are the spine of the first six months**, not one channel among many: Colosseum and Solana Foundation events, university clubs, dedicated hackathon mode, free credits with conversion offers, presence at every major event. Pursue Solana Foundation early as partner and grant source (non-dilutive funding for dev tooling).

## Education funnel: learn Solana by shipping
Solana's education funnel is broken (stale tutorials, no successor to Buildspace). Ship a track of interactive in-product tutorials, each ending in a deployed app with a shareable URL. Every tutorial is also a landing page targeting a concrete search (“how to build X on Solana”) with a one-click runnable project no other search result can match. Beginners remain an acquisition audience, not the revenue core — but they are the top of the funnel and feed the share loop.

## Meet experienced developers in their existing tools
Ship a **Brik MCP server / CLI** so Cursor and Claude Code users can use Brik's Solana environment (build, test, devnet deploy, transaction inspection) from their own editor. This converts the biggest competitive threat — general agents adding similar features — into an acquisition channel: they bring the editor, Brik owns Solana execution and the deploy path. GitHub import remains the acquisition path for developers who do switch surfaces.

## Launch narrative
Solana's developer community concentrates on X and rewards founder-led building in public. Launch with a 2–3 minute live demo video (idea → working app → devnet transaction), weekly public build updates, and demos of real users' projects. For the first thousand users, the founder demoing on X is the primary marketing channel.

## Sequencing rules
1. One exceptional end-to-end starter before breadth; expand to 5–10 templates only after the first experience retains users.
1. Instrument the entire funnel before meaningful paid acquisition.
1. Growth design and abuse design are done together, not sequentially — every free-exposure increase ships with its cost/abuse control.

## Distribution loops (in priority order)
- Shareable devnet previews with Built with Brik attribution + fork buttons.
- Open in Brik buttons on official docs, tutorials, and ecosystem repos.
- Hackathon credits with conversion offers.
- Interactive tutorials targeting concrete development searches.
- Forkable template URLs and the public gallery.
- Brik MCP/CLI inside existing agent editors.
# 8. Metrics & Validation
North-star metric: weekly projects reaching a meaningful execution milestone: successful build plus a working preview, devnet transaction, or deployment. Signups and prompts are not product-market fit.

- Track **P95 time from landing to first successful devnet transaction** (target: under 5 minutes) as the primary activation metric.
- Track the share loop: previews shared, forks per shared project, and signups attributed to shared/forked projects.
- Measure beginner and experienced cohorts separately.
- Require repeated usage and deployment, not positive social feedback.
- Set a maximum free-user monthly cost before opening access broadly.
- Do not scale hiring/marketing until a paid cohort retains with positive contribution margin.
# 9. Profitability Discipline

Illustrative early milestone: 200 Builder users at $25, 50 Pro users at $79, and 10 Team accounts averaging $250 equals about $11,450/month in subscription revenue before usage. The important test is retention and gross margin after AI and compute costs.
# 10. Competitive Strategy

# 11. Brand Brief
Name: BRIK
Domain: TBD
Tagline: Build on Solana. From your browser.
## Personality & visual direction
- Technical but approachable; modern, minimal, fast, confident.
- Developer-first without crypto clichés.
- Construction metaphor stays abstract; avoid toy-block or LEGO imitation.
- Mark: the notched block — a rounded square with a stepped cut from the top-right corner; cream on near-black.
- Wordmark: "Brik" in a rounded geometric display face, with the notched block as the dot of the i.
- Neutral interface with one restrained accent and subtle grid/block motifs.
- Product screenshots and real workflows dominate marketing.
- Avoid generic purple gradients, coins, chains, rockets, and flame imagery.
# 12. Build & Validation Plan
Development is done by AI coding agents (Claude Code / Codex) with the founder directing, reviewing, and validating. This compresses **build** phases roughly 3–5x and allows parallel workstreams — but it compresses **learning** phases not at all: interviews, alpha observation, retention windows, and partnerships run on calendar time. W1 retention takes a week to exist; W4 takes four. The plan below builds in days and learns in weeks; the bottleneck shifts from engineering to founder decisions, human review of the security boundary, and user recruitment. The full phase detail lives in `02_product_build_spec.md`; the pre-build gate lives in `07_pre_build_research_agenda.md`.

# 13. Standard Pre-Build Documents
## Product Requirements Document
- Goal: start/import a Solana project, use AI to modify it, successfully build/test it, and deploy to devnet without local setup.
- Primary stories: template, GitHub import, agent feature task, diff review, build/tests, transaction inspection, preview, devnet deploy, resume project.
- Non-goals: multi-chain, proprietary model, broad cloud replacement, marketplace.
- Acceptance: a target user reaches a successful project milestone without staff intervention.
## Lean Canvas

## Risk Register

## Pre-launch business checklist
- Trademark and company-name diligence for Brik and the chosen domain.
- Terms of Service, Privacy Policy, Acceptable Use Policy, and data-processing/security review.
- Cloud sandbox threat model and secrets-handling design.
- Vendor cost model for workspace compute, model APIs, storage, logs, and RPC.
- Billing/metering specification with hard free-tier limits.
- Analytics event taxonomy and cohort dashboard.
- Customer interview script and alpha recruitment list.
- Support/runbook for workspace failures, billing, deployment incidents, and abuse.
- GitHub organization, issue templates, release process, staging/production separation, and rollback plan.
- Brand kit, landing page, product demo, onboarding emails, documentation, and public status page.
# 14. Customer Discovery Plan
Before broad launch, interview at least 20 target users and watch at least 10 attempt the product. Avoid asking whether Brik sounds useful. Ask about the last Solana project they built, where time was lost, which tools they pay for, what prevented deployment, and whether they would move the next project into a browser environment.
## Questions
- Walk me through the last Solana project you started from zero.
- What took the longest before you could work on the actual product?
- What parts of your current setup would you refuse to give up?
- Which developer tools do you pay for today, and why?
- Where do AI coding tools fail you when working on Solana?
- Would you trust a cloud environment for this project? What would stop you?
- At what point would you pay: persistent workspace, AI, mainnet deploy, team collaboration, or production hosting?
- What would make you return tomorrow after the first successful build?
# 15. Decision Gates

The core discipline: Brik is successful only if people repeatedly build and ship with it and the company earns attractive margin as their usage grows.

| Area | Requirement |
| --- | --- |
| Workspace | Fast isolated cloud container, browser terminal, resource quotas, paid persistence. |
| Editor | Monaco/VS Code-class editing, search, diffs, Git import/commit/push. |
| AI agent | Read/edit/search files, terminal execution, iterative build/test loop, task history. |
| Solana | Rust, Solana CLI, Anchor, TS SDKs, devnet wallet, build/test/deploy, transaction/log inspection. |
| Preview | Forwarded ports and shareable development preview. |
| Templates | Small set of production-quality Solana starters. |
| Deployment | One-click devnet, guided mainnet, frontend/API deployment where supported. |
| Billing | Plan entitlements plus metered AI and compute. |


| Layer | Responsibility |
| --- | --- |
| Browser | Editor, agent UI, terminal, previews, Solana panel, diffs, deploy controls. |
| Workspace | Provision/hibernate/resume isolated containers; filesystem, ports, quotas. |
| Agent | Model routing, tool execution, context selection, caching, task state. |
| Tools | Files, terminal, Git, builds, tests, transaction inspection, deployments. |
| Solana | CLI/Anchor, RPC abstraction, dev wallets, logs, simulation, deployment. |
| Platform | Auth, projects, secrets, billing, metering, audit events, storage. |


| Segment | Job | Value |
| --- | --- | --- |
| Web developers entering Solana | Build a real Solana app without mastering setup first. | Zero setup, AI guidance, templates, integrated execution. |
| Existing Solana developers | Start/resume projects quickly anywhere. | Known environment, fast workspaces, Solana context. |
| Technical founders | Turn an idea into a working prototype. | Prompt/template entry, preview, deploy path. |
| Hackathon builders | Reach a demo quickly. | Instant workspace and devnet. |
| Small teams | Standardize environments and ship faster. | Shared reproducible projects and team controls. |
| Agencies | Spin up and hand off projects repeatedly. | Templates, isolation, Git portability. |


| Plan | Indicative price | Purpose |
| --- | --- | --- |
| Free | $0 | Shared compute, devnet, templates, limited AI/workspace hours. |
| Builder | $25/mo | Private projects, persistent workspaces, mainnet tooling, more resources. |
| Pro | $79/mo + usage | Production apps, stronger compute, logs, environments, monitoring. |
| Team | From $199/mo + usage | Seats, shared projects, permissions, approvals, audit history. |
| Scale | Custom | Higher quotas, private networking/runners, support, security needs. |


| Stage | Metric |
| --- | --- |
| Acquisition | Visitor → workspace started |
| Activation | Workspace → first successful build/run |
| Value | Activated → successful Solana interaction or preview |
| Retention | Week-1 and week-4 retained builders |
| Monetization | Activated → paid; ARPU; expansion usage |
| Efficiency | AI + compute COGS per free/paid user |
| Production | Projects deployed; monthly production usage |


| Driver | Rule |
| --- | --- |
| Free workspaces | Hibernate quickly; cap CPU/RAM; clean inactive environments. |
| AI | Included credits, routing, caching, paid overages. |
| Compute | Meter above included quota; avoid unlimited plans. |
| Storage/logs | Small allowance; charge for retention and scale. |
| Support | Self-serve first; priority support on higher tiers. |
| Vendors | Keep orchestration sufficiently portable to renegotiate as volume grows. |


| Alternative | Brik response |
| --- | --- |
| Cursor / Claude Code / Codex | Do not out-model them. Win on instant cloud environment, Solana execution context, deployment, and interoperability. |
| General browser builders | Win on production-grade Solana tooling and developer depth. |
| Solana IDEs/playgrounds | Win on agentic workflow, persistence, templates, deployment, and production lifecycle. |
| Local setup | Win on reproducibility, portability, instant start, and no maintenance. |


| Phase | Objective | Deliverables |
| --- | --- | --- |
| Days 1–5 | Foundations & pre-build gate. | Reuse audit, sandbox provider bake-off + decision, build-time budget spike, threat model + abuse playbook, hero template choice, analytics wiring; interviews and alpha recruitment started (calendar-bound, begun day 1). |
| Days 6–18 | Core loop excellent. | Workspace on managed provider, editor, agent loop, devnet wallet, hero template, shareable preview + fork, anonymous sandbox with abuse controls, Git import. |
| Days 19–45 | Private alpha (calendar-bound). | 20–40 target builders; observe activation; fix blockers daily; measure session cost. Billing, persistence, quotas, and metering built in parallel (~days 25–35). |
| Days 30–50 | Distribution build (parallel with alpha). | Open in Brik placements, 3–5 templates, interactive tutorials, hackathon mode + credits, MCP/CLI beta, launch content. |
| Days 46–60 | Monetization beta. | Builder plan live to alpha cohort; first paid conversions; W1 retention readable. |
| Days 60–75 | Decision gate. | Review W1 retention, deployments, conversion, COGS: double down, reposition, or stop. W4 paid retention confirms the call by ~day 90 — calendar time, regardless of build speed. |


| Block | Decision |
| --- | --- |
| Problem | Solana environment friction; fragmented build/test/deploy; general AI lacks integrated execution. |
| Customer | Motivated Solana builders, web developers entering Solana, small teams. |
| Unique value | A complete Solana development environment in one browser tab. |
| Solution | Cloud workspace + AI agent + Solana tooling + preview + deployment. |
| Channels | Templates, GitHub, tutorials/SEO, hackathons, educators, partners. |
| Revenue | Subscriptions + AI/compute/hosting/storage/infrastructure usage. |
| Costs | Cloud compute, model APIs, storage/logging, engineering, support. |
| Metrics | Activation, retention, deployment, paid conversion, ARPU, COGS. |
| Advantage | Integrated workflow, environment, templates, and Solana execution—not the base model. |


| Risk | Impact | Mitigation |
| --- | --- | --- |
| Retained market too small | High | Target web developers too; validate before scaling; preserve expansion path. |
| AI/compute COGS | High | Quotas, hibernation, routing, caching, usage billing. |
| General agents add similar features | High | Own Solana execution/deployment depth; interoperate. |
| Users like demos but do not return | High | W1/W4 retention and deployments are decision metrics. |
| Sandbox abuse/security | High | Isolation, network/resource controls, secrets boundary, abuse monitoring. |
| Mainnet deployment risk | High | Simulation, explicit approvals, wallet separation, audit events. |
| Solana demand is cyclical (tracks crypto cycles) | High | Keep burn minimal; anchor GTM to hackathons/education that persist through cycles; preserve multi-chain/general expansion path. |
| Mainnet deploy economics (program deploys cost real SOL) | Medium | Devnet-only MVP; design who funds mainnet rent, billing integration, and custody boundaries before shipping mainnet tooling. |
| Anonymous free compute attracts crypto-grade abuse (miners, drainers, bots) | High | Minutes-long ephemeral sandboxes, locked-down egress, aggressive teardown, account-age/credit-card gating beyond trial; abuse controls ship with every free-exposure increase. |
| Brik brand collision | Medium | Trademark/company/handle/domain diligence before public launch. |


| Gate | Evidence required |
| --- | --- |
| Alpha → Beta | Users can activate without staff help; repeated use appears; COGS understood. |
| Beta → Public | Meaningful W1 retention; successful deployments; billing works; abuse controls in place. |
| Public → Scale | W4 paid retention, positive contribution margin, repeatable acquisition channel. |
| Solana → Expansion | Solana product has clear PMF and customers request adjacent environments; expansion does not dilute core economics. |
