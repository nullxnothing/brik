# Session prompts

One slice per session. Copy a whole block in as the opening message.

They are in dependency order, but only slices 2 and 3 are strictly ordered
against each other: nothing can be deployed until workspace leases survive a
process restart. Slice 0 is minutes of work and is worth doing before anything.

Every prompt front-loads facts that were measured rather than assumed. They are
there so the session does not spend its budget re-deriving them. `STATE.md` is
the longer version and is kept current; `TASKS.md` is the ledger.

Common to all of them:

- Repo `C:\Users\offic\Projects\brik`, pnpm monorepo, branch
  `claude/brick-project-review-dn5i7x`.
- `pnpm typecheck` and `pnpm build` must pass before a slice is done.
- `pnpm dev` then `pnpm verify-templates` proves the workspace still works;
  `pnpm verify-agent` proves the agent loop still works. Both must stay green.
- Docker Desktop must be running for anything that touches a workspace.
- Never weaken the honesty rule: the UI may not claim a capability that does not
  exist. There is an honest "not connected" path in the composer to follow.

---

## Slice 0 — take the fabricated demo off the internet

`/workspace` is publicly reachable at www.brik.builders and serves the old
scripted demo, including a hardcoded program id
(`7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`) and a fake "Deploy success".
The landing CTAs are gated as "Coming soon"; the route is not.

**Outcome:** a visitor who types the URL cannot reach a fabricated run.

**Acceptance test:** `curl -sL https://www.brik.builders/workspace` no longer
returns a page containing that program id.

Pick whichever is smaller: block the route at the routing layer, or ship the
real workspace behind an env flag that is off in production. Do not delete the
route from the repo — it is the product.

Nothing in this slice touches the workspace, the agent, or the toolchain image.

---

## Slice 1 — connect the agent to the composer

Everything needed exists and is verified. Nothing calls it.

**Outcome:** typing a request into the composer makes the agent do it in the
workspace, with its steps and command output streaming into the panels that
already render them.

**Acceptance test:** open `/workspace`, type "add a withdraw instruction and
build it", and watch real tool steps and real `anchor build` output arrive. The
file in the editor changes because the container's copy changed. Asking for
something impossible ends in an honest failure, not a fabricated success.

**Verified, do not re-derive:**

- `packages/agent` has the loop, four sandbox tools, risk classification, and
  the Anthropic provider. `pnpm verify-agent` runs it against a real container
  with a scripted model (12 checks); `--live` runs it against Claude Opus 5
  (7 checks). Both pass.
- `ANTHROPIC_API_KEY` is already in `apps/web/.env.local`.
- The loop emits `TaskStep`; the run emits `RunEvent` (`apps/web/lib/workspace/
  events.ts`). This slice is mostly a mapping between two shapes that exist.
- `runAgent` takes `onStep` and `onText` callbacks and an `AbortSignal`.
- The workspace run already streams NDJSON over `POST /api/workspace/run` and
  the client already folds events into `RunState`. Reuse that transport.

**Scope guardrails:** no auth, no persistence, no approval UI, no diff review
screen. A tool that writes or runs a command is already classified `write` risk
by `requiresApproval()` — wiring an approval prompt is its own slice.

**Things that will bite you:**

- The composer currently declines every message via `NOT_CONNECTED` in
  `workspace-shell.tsx`. That copy has to go when the capability becomes real,
  and not before.
- An agent turn can run minutes. The existing run holds one HTTP stream open;
  decide whether the agent shares it or gets its own, and make aborting work
  either way — a client that disconnects must not leave the container running.
- The agent edits `/workspace/project` in place. After it writes, the editor
  should show what is actually on disk, read back from the container, the way
  `sendProject` already does.
- Model constraints are real 400s, not style: no `temperature`/`top_p`/`top_k`,
  no `budget_tokens`, and `effort` errors on Haiku. `packages/agent/src/
  anthropic.ts` already handles all three — do not "simplify" it.

---

## Slice 2 — a lease store that survives a restart

