# STATE

Last verified 2026-08-10 on branch `claude/brick-project-review-dn5i7x`.

## Social launch library

Added 2026-08-31 from the live site and current repository state: `tweets.md`
contains 15 claim-checked X posts, each paired with an exact 1200 × 675 card in
`social/image-cards/`. Five text-free plates were generated with OpenAI; live
Brik UI captures, official mark geometry, product tokens, and deterministic
HTML/SVG supply the rest. The renderer and dimension verifier pass all 15.

The library explicitly holds the current boundary: no public devnet deploy,
preview URL, persistence, GitHub import/push, billing, or mainnet claim. Recheck
toolchain versions and the 39 to 41 second E2B measurement before publishing
those two posts.

## What runs

**The workspace runs a real template in a real container.** Opening `/workspace`
posts to the control plane, which starts a container from the toolchain image,
boots its own validator, writes the chosen template in, builds it, deploys it,
and runs its test suite, streaming every line of stdout and stderr back into the
terminal panel as it is produced. The program id, deploy signature, wallet
address, SOL balance, and test results on screen are read out of that container.

**Four templates, all real Anchor programs.** Verified together by
`pnpm verify-templates`, which drives the same HTTP route the browser does and
runs each one **twice against the same workspace** — the request Redeploy
makes. That second run is what catches a suite whose accounts collide with the
ones the first run left behind, which a checker that gives every template a
fresh sandbox cannot see. Confirmed against the old tip jar: *"passed once, then
failed on a redeploy into the same workspace"*.

| Template | Program | End to end | Tests |
| --- | --- | --- | --- |
| Tip jar | PDA jar, SOL transfer CPI, withdraw above rent | 11.7s | 4 passing |
| NFT mint | Capped collection, Metaplex metadata + master edition | 12.0s | 2 passing |
| Token gate | SPL balance proof, access pass with the verified slot | 14.2s | 3 passing |
| USDC checkout | Order account as receipt, SPL transfer, no double charge | 13.8s | 3 passing |

Step timings inside a run:

| Step | Time |
| --- | --- |
| `docker run` | ~0.4s |
| `brik-localnet start` (validator up, wallet funded 1000 SOL) | ~1.9s |
| `anchor build` (template overlaid in place at `/workspace/project`) | ~3s |
| `anchor deploy` to the workspace validator | ~4.3s |
| `anchor test --skip-build --skip-deploy` | 0.5s to 4s |
| Deploy rent | 1.266 SOL |

**The workspace is open to the internet.** Anyone can open
https://www.brik.builders, press Start building, and get a real Anchor project
built, deployed, and tested in an E2B sandbox, then ask an agent to change it.
No Docker, no signup, no checkout. Earlier the same day `/workspace` served the
old scripted demo with a hardcoded program id; it was closed, then opened for
real.

Verified on the live site, not locally:

- Tip jar reached `DEPLOYED` with all five run steps green.
- "add a `ping` instruction that logs pong, then build it and confirm it is in
  the IDL" — the agent read the project, wrote `lib.rs`, built, checked the
  generated IDL, wrote a test, and deployed. `fn ping` and `pong` were in the
  editor afterwards because they were on the sandbox's disk, and `tests/ping.ts`
  appeared in the file list.
- **It reported a failure it did not cause.** The run ended `4 passing, 2
  failing`, and the agent traced both to the template suite not being
  idempotent rather than to its own change, then proved it by running that suite
  alone. See the known limit below.
- Leaving the page released the sandbox: E2B's own API reported zero running
  sandboxes six seconds later.

The page's CTAs point at `/new` and the disabled "Coming soon" button is gone
from the nav, the hero, and the closing band.

The switch is `isWorkspaceOpen()` in `apps/web/lib/workspace/gate.ts`: open in
development, closed in production unless `BRIK_WORKSPACE_ENABLED` is `1`, so a
deployment that loses its environment fails shut. It resolves at two different
times, which is worth knowing before the route is opened again. The pages carry
it into the build, because `notFound()` runs before anything dynamic and
`next build` prerenders both as static 404s; the API routes read it per request.
Measured against `next start` with the flag set: `DELETE /api/workspace/{id}`
answered 200 while `/workspace` still answered 404. Opening the pages is a
rebuild, not a variable.

