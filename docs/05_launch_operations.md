# BRICK Launch & Operations

## Launch checklist

### Product
- Core create/import → agent → build/test → preview → devnet flow works.
- Workspace startup and failure recovery are reliable.
- Git import/export works.
- Plan limits and metering work.
- Mainnet actions have explicit controls.

### Security
- Workspace threat model complete.
- Secrets design reviewed.
- Resource/network limits enforced.
- Abuse monitoring and rate limits active.
- Incident response and credential rotation documented.
- Backup/restore tested where applicable.

### Business/legal
- BRICK/company/domain/trademark collision diligence.
- Terms of Service.
- Privacy Policy.
- Acceptable Use Policy.
- Billing/refund policy.
- Support process.
- Vendor cost model.

### Marketing
- Landing page (outcome-led hero, no-signup CTA, gallery strip).
- One excellent demo: 2–3 minute video of idea → working app → devnet transaction.
- 3-5 launch templates.
- Shareable preview + share card + fork flow live.
- Documentation.
- Open in Brick flow, with placement outreach to official Solana docs, Anchor tutorials, and ecosystem repos underway.
- First hackathon partnership and credit program committed.
- Analytics.
- Status page.
- Onboarding emails.

## Channel priority
1. **Hackathons** (Colosseum, Solana Foundation, university clubs) — the spine of the first six months: hackathon mode, credits, presence at every major event. Pursue Solana Foundation early as partner and grant source.
2. **Official docs and ecosystem repos** — "Open in Brick" on pages we don't own where intent already exists.
3. **Share/fork loop** — every deployed project is a live URL that advertises the product.
4. **Tutorials/SEO** — interactive "learn Solana by shipping" pages targeting concrete searches.
5. **Founder-led launch on X** — live demos, weekly public build updates, user project showcases. For the first thousand users this is the primary channel.
6. **MCP/CLI** inside Cursor/Claude Code — acquisition of experienced developers who keep their editor.

## Analytics

### North star
Weekly projects reaching a successful execution milestone.

### Funnel
Visitor → anonymous workspace ready → successful run → Solana milestone → signup (save) → W1 return → deployment → shared/forked → paid → W4 retention.

Track **P95 time from landing to first successful devnet transaction** (target: under 5 minutes) as the primary activation metric, and share-loop performance (shares, forks per share, signups attributed to shared projects).

### Core events
landing_view, anon_sandbox_started, anon_sandbox_expired, signup_completed, project_created, github_import_completed, workspace_ready/failed, template_selected, agent_task_completed/failed, build_succeeded/failed, preview_opened, share_link_created, share_link_visited, project_forked, tutorial_started/completed, open_in_brick_clicked, hackathon_credit_redeemed, solana_tx_succeeded/failed, devnet_deploy_succeeded/failed, mainnet_deploy_succeeded/failed, workspace_resumed, checkout_completed, usage_limit_hit, project_exported.

### Economics dashboard
AI cost/task, compute cost/hour, free-user COGS, paid-user COGS, gross margin, ARPU, expansion, churn.

### Reliability dashboard
Workspace startup P50/P95, provisioning failure, build success, tool failure, deploy failure, task latency.

## Operating cadence

### Daily during alpha
Review provisioning failures, failed builds/deployments, high-cost agent runs, and direct user feedback.

### Weekly operating review
1. Activation.
2. W1/W4 retention.
3. Successful projects/deployments.
4. Paid conversion/MRR.
5. COGS and gross margin.
6. Reliability.
7. Top customer pain.
8. One or two priorities for next week.

### Monthly strategy review
Review ICP, pricing, channel performance, infrastructure vendors, roadmap, runway, and whether evidence supports expansion.

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Retained Solana market too small | High | Target web developers too; validate before scaling; preserve expansion path. |
| AI/compute COGS too high | High | Quotas, hibernation, routing, caching, usage billing. |
| General agents add similar features | High | Own Solana execution/deployment depth and interoperate. |
| Users love demos but do not return | High | W1/W4 retention and deployments drive decisions. |
| Sandbox abuse/security | High | Isolation, network/resource controls, secrets boundary, abuse monitoring. |
| Mainnet risk | High | Simulation, explicit approvals, wallet separation, audit events. |
| Solana demand is cyclical | High | Minimal burn; hackathon/education channels persist through cycles; preserve expansion path. |
| Mainnet deploy economics (rent costs real SOL) | Medium | Devnet-only until funding/billing/custody design is complete. |
| Anonymous sandboxes attract crypto-grade abuse | High | Short TTL, egress lockdown, rate limits, account gating beyond trial; abuse controls ship with the feature. |
| BRICK brand collision | Medium | Trademark/company/handle/domain diligence before public launch. |

## Management rule
Do not materially scale hiring or paid acquisition until a paid cohort shows retention and positive contribution margin.