This is the deployment blocker. `apps/web/lib/workspace/registry.ts` keeps
leases in a module-level `Map` on `globalThis`.

**Outcome:** workspace leases outlive the process that created them, so the
control plane can run somewhere with more than one instance.

**Acceptance test:** start a workspace, restart the server, and the workspace is
still tracked — reachable, still counted against the cap, still swept at its
TTL. Kill the server mid-run and no container is orphaned.

**Verified, do not re-derive:**

- On serverless every request gets a different instance, so today the registry,
  the 30s sweeper, the concurrency cap, and the "reuse a warm workspace on
  redeploy" path all silently stop working.
- Four cleanup mechanisms exist and are verified (STATE.md): client disconnect,
  page-leave DELETE, failed-run discard, and TTL. Only the last survives losing
  the process. Whatever store is chosen has to keep the other three working.
- Containers carry a `brik.workspace=1` label, and `reapExitedWorkspaces()`
  sweeps non-running ones. That is Docker-only and already gated on
  `provider.name === "docker"`.

**Scope guardrails:** this is a lease store, not a product database. No user
records, no projects, no billing tables. A single table or key-value namespace
keyed by workspace id is the whole slice.

**Things that will bite you:**

- Picking a database is a material decision — get it agreed before building.
  Per the repo's own defaults that likely means hosted Postgres with Prisma, or
  Redis if the only need is leases with a TTL.
- The concurrency cap claims a slot before the first `await`. Whatever replaces
  it needs the same property across instances, which an in-process counter
  cannot give — this is the part most likely to be got subtly wrong.
- A lease pointing at a sandbox that has already died must read as absent, not
  as a usable workspace.

---

## Slice 3 — deploy the control plane

**Outcome:** the workspace runs for a visitor who is not you, on infrastructure
that is not your laptop.

**Acceptance test:** from a machine with no Docker and no repo checkout, open
the deployed URL, start a workspace, and watch a real build and deploy stream
back. Close the tab and confirm the sandbox is released.

**Verified, do not re-derive:**

- **Vercel cannot run the Docker provider.** No Docker daemon, and no config
  changes that. Function duration is not the problem: App Router supports
  `maxDuration` up to 1800s.