**The toolchain image** `brik/solana-toolchain:dev` is built and verified:
Agave 3.1.9, Anchor 0.31.1, Rust 1.85.0, Node 22. **6.11GB extracted**, 8.93GB
as Docker reports it, down from 7.65GB / 10.1GB. That matters because a sandbox
provider's disk quota measures the extracted size, and E2B's free tier caps it
at 10GB, so the image now fits the tier that can answer the provider question
without a $150/mo commitment.

## What is deployed

`www.brik.builders` serves `dpl_69vUabBp1dfnMy2AJbrR3fFJRFva`, built from
`4fd7893` on 2026-08-11. The apex 308s to www and resolves to the same
deployment. Production carries five environment variables:

| | Why |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute Open Graph image URLs |
| `BRIK_WORKSPACE_ENABLED=1` | Opens `/workspace`, `/new`, and the API routes |
| `E2B_TEMPLATE=brik-solana-toolchain` | Which sandbox to start |
| `E2B_API_KEY` | Vercel has no Docker daemon, so this is the only provider |
| `ANTHROPIC_API_KEY` | The agent. Without it the composer says so and stops |
| `BRIK_AGENT_CENTS_PER_HOUR` | What one visitor's agent may spend in an hour |
| `CRON_SECRET` | Gates the reaper. Vercel stores it write-only |

Closing it again is `BRIK_WORKSPACE_ENABLED=0` and a redeploy. Both parts are
needed: the page gate resolves at build time, so the variable alone changes
nothing. A closed route renders `app/not-found.tsx` in the site's own type and
reports its title as "Not found".

`maxDuration` is 300s on the run route and 800s on the agent route. The platform
default cuts a function off well before either is done: a run is 39 to 41s on
E2B, and the two agent turns measured in a browser took 3 and 7 minutes.

**Every number on the landing page is measured, so changing what it describes
changes the page.** The hero animation is a tip-jar run at the step timings
above, the toolchain card is read out of `brik/solana-toolchain:dev` (rustc
1.85.0, solana-cli 3.1.9, anchor-cli 0.31.1, node 22.23.2), and the validator
card is `brik-localnet` funding a wallet in 1.9s. The fabricated program id is
gone from the site entirely: `7xKX` appears zero times across `/`, `/workspace`,
`/new`, and `/brand`. Rebuilding the image moves the four versions.

The landing hero is now product-led rather than split into two constrained columns. Copy and actions
share a shallow masthead with measured run telemetry, removing the dead upper-right quadrant before
both lead into the animated workspace proof. The frame renders at 1,368px on a 1440px viewport and
1,664px at large desktop widths, and extends below the opening viewport while its agent checklist
exposes the read → write → build → test → deploy path. The following proof and workflow bands now
retain the landing width: environment facts run as one connected Localnet → Toolchain → Agent system,
and the workflow is one full-width return rail instead of a split composition. At 390px the editor,
agent steps, terminal, deployment state, autonomous run, and workflow stack at readable size with no
desktop shrink. Verified locally in Chromium at 390×844, 1440×900, and 2048×1152 with no horizontal
overflow or console errors; typecheck, the Impeccable detector, and the production build pass. This
change is not deployed.

The environment section is now an autonomous 7.9s GSAP product demonstration rather than a static
feature table. It begins with workspace creation, sends one activity signal through Localnet,
Toolchain, and Agent, resolves the measured versions, exposes `expected u64, found u32`, changes the
value, retries, and lands on `Build passed`. The completed state holds for four seconds before replay;
hover pauses, the replay control resets the run, offscreen work pauses, and reduced motion renders the
completed state immediately. The four explanatory columns were removed. Verified in Chromium at
1440px and 390px with no horizontal overflow; deployment pending.

The landing workflow is now a scroll-controlled workspace run instead of a static rail. Write, Test,
Build, and Deploy each expose queued, running, failed, verified, and completed states as applicable;
the evidence strip moves from the compiler failure through the file retry to passing tests and deploy
success. The old oversized dashed return path is gone. Large screens also show a restrained five-stop
run meter for page position, while reduced-motion users receive the complete verified state without
the sequence. Verified at 390×844 and 1440×900 with no horizontal overflow or console errors. The
Impeccable detector, typecheck, and production build pass. Brik is running locally on port 3001 because
port 3000 is currently occupied by another local project. This change is not deployed.

