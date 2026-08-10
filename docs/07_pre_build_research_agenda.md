# BRIK Pre-Build Research & Decision Agenda

What to research, document, and decide **before (or in parallel with) the first build sprint**. With AI agents doing the building, engineering is no longer the bottleneck — decisions, validation, and recruitment are. Every item here exists to prevent an expensive wrong turn that agents would only execute faster.

## 1. Customer & market (do before writing code)

### Run the discovery interviews first
The interview plan in `01_master_business_plan.md` §14 must execute **before** the build sprint, not alongside it. Twenty interviews and ten observed attempts take 2–3 weeks of scheduling regardless of build speed — start recruiting immediately. Sources: Solana Tech Discord, Anchor Discord, Colosseum forums, Solana Stack Exchange, X, university blockchain clubs, past hackathon participant lists.

**Output:** interview notes + a one-page synthesis: what actually blocks people, what they pay for, what they refuse to give up.

### Hands-on competitive teardown
Personally complete the same task — "build and deploy a working Solana app with a frontend" — in each alternative, with a stopwatch:
- Solana Playground (the incumbent default; know exactly where it ends)
- Cursor / Claude Code + local toolchain (the experienced-dev default)
- Replit with manual Solana setup
- Bolt/Lovable (not for Solana — for studying share-loop and onboarding mechanics)

**Output:** a teardown doc with measured time-to-first-devnet-transaction per alternative, failure points, and the specific moments BRIK must beat. This becomes the demo script.

### Market sizing refresh
Pull current numbers before committing spend: Electric Capital developer report (monthly active Solana devs), Colosseum participation and growth, Solana Foundation grant activity. Sanity-check the validation cohort (260 paying accounts) against real population sizes and write down the honest penetration percentage it implies.

### Design partner list
Recruit **10–20 named, committed alpha users before the core loop is built**. Not a waitlist — people who agreed to a call and a session. Alpha starts the day the loop works; recruiting after building wastes the speed advantage.

## 2. Technical spikes (days 1–5, before architecture hardens)

### Sandbox provider bake-off
Test E2B, Modal, Daytona, and Fly Machines against a decision matrix:
- Cold-start latency (target: workspace interactive in seconds)
- **Anchor build performance** — RAM/CPU available per sandbox, actual `anchor build` wall time
- Persistent volume support and cost
- Egress policy control (must support lockdown for anonymous tiers)
- Per-session pricing at anonymous-trial scale
- Port forwarding / preview URL support

**Output:** decision record with measured numbers, chosen provider, exit strategy.

