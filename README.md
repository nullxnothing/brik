# BRIK

**Build on Solana. From your browser.**

BRIK is a browser-native development platform for Solana: a preconfigured cloud workspace with an AI coding agent, editor, terminal, Solana tooling, previews, and deployment — from idea to a live Solana app in one tab.

## Documentation

The working source of truth lives in [`docs/`](docs/):

| File | Contents |
| --- | --- |
| [`docs/00_README.md`](docs/00_README.md) | Pack overview, strategic rule, and growth rules |
| [`docs/01_master_business_plan.md`](docs/01_master_business_plan.md) | Business plan, product strategy, go-to-market, operating plan |
| [`docs/02_product_build_spec.md`](docs/02_product_build_spec.md) | PRD, architecture, AI agent, security, 90-day roadmap |
| [`docs/03_ui_ux_brand_spec.md`](docs/03_ui_ux_brand_spec.md) | Product UX, workspace layout, landing page |
| [`docs/04_subscription_unit_economics.md`](docs/04_subscription_unit_economics.md) | Pricing, metering, COGS controls, profitability |
| [`docs/05_launch_operations.md`](docs/05_launch_operations.md) | Launch checklist, analytics, operating cadence, risks |
| [`docs/06_frontend_brand_direction.md`](docs/06_frontend_brand_direction.md) | Frontend design language and brand system |
| [`docs/07_pre_build_research_agenda.md`](docs/07_pre_build_research_agenda.md) | Pre-build research, technical spikes, and the pre-build gate |

## Repository structure

```
apps/web              Next.js app — landing page, workspace UI, and the workspace control plane
packages/sandbox      Sandbox provider abstraction (Docker baseline; managed adapters after bake-off)
packages/agent        Agent harness skeleton (vendor-neutral: tools, routing, budgets, task state)
infra/toolchain-image Pinned Solana toolchain image (Rust, Agave, Anchor, Node) with pre-warmed caches
tools/bakeoff         Provider bake-off harness — measures cold start and anchor build times
docs/                 Business, product, brand, and operations documentation
```

## Development

Requires Node 22+ and pnpm.

```sh
pnpm install
pnpm dev        # web app at localhost:3000
pnpm build      # build all packages
pnpm typecheck  # typecheck all packages
```

The workspace runs a real build in a real container, so `/workspace` needs
Docker running and the toolchain image built:

```sh
docker build -t brik/solana-toolchain:dev infra/toolchain-image
```

Opening `/workspace` then starts a container, boots its validator, and streams
`anchor build` and `anchor deploy` into the terminal panel. Containers carry a
`brik.workspace=1` label and a TTL (`BRIK_WORKSPACE_TTL_SECONDS`, default 900);
leaving the page releases one immediately.

To run the sandbox bake-off baseline:

```sh
pnpm bakeoff
```

## Strategic rule

BRIK is **not another AI editor**. The editor is the creation surface; the business is the cloud development environment and production workflow around it. Success means retained builders reaching real execution and deployment milestones at attractive contribution margin — not signups or prompts.