The landing masthead, navbar, and workspace now share one 1760px frame. At 1440px they align at
x=36px; the desktop masthead is exactly 55% copy, 10% gap, and 35% telemetry. The headline starts at
y=97px with 0.98 line-height, followed by measured 24px, 28px, and 48px intervals through copy,
actions, and workspace. The workflow completes while its full 310px sequence remains visible, and
desktop state labels no longer intersect the rail. `/new` reuses the landing halftone field without
the spotlight. Start-building arrows were removed, buttons gained bounded hover/press feedback, the
footer credit now links to `@brikbuilders`, and a dormant lowercase `$brik` nav tab appears at medium
widths and above. Verified locally; not deployed.

Deploying is `vercel deploy --prod` from the repo root, and it has to be the
repo root. The Vercel project's Root Directory is `apps/web`, set on 2026-08-11,
because the CLI link used to sit in `apps/web` and a deploy from there uploaded
that directory alone, where `npm install` cannot resolve
`"@brik/sandbox": "workspace:*"`. Measured: that deploy failed at install. With
the root directory set and the link moved to the repo root, pnpm installs all
eight workspace projects and Next builds `apps/web` in 31s. Setting `framework`
and `outputDirectory` in a repo-root `vercel.json` instead does not work — the
Next builder wants the app at the root directory and says so.

## The constraint that shapes templates

A workspace runs with egress off, so it **cannot fetch a crate or an npm package
at runtime**. Verified: cargo fails to resolve `index.crates.io`. A template may
therefore only use what the image already compiled, and adding a dependency is
an image change, not a template change.

The image now carries the union: `anchor-lang` with `init-if-needed`,
`anchor-spl` with `metadata`, and for suites `@coral-xyz/anchor`,
`@solana/spl-token`, `chai`, `mocha`. Three details cost real time to find:

- `anchor-spl` also has to join the `idl-build` feature. Without it the SBF
  build succeeds and IDL generation fails on the anchor_spl account types.
- `debug = false` on the dev profile. `anchor build` compiles the test profile
  to generate the IDL, and its debug symbols were 1.7GB of a 2.0GB target
  directory. Dropping them gives 891MB, so adding anchor-spl cost 80MB net.
- Every image build generates a fresh program keypair, so a template's
  `declare_id!` goes stale on rebuild. The program still builds and deploys, and
  every test then fails against a program that is demonstrably there. The run
  calls `anchor keys sync` after writing the template, which is why the source
  shown in the editor is read back from the container afterwards.

## The agent is wired to the composer

Typing into the composer runs the agent against the workspace on screen. Its
steps arrive in the agent panel and its command output in the terminal, both
live, over the same NDJSON protocol a run uses. `POST /api/workspace/agent`
takes `{ workspaceId, message }`; it never allocates or destroys a workspace,
because the page already holds that lease and an agent failing leaves a
perfectly good container behind.

Driven in a browser against a real container on 2026-08-11:

- **A real change.** "add a set_owner instruction that transfers the jar to a
  new owner, and build it" — the agent read the program, noticed that
  overwriting `jar.owner` would break the PDA seeds and brick the jar, split
  `creator` from `owner` instead, wrote `lib.rs`, built it, and read the
  generated IDL to confirm `set_owner` was dispatchable. It then found the
  leftover jar account from the earlier run had the old 57-byte layout, rewrote
  the suite to use a fresh keypair, redeployed, and ran the tests. Its summary
  listed what it changed beyond the ask and corrected one of its own wrong
  assumptions. Verified independently with `docker exec`: `set_owner`,
  `creator`, and `OwnerChanged` are in the container's copy of `lib.rs`, which
  is what the editor was showing.
- **An impossible one.** "add the reqwest crate ... and fetch example.com
  inside the program" ended in a refusal backed by evidence rather than a
  fabricated success: offline resolution dead-ended on yanked and uncached
  crates, then a `std::net` probe compiled but failed at runtime with
  `custom program error: 0x1776`, because the SBF VM has no socket syscalls. It
  restored the project, rebuilt, redeployed, and left all 12 tests passing.

Two bugs were found by driving it rather than by reading it, both fixed. Step
ids restarted per turn, so a second turn's steps overwrote the first turn's
instead of appending; ids now carry a per-turn prefix. And the final summary was
sent again as a note when the turn ended by talking, so the agent appeared to
say the same thing twice.

The panel now distinguishes a failed step from a finished one. A step event may
carry an `id` and a `state`, which is what lets a running step become one that
succeeded or failed; without that a failed command still rendered with a tick.