### Rust/Anchor build-time budget
The single biggest technical threat to "P95 under 5 minutes" is Rust compilation: a cold `anchor build` can take several minutes and several GB of RAM. Spike the mitigation stack before committing to the activation target:
- Pre-warmed template workspaces with pre-compiled dependency caches
- sccache / shared cargo registry and target-dir strategies
- Prebuilt program binaries for the guided first-run path (user's first tx should not wait on a cold compile)

**Output:** measured cold/warm build times per mitigation; a stated build-time budget for the magic-moment path.

### RPC and faucet strategy — **decided: the dev loop runs on a local validator**
This question is closed for the first-run path. The magic moment does not touch devnet at all.

Each workspace runs its own `solana-test-validator`. SOL is unlimited and instant, there is no
faucet to rate-limit, and the whole loop works with egress switched off, which is what the
anonymous tier already requires. Measured in the toolchain image (Agave 2.1.21):

| Measurement | Result |
| --- | --- |
| Validator ready, `--network none` | 2–3 seconds |
| Airdrop 1000 SOL, offline | Instant |
| Programs in genesis | System, SPL Token, Token-2022, associated token account, Memo v3 |
| Programs that must be baked in | Metaplex Token Metadata only |

Public faucets were rejected as a funnel step, not just as a rate-limit risk.
`faucet.solana.com` allows 2 requests per 8 hours, needs a GitHub sign-in with account
validation for a higher limit, and tells automated clients not to use it. Sending an anonymous
visitor there replaces our signup gate with GitHub's at the exact moment of first success, and
still hands out less than the 2–4 SOL an upgradeable Anchor program needs for deploy rent.
It stays in the docs as a top-up link for people funding their own wallet.

Still open, and now much smaller:
- **Devnet treasury sizing.** Real devnet remains the shareable, forkable deploy target. Because
  ephemeral workspaces are destroyed within minutes and `solana program close` reclaims deploy
  rent, the treasury is a revolving float sized to *concurrent* deploys, not cumulative users.
  Measure the real number during alpha; seed it with `devnet-pow` and a Foundation ask.
- **RPC provider selection** (Helius, Triton, QuickNode) for the devnet deploy and inspection
  path only. The dev loop no longer depends on it.
- **Devnet degradation** is no longer a demo-killer: a degraded devnet delays sharing, it does
  not block anyone's first success.

### Agent harness and Solana AI quality
- Decide harness: Claude Agent SDK vs custom loop; document model routing tiers and measured cost per task type
- **Build the eval set before the agent**: 20–30 canonical Solana tasks (init program, add instruction, fix common Anchor errors, wallet integration, token mint, transaction debugging) with pass/fail criteria. This is the agent's test suite and the quality bar for launch
- LLM knowledge of Anchor is frequently stale (breaking version churn). Spike: curated up-to-date Anchor/Solana docs as retrieval context, pinned toolchain versions in templates, and measure eval improvement

### Shareable preview hosting design
Previews are user-generated content on BRIK's domain:
- Subdomain-per-project isolation, CSP, no cookies shared with the app domain
- **Phishing/drainer risk is existential**: a hosted wallet-drainer on BRIK's domain kills trust and gets domains blocklisted. Design scanning, reporting, takedown, and rate limits before the share loop ships

## 3. Security & trust (documents before code)

- **Workspace threat model** — written and reviewed before the first sandbox ships. Sandbox security is the one area that cannot be vibe-coded; human review required on the isolation boundary, secrets handling, and egress policy.
- **Key custody design doc** — devnet keys may be BRIK-managed (throwaway); state the invariant now that **BRIK never holds user mainnet keys or funds**, and design mainnet flows (user wallet signs, BRIK never custodies) to preserve it.
- **Abuse playbook** — miners, drainer builders, bot farms: detection signals, rate limits, gating ladder (anonymous → account-age/credit-card → paid), takedown process, and who is on call.

## 4. Legal & compliance

- Entity formation and jurisdiction (before revenue, ideally before alpha data collection).
- ToS, Privacy Policy, AUP — with crypto-specific clauses: prohibited use (drainers, scams), hosted-content liability, sanctions/OFAC screening posture.
- **Money-transmission review**: if BRIK ever funds mainnet deploy rent or touches user SOL, get a legal opinion first. The current design (devnet-only, user wallet signs mainnet) should be structured to stay clearly outside money-transmission scope.
- Trademark and naming diligence for BRIK and the chosen domain — before public launch, per existing checklist.

## 5. Business & finance

- **COGS model spreadsheet before setting free-tier limits**: per-session cost (sandbox + AI + RPC) for anonymous trials, per-month cost for activated free users, margin per paid tier under realistic usage. The $2–$5 planning ceiling gets replaced with measured numbers during alpha.
- **Grant and accelerator applications**: Solana Foundation grants and Colosseum accelerator — application windows, requirements, typical amounts. Non-dilutive money and the strongest possible ecosystem endorsement; start applications now, cycles are slow.
- Pricing research inside the discovery interviews: what target users pay for today (Cursor, Claude, RPC, hosting) and where $25/$79 sits against that stack.
- Runway math: monthly burn with AI-agent development (API costs replace some salary costs), months to the decision gate, and the spend cap for the whole validation.

## 6. Product definition

- **Hero template mini-spec**: the single most important product decision. Candidates (payments checkout, token-gated site, NFT mint page, tip jar) scored on: visual impact in a share card, buildable end-to-end in one session, demonstrates what Solana Playground can't (full app: program + frontend + wallet), and genuinely useful output. Pick one; everything else waits.
- **Analytics stack decision** (e.g. PostHog vs alternatives) and the event taxonomy from `05_launch_operations.md` wired in from day one — the decision gate is unreadable without it.
- **Reuse audit of existing (Daemon) technology** with an honest rule: each component is reused because it's good, not because it exists.

## 7. Pre-build gate

Do not start the core-loop build sprint until:

| # | Item | Evidence |
| --- | --- | --- |
| 1 | 10+ discovery interviews done | Synthesis doc exists |
| 2 | Sandbox provider chosen | Bake-off decision record with measured numbers |
| 3 | Build-time budget validated | Warm-path first-tx flow measured under target |
| 4 | Hero template chosen | Mini-spec approved |
| 5 | Threat model + abuse playbook drafted | Reviewed by a human |
| 6 | Design partners committed | 10+ named alpha users scheduled |
| 7 | COGS spreadsheet v1 | Per-session and per-user cost estimates |

Items 1 and 6 run on calendar time — start them **today**; the technical spikes (2–3) fit in the first week with agents doing the work.
