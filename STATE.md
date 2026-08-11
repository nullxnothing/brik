# STATE

Last verified 2026-08-10 on branch `claude/brick-project-review-dn5i7x`.

## What runs

**The workspace runs a real build in a real container.** Opening `/workspace`
posts to the control plane, which starts a container from the toolchain image,
boots its own validator, builds the pre-built Anchor project, deploys it, and
streams every line of stdout and stderr back into the terminal panel as it is
produced. The program id, deploy signature, wallet address, and SOL balance on
screen are read out of that container.

Measured end to end, browser to deployed, 7 to 9 seconds:

| Step | Time |
| --- | --- |
| `docker run` | ~0.4s |
| `brik-localnet start` (validator up, wallet funded 1000 SOL) | ~1.9s |
| `anchor build` (warm, in place at `/workspace/project`) | ~1.5s |
| `anchor deploy` to the workspace validator | ~4.3s |
| Deploy rent | 1.266 SOL |

**The landing page** is live at https://brik.builders with every app-entry CTA
deliberately disabled as "Coming soon". That gate is unchanged: `/workspace`
needs local Docker, so it is not something a visitor can be sent to yet.

**The toolchain image** `brik/solana-toolchain:dev` (9.89GB) is built and
verified: Agave 3.1.9, Anchor 0.31.1, Rust 1.85.0, Node 22.

## What does not exist

No agent and no LLM call. No auth, database, or persistence. No template
projects. No preview URLs, no devnet deploy, no billing. Every workspace builds
`/workspace/project`, the scratch Anchor project baked into the image, and the
UI says so rather than implying otherwise.

No test step. `anchor test` needs `node_modules` that the image deliberately
does not install and that a workspace with egress off could not fetch, so the
run goes build then deploy. `Testing` stays in the status vocabulary, unused.

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

## Known limits

- `--security-opt seccomp=unconfined` is required locally, because Agave 3.x
  asserts `io_uring_supported()` with no fallback. Fine for a development
  baseline, **not** acceptable for untrusted code. A production sandbox has to
  permit io_uring without dropping seccomp wholesale.
- `exec` is request/response. Streaming it is enough for a build and a deploy;
  an interactive terminal needs a session primitive that does not exist.
- Leases live in the Node process. A server restart forgets them, and the
  containers it forgot survive until their own TTL, then get swept.
- Provider selection is still open and sits behind `SandboxProvider`. gVisor
  cannot run this image at all (no io_uring), so Modal is out; Firecracker-based
  providers (E2B, Fly) are the live candidates.

## Deliberate deviations from DESIGN.md

Both are recorded in DESIGN.md itself. The Preview pane no longer renders a
template app in browser chrome, because there is no deployment to frame and no
URL to show. The composer no longer offers a suggested change, because no agent
exists to make the edit. Both return with the slice that makes them true.