`packages/agent` is a bounded tool-calling loop over four tools that act on the
sandbox: list, read, write, and run a command. The vendor sits behind a
`ModelProvider`, so the mechanics can be checked without a key.

- `pnpm verify-agent` runs it against a real container with a **scripted**
  model. Twelve checks, including that the Rust the agent wrote is on disk in
  the container, that `anchor` compiled it, and that history never leaves a
  `tool_result` without its `tool_use`.
- `pnpm verify-agent --live` swaps in a real model. Claude Opus 5 took "add a
  ping instruction and build it", made the edit in the existing code's style,
  built it, and then read the generated IDL to confirm `ping` was dispatchable
  rather than merely compiling. Six tool calls, seven checks.

Both still pass. The loop gained one thing for this: an optional `onOutput`,
which tees a command's raw output to a caller with a terminal to show. It is a
tee and not the evidence — what the model sees is still the `ExecResult` the
command returned, so nothing about it changes what a step may claim.

**There is no approval step.** `requiresApproval()` classifies write and run as
needing one and nothing asks. Anything the agent decides to do, it does, inside
a container with no egress and a TTL.

## What does not exist

No auth, database, or persistence. No preview URLs, no devnet deploy, no
billing, no GitHub import.

## How the control plane works

Three modules under `apps/web`, no new service:

- `lib/workspace/registry.ts` — in-process workspace leases, a 30s sweeper, and
  an orphan reaper. Server only.
- `lib/workspace/run.ts` — the run sequence. Every line the UI shows originates
  here and came out of the container.
- `lib/workspace/agent.ts` — one agent turn, translated into run events.
- `app/api/workspace/run` (POST, streams newline-delimited JSON),
  `app/api/workspace/agent` (POST, the same protocol for one turn), and
  `app/api/workspace/[id]` (DELETE).

`RunState` is still a reduction over an event stream; the events are now real
(`app/workspace/run-state.ts`). `packages/sandbox` gained an `AbortSignal` on
`ExecOptions`, a `brik.workspace=1` label on every container, and
`reapExitedWorkspaces()`.

## Container lifecycle, verified

Four independent mechanisms, each observed:

1. **Client disconnect** aborts the in-flight exec and destroys the container.
   Verified by killing the HTTP client mid-build: container gone within seconds.
2. **Leaving the page** sends a DELETE. Verified by navigating away: the
   container was destroyed immediately. Note that an abrupt tab kill can skip
   `pagehide`; the TTL below is what bounds that case.
3. **A failed run** destroys its own workspace, because the container is dead or
   in an unknown state. Verified by `docker kill` mid-build and mid-deploy: the
   UI showed the partial real output and then the failure, and no container was
   left behind.
4. **TTL.** The container's own `sleep` expires and it exits; the sweeper then
   removes it. Verified with a 60s TTL and no client action: exited at t+60s,
   removed by t+90s. Default 900s.

After every test above, `docker ps -a --filter label=brik.workspace=1` was empty.

## What a visitor is allowed to spend

