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
deliberately disabled as "Coming soon". That gate is unchanged: `/workspace`
needs local Docker, so it is not something a visitor can be sent to yet.

**The toolchain image** `brik/solana-toolchain:dev` is built and verified:
Agave 3.1.9, Anchor 0.31.1, Rust 1.85.0, Node 22. **6.11GB extracted**, 8.93GB
as Docker reports it, down from 7.65GB / 10.1GB. That matters because a sandbox
provider's disk quota measures the extracted size, and E2B's free tier caps it
at 10GB, so the image now fits the tier that can answer the provider question
without a $150/mo commitment.

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

## What does not exist

No agent and no LLM call. No auth, database, or persistence. No preview URLs, no
devnet deploy, no billing, no GitHub import. The composer says so rather than
implying otherwise.

## How the control plane works

Three modules under `apps/web`, no new service:

- `lib/workspace/registry.ts` — in-process workspace leases, a 30s sweeper, and
  an orphan reaper. Server only.
- `lib/workspace/run.ts` — the run sequence. Every line the UI shows originates
  here and came out of the container.
- `app/api/workspace/run` (POST, streams newline-delimited JSON) and
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
  docker CLI, and Vercel functions have no Docker daemon. Getting `/workspace`
  live means a managed-provider adapter behind `SandboxProvider`, which is the
  next slice and the one that blocks the rest.
- Provider research (desk research only, no account touched yet): the io_uring
  requirement **cannot** be dropped. `assert!(io_uring_supported())` is verbatim
  in `fs/src/dirs.rs` in 3.1.9, 3.1.14, 4.0.0, 4.1.2, 4.2.0, 4.3.0-alpha.3 and
  master, with no flag; there is no Agave 3.2 or 3.3, the train went 3.1.x to
  4.x. E2B looks strongest: real Firecracker microVMs whose guest kernel is
  built with `CONFIG_IO_URING=y`, confirmed from E2B's published kernel config.
  Fly Machines are the runner-up on a 6.12.x guest kernel. Railway is out, its
  seccomp blocks io_uring. Neither candidate is proven until a paid account runs
  this image.

## Deliberate deviations from DESIGN.md

Both are recorded in DESIGN.md itself. The Preview pane no longer renders a
template app in browser chrome, because there is no deployment to frame and no
URL to show. The composer no longer offers a suggested change, because no agent
exists to make the edit. Both return with the slice that makes them true.

## Verifying this

With Docker running and the image built:

```sh
pnpm dev              # one terminal
pnpm verify-templates # another: builds, deploys, and tests all four
```

It drives the same HTTP route the browser does, so a template that passes there
is one a visitor can open. It fails the run if a template reaches for anything
the image does not carry, which is the only way that constraint stays honest.
