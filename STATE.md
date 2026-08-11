# STATE

Last verified 2026-08-10 on branch `claude/brick-project-review-dn5i7x`.

## What runs

**The workspace runs a real template in a real container.** Opening `/workspace`
posts to the control plane, which starts a container from the toolchain image,
boots its own validator, writes the chosen template in, builds it, deploys it,
and runs its test suite, streaming every line of stdout and stderr back into the
terminal panel as it is produced. The program id, deploy signature, wallet
address, SOL balance, and test results on screen are read out of that container.

**Four templates, all real Anchor programs.** Verified together by
`pnpm verify-templates`, which drives the same HTTP route the browser does:

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

**The landing page** is live at https://brik.builders with every app-entry CTA
deliberately disabled as "Coming soon", and since 2026-08-11 the routes behind
those CTAs are closed as well. Until then `/workspace` was reachable by typing
the URL and served the old scripted demo: a hardcoded program id and a
fabricated "Deploy success". `/workspace`, `/new`, and both `/api/workspace`
routes now answer 404 in production. Verified after the deploy:
`curl -sL https://www.brik.builders/workspace` returns 404 and that program id
appears zero times, on the apex and on www.

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

`www.brik.builders` serves `dpl_9nS16mUv7iiDDs92uAMYFthfdA2x`, built from
`02c4896` on 2026-08-11. The apex 308s to www and resolves to the same
deployment. Production carries one environment variable,
`NEXT_PUBLIC_SITE_URL`; `BRIK_WORKSPACE_ENABLED` is absent, which is what closes
the workspace routes. A closed route renders `app/not-found.tsx` in the site's
own type and reports its title as "Not found", rather than Next's unstyled
default under a tab that still said "Workspace".

**Every number on the landing page is measured, so changing what it describes
changes the page.** The hero animation is a tip-jar run at the step timings
above, the toolchain card is read out of `brik/solana-toolchain:dev` (rustc
1.85.0, solana-cli 3.1.9, anchor-cli 0.31.1, node 22.23.2), and the validator
card is `brik-localnet` funding a wallet in 1.9s. The fabricated program id is
gone from the site entirely: `7xKX` appears zero times across `/`, `/workspace`,
`/new`, and `/brand`. Rebuilding the image moves the four versions.

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

**Concurrency is capped** at `BRIK_MAX_WORKSPACES`, default 4, because each
workspace is a container off a 6.11GB image and a few open tabs would otherwise
take the host down. The slot is claimed before the first await, so a burst
cannot slip past the check. Verified with six simultaneous requests against a
cap of two: peak container count was exactly two, two runs deployed, and four
were turned away with a plain sentence rather than a stack trace.

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
- Leases live in the Node process. A server restart forgets them, and the
  containers it forgot survive until their own TTL, then get swept.
- **The control plane cannot run where the site runs.** It shells out to the
  docker CLI, and Vercel functions have no Docker daemon. `E2BProvider` now
  exists behind `SandboxProvider` and is verified, but the control plane still
  instantiates `DockerProvider` directly, and the toolchain image is not
  published as an E2B template yet. Those two are what remain.
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