Three counts live in Upstash Redis (`upstash-kv-byzantine-mirror`, provisioned
through Vercel's marketplace), so they hold across function instances and
survive a restart:

| Limit | Default | Scope |
| --- | --- | --- |
| `BRIK_MAX_WORKSPACES` | 4 | Live workspaces, whole deployment |
| `BRIK_RUNS_PER_HOUR` | 5 | Workspace starts, per visitor |
| `BRIK_MESSAGES_PER_HOUR` | 30 | Agent requests, per visitor. A flood guard |
| `BRIK_AGENT_CENTS_PER_HOUR` | 500 | Model spend, per visitor. The cost control |

**The agent is metered in money, not requests.** A turn is not a fixed price:
the two measured in a browser ran 3 and 7 minutes and made 6 and 20 tool calls,
so counting turns never bounded what one could spend. The loop now reports each
model call's usage and the route charges it at Claude Opus 5 list price, $5 per
million input tokens and $25 per million output, held in thousandths of a cent
so the arithmetic stays in integers. `docs/07` sets a $2 to $5 planning ceiling
per anonymous session; 500 cents is the top of that range and is a placeholder
for a measured number, not a measured one.

Driven in a browser against a real container with the budget set to one cent:
the turn read a file, spent 2,361 input and 305 output tokens, was stopped
before the next model call, and the panel reported *"That turn used 2,361 input
and 305 output tokens, about $0.02"*. The charge lands after each call rather
than before, because a turn's cost is only known once it has run — so the
overshoot is bounded by one turn's `max_tokens` rather than by an estimate.

**A visitor who runs out is offered their own key, not a wall.** The refusal
carries an `offerKey` flag and the composer grows a field for an Anthropic key,
held in that tab's `sessionStorage` and sent with each request. It is never
written to this server, never logged, and a turn on it is not metered, because
it is not our spend. Verified with a deliberately invalid key: the turn failed
on *that* key rather than silently falling back to the server's, which is the
whole point of the feature. A valid visitor key completing a turn is the one
step not driven end to end, to keep a real key out of a session transcript.

The two workspace refusals were driven against the deployed site, not locally:

- Six run requests in a row filled the deployment and the fifth was told *"All 4
  workspace slots are busy"*.
- A seventh crossed the hourly limit and was told *"That is 5 workspaces in an
  hour"*. E2B reported zero sandboxes started by it, so the refusal happens
  before anything is allocated.

Four decisions worth keeping:

- **A visitor is a salted hash of the client address, never the address.** The
  store holds 24 hex characters and `BRIK_VISITOR_SALT`.
- **Keys carry the environment.** One Upstash database serves production,
  previews, and every developer, because they all read the same integration
  variables. Without a namespace a local `pnpm verify-templates` occupies
  production's slots, which is a very confusing way to take the site down.
- **A production build with no store refuses to start a workspace.** A route
  that cannot count cannot say no, and failing shut is the honest answer.
- **A run is charged where a sandbox is created**, not at the top of the
  request, or a made-up workspace id would buy one for free. A capacity refusal
  refunds it, because the deployment being full is not the visitor's doing.

The window is a fixed clock hour rather than a sliding one, which is visible at
the boundary: a burst of six split three and three across two buckets during
testing. Coarser than a sliding window and enough to stop a stranger looping on
the endpoint.

The slot is claimed before the first await, so a burst cannot slip past the
check. Because a sandbox id does not exist until the sandbox does, it is taken
under a placeholder with a 120s deadline and swapped for the real id, added
before removed, so the count can read one high for an instant but never one low.

## Known limits

- `--security-opt seccomp=unconfined` is still required by the shipped image,
  because Agave 3.x asserts `io_uring_supported()` with no fallback. Fine for a
  development baseline, **not** acceptable for untrusted code.

  There is now a verified way out, measured on this machine and not taken yet.
  The assert first ships in 3.1.1; Agave **3.0.14** still degrades gracefully.
  Dropping its `solana-test-validator` binary into the image, changing nothing
  else, runs the whole loop under Docker's **default** seccomp profile with no
  `--security-opt` at all: validator up in 1s, wallet funded, `anchor deploy`
  returning a real program id and signature, and `anchor test` passing with a
  real transaction signature. Confirmed with `SecurityOpt: null` on the
  container. The 3.1.9 validator, for comparison, never serves under the same
  profile. The build toolchain is untouched: this swaps the runtime binary only,
  and works because platform-tools v1.52 emits SBPF v0, which every validator
  from 2.1 to 4.x executes, while the edition2024 blocker that forced 3.1.9 is
  purely build-side.

  Not adopted yet because it is a real trade. 3.0.14 runs feature set
  3604001754 against live clusters' 4119855713, so a template passing locally
  proves less about devnet than it does today. It is also only needed for
  container-based providers: on a Firecracker provider with a real guest kernel,
  io_uring is available and 3.1.9 runs unmodified. Decide it with the provider,
  not before.
- `exec` is request/response. Streaming it is enough for a build and a deploy;
  an interactive terminal needs a session primitive that does not exist.
- **A client that disconnects does not release its sandbox on Vercel.** Locally
  a dropped connection aborts the exec and destroys the container, verified.
  In production it does not: six aborted run requests left all six sandboxes
  running, and only an explicit DELETE cleared them. The page's own `pagehide`
  DELETE covers the ordinary "closed the tab" path; what leaks is a stream that
  dies without one.

  **A cron now reaps those.** `/api/cron/reap` runs every five minutes, asks the
  provider what is running and Redis what was claimed, and destroys the
  difference once it is older than a three-minute grace period. It refuses to
  act rather than guess: with no store there are no claims to compare against
  and every sandbox would look like an orphan. `CRON_SECRET` gates it, and
  Vercel stores that write-only, so it cannot be read back and invoked by hand.

  Proven on the deployed site rather than by reading logs: an orphan planted
  through the same provider the product uses, running and claimed by nobody,
  was gone **282 seconds** later. Its own TTL was 900s, so the cron is what
  removed it.
- **No approval step.** `requiresApproval()` classifies write and run as needing
  one and nothing asks, so anything the agent decides to do it does. Survivable
  only because the sandbox has no egress and a TTL.
- ~~The template suites are not idempotent.~~ Fixed. Three of the four derived
  their accounts from the provider's own wallet or a fixed order id, so a second
  run against the same validator found the account already in use — which is
  what a visitor got for pressing Redeploy. Tip jar and NFT mint now generate a
  fresh owner and authority and fund it; USDC checkout takes a fresh order id,
  which is what a real order has anyway. Token gate was already fine: its mint
  is created per run, so everything derived from it was too.
- Leases live in the Node process. A server restart forgets them, and the
  containers it forgot survive until their own TTL, then get swept. On E2B a
  miss is now recoverable: `E2BProvider.getWorkspace` reconnects to a live
  sandbox by id, and the registry adopts what comes back, so the agent turn and
  the release both work from an instance that never created the workspace.
  Verified on the deployed site both ways. This is not the lease store: the cap
  and the sweeper are still per-process, and an adopted lease's deadline is a
  ceiling rather than the sandbox's real one.
- ~~The control plane cannot run where the site runs.~~ Settled: it runs on
  Vercel against E2B, and a visitor with no Docker gets a real build.
- The io_uring requirement **cannot** be dropped from Agave.
  `assert!(io_uring_supported())` is verbatim in `fs/src/dirs.rs` in 3.1.9,
  3.1.14, 4.0.0, 4.1.2, 4.2.0, 4.3.0-alpha.3 and master, with no flag; there is
  no Agave 3.2 or 3.3, the train went 3.1.x to 4.x.

## The workspace runs off this machine

**All four templates build, deploy, and pass their tests on E2B**, driven
through the same HTTP route the browser uses, with no Docker anywhere. Confirmed
in a browser as well as by `pnpm verify-templates`.

The toolchain image is published as the E2B template `brik-solana-toolchain`
(`pnpm publish-template`, five minutes). Point a deployment at it by setting
`E2B_TEMPLATE=brik-solana-toolchain` alongside `E2B_API_KEY`; without both, the
control plane uses local Docker.

| | Docker, local | E2B |
| --- | --- | --- |
| Whole run, per template | 13 to 16s | 39 to 41s |
| Sandbox start | ~0.4s | ~1.2s |
| Validator up, wallet funded | 1.9s | 3s |
| First `anchor build` | ~1.3s | 9.4s |
| `anchor build` after a template overlay | 2.2s | 13.2s |
| `anchor build` warm, nothing changed | ~0.3s | 0.8s |
| `anchor deploy` | 4.3s | 4.4s |

The pre-built cargo cache **does** survive the snapshot, which was the open
question: a genuinely cold compile is ~40s, and every number above is far below
it. E2B is slower on first touch because a snapshot hydrates its filesystem
lazily, so the first read of an 825MB target directory pays for itself. It is
comfortably inside the five-minute activation target either way.

## The provider question is answered

**E2B runs the workspace unmodified**, settled with the real binary rather than
a kernel config. In a stock E2B sandbox, the Agave 3.1.9
`solana-test-validator` — the binary that asserts `io_uring_supported()` and
panics without it — booted in **2 seconds** and answered JSON-RPC. Kernel
6.1.158+, and `Seccomp: 0` on the process, because a sandbox is a real
Firecracker microVM whose guest syscalls never meet a host seccomp profile.

That makes the Agave 3.0.14 downgrade above insurance rather than a dependency,
and retires `seccomp=unconfined` as a production concern: it is a Docker
baseline problem, not a workspace problem.

`E2BProvider` is written and verified against a real sandbox, all twelve
Workspace behaviours the product uses: create in **262ms** (Docker is ~400ms),
exec round trip 127ms, streamed stdout and stderr, cwd, env, non-zero exit
returned as a result rather than thrown, read, write, list, port forward, and
destroy. Modal stays out, gVisor has no io_uring. Railway is out, its seccomp
blocks it. Fly Machines remain the runner-up.

The control plane picks the provider from config: E2B when `E2B_API_KEY` and
`E2B_TEMPLATE` are both set, local Docker otherwise. A developer with Docker
still needs no credentials.

### What E2B's Dockerfile converter does to the image

Three defects, each found by probe templates rather than documentation, and one
of them contradicts what the vendor docs imply:

| Behaviour | Consequence | Where it is handled |
| --- | --- | --- |
| `ENV` is dropped entirely, single or multi line, quoted or not. Not in the command's environment, not in pid 1's, not in any shell init file | Nothing the image puts on `PATH` exists: no cargo, anchor, rustup, or Solana CLI | The adapter supplies `PATH` and `HOME` on every exec |
| A backslash-n inside a `RUN` becomes a literal `n`. `printf '#!/bin/sh\necho ok\n'` produced the single line `#!/bin/shnecho okn` | The pre-build's Cargo.toml edit collapsed into one corrupt line and failed the build | The step moved into `prepare-project.sh`; a COPYed file arrives byte for byte |
| A Dockerfile with no `USER` gets `USER user` appended, uid 1000, `$HOME=/home/user` | That account cannot read `/root` or write `/workspace`, so the warm build is silently lost | The adapter runs everything as root |

Two things that do survive, both checked: file **mtimes are preserved** through
the build, which is the mechanism cargo fingerprints rely on, and a sandbox
started in **492ms** with no ready-wait.

## The workspace shell is machined

The shell was one flat plane: every surface `#151515`, every edge the same grey
`#2A2A2A` line. It is now built to the workspace-depth handoff, which amends one
rule in the base design system and moves no layout. Every surface has a job:
chassis holds, wells hold content, keys press and travel 1px. One light source
for the whole product, above and slightly left. Grain and sheen live on the shell
root so they run continuously and the shell reads as one slab rather than six
boxes. Status is lamps in punched sockets that latch on in 0ms and decay off in
220ms. The three parts are separated by 3px knurled seams that drag, clamp, and
persist per tab.

The boot sequence assembles the case once on arrival: power-on, annunciator
self-test, seams, wells milled open with `clip-path`, etched markings, legend
plate. It ends at roughly 1.4s and it only ever animates the case. **Nothing with
a fact in it is on a timer.** The file tree, the source, the terminal, the meter,
and the lamps are all folded from the run's own events, so a step that finishes
faster than an animation is never made to wait for one, and the meter reads 000%
until the validator is actually up.

Six values in the reference prototype were invented and are not shipped: a
ticking slot counter, a unit number, four toolchain versions that were not this
image's, and a `⌘K` command palette that does not exist. What replaced them is
listed in DESIGN.md under "Deltas from the machined-depth handoff". The rule that
every number on this surface was read out of the container did not move for a
design pass.

Verified in a browser against a real E2B sandbox at 1512×944 and at 390px: the
full run reached DEPLOYED with 4 tests passing, the meter latched to 14/14, the
cream Deploy key arrived only at the end, the boot cues fired in the designed
order (self-test → seams → editor, rail, terminal → four labels → plate), the
seams dragged and persisted, `prefers-reduced-motion` skipped straight to the
assembled state, and there were no console errors and no horizontal scroll.

Then again on the deployment itself before the domain moved. A preview URL
cannot check this: `BRIK_WORKSPACE_ENABLED` is production-only and the page gate
resolves at build time, so `/workspace` builds as a 404 on any other target. The
build was made with `vercel deploy --prod --skip-domain`, driven end to end on
its own URL with production's keys, and promoted only after it reached DEPLOYED.
The same run was repeated on `www.brik.builders` afterwards.

One bug this turned up and fixed: a `clip-path` left on a well after its cut
lands stops clipping the well's composited scroll layer, so scrolled terminal
lines paint outside it. The clip comes off once the cut has finished.

## Deliberate deviations from DESIGN.md

Both are recorded in DESIGN.md itself. The Preview pane no longer renders a
template app in browser chrome, because there is no deployment to frame and no
URL to show. The composer no longer offers a suggested change; the agent behind
it is real now, but a suggestion it did not make would still be invented. Both
return with the slice that makes them true.

## Verifying this

With Docker running and the image built:

```sh
pnpm dev              # one terminal
pnpm verify-templates # another: builds, deploys, and tests all four
```

It drives the same HTTP route the browser does, so a template that passes there
is one a visitor can open. It fails the run if a template reaches for anything
the image does not carry, which is the only way that constraint stays honest.