- E2B is chosen and proven. The toolchain image is published as the template
  `brik-solana-toolchain`; `pnpm publish-template` rebuilds it (~5 min with
  E2B's layer cache). All four templates pass through the real HTTP route on
  E2B in 39–41s each.
- The control plane already picks its provider from config: E2B when
  `E2B_API_KEY` and `E2B_TEMPLATE` are both set, Docker otherwise.
- `E2B_API_KEY` is in `apps/web/.env.local` and is **not** in Vercel.

**Scope guardrails:** deploy what exists. Do not add features to make the deploy
look better.

**Things that will bite you:**

- Slice 2 must land first or leases evaporate between requests.
- **Cost.** Every anonymous visitor starts a sandbox. Without limits that is
  unbounded spend against the E2B account, exposed to the internet. Do not
  deploy an ungated workspace route — either keep it gated or land slice 4
  first. This is the one that turns a bug into a bill.
- E2B's free tier caps sandbox disk at 10GB; the image is 6.11GB extracted.
- Running `pnpm build` while a dev server is running clobbers `.next` and the
  dev server starts returning 500s.

---

## Slice 4 — anonymous limits and abuse controls

`docs/02` is explicit that these ship in the same release as the anonymous flow,
not after it.

**Outcome:** a stranger cannot exhaust the sandbox budget.

**Acceptance test:** hammer the run endpoint from one address and get turned
away with an honest message rather than N sandboxes. The limit survives a
process restart, and a legitimate visitor is never blocked by someone else's
abuse.

**Verified, do not re-derive:**

- `BRIK_MAX_WORKSPACES` (default 4) is a **host capacity limit, not a per-visitor
  quota**, and it is per-process. Verified: six concurrent requests against a
  cap of two peak at exactly two containers. It is not an abuse control.
- Workspaces already run with egress off, which removes a whole class of abuse:
  a sandbox cannot reach the network at all.
- `CapacityError` already exists and the route already turns it into a plain
  sentence rather than a stack trace. Follow that pattern.

**Scope guardrails:** rate limiting and quotas only. Accounts are slice 5.

**Things that will bite you:**

- Per-IP limits and serverless do not mix without a shared store — this depends
  on slice 2.
- Decide where the limit lives: platform firewall rules are cheaper to run than
  application middleware but harder to make honest in the UI.

---

## Slice 5 — accounts and saved projects

**Outcome:** signup converts an ephemeral workspace into something that is still
there tomorrow. Per `PRODUCT.md`, signup gates saving and never the first
success.

**Acceptance test:** run a workspace anonymously, sign up, close the tab, come
back, and the project is there with its source. Doing the same without signing
up loses it, and the UI said it would.

**Scope guardrails:** auth and project persistence. Not billing, not teams, not
sharing.

**Things that will bite you:**

- The anonymous-first rule is a product invariant, not a nice-to-have. Anything
  that makes a visitor sign up before their first successful build breaks the
  stated activation target.
- A saved project needs its source stored somewhere durable. The workspace's
  filesystem is not that — sandboxes are ephemeral by design.

---

## Slice 6 — devnet deploy, preview URLs, fork

The growth loop, and what the Preview pane is waiting on. `docs/02` calls it
MVP scope rather than polish.

**Outcome:** a deployed program on real devnet, at a URL someone else can open,
with a Fork button that clones it into the visitor's own workspace.

**Acceptance test:** deploy from the workspace to devnet, open the resulting URL
in a different browser, and fork it into a fresh workspace that builds.

**Verified, do not re-derive:**

- Everything currently deploys to the workspace's own validator, which is
  instant, free, and needs no faucet. Devnet is a different thing.
- A program deploy costs ~1.27 SOL of rent. On devnet that has to come from
  somewhere; `docs/07` records the treasury question as open and it is still
  open.
- The Preview pane already renders an honest "no preview URL yet" state naming
  what it is waiting for. That copy comes out when this lands.

**Things that will bite you:**

- This is the slice that spends real money, even if devnet SOL is nominally
  free. Rate-limited faucets and a shared treasury are both failure modes.
- A public preview URL is untrusted input reaching your infrastructure. Decide
  what it serves before building it.

---

## Slice 7 — GitHub import

`/new` accepts a repository URL and the workspace ignores it.

**Outcome:** an imported repository is what the workspace opens.

**Acceptance test:** paste a small public Anchor repo at `/new` and watch the
workspace build that code rather than a template.

**Things that will bite you:**

- **A workspace has no egress**, so it cannot clone anything. The clone has to
  happen somewhere with network access and arrive as files, or the egress policy
  has to change for imports — which is a security decision, not a config tweak.
- An imported project will not match the pre-built `/workspace/project`, so it
  gets a cold ~40s build rather than ~3s. That is expected; do not try to make
  arbitrary repos warm.

---

## Not blocking, worth doing when there is a reason

- **Shrink the image further.** 6.11GB extracted today, down from 7.65GB. What
  is left is riskier: ~600MB of Agave perf-libs, ledger-tool, and unused
  platform-tools triples, and ~690MB of rustup docs that only a minimal profile
  or a flatten stage reaches.
- **Close the E2B first-build gap.** 13.2s after a template overlay against 2.2s
  on Docker, because a snapshot hydrates its filesystem lazily and the 825MB
  target directory is read cold. Only matters if activation time becomes the
  constraint.
- **Swap the validator to Agave 3.0.14** to drop `seccomp=unconfined` from the
  Docker path. Verified working (STATE.md), and demoted to insurance because E2B
  runs the 3.1.9 validator unmodified. Costs feature-set fidelity against devnet.
- **Tests for templates that need `node_modules` beyond what the image carries.**
  The image ships `@coral-xyz/anchor`, `@solana/spl-token`, chai, mocha,
  ts-mocha. Anything else is an image change, not a template change.
