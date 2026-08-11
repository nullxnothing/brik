# BRIK Solana toolchain image

The deterministic base image for every BRIK workspace.

## Build

```sh
docker build -t brik/solana-toolchain:dev .
```

Expect a long first build (Rust toolchain + Anchor compile + pre-warm). The
pre-warm layer compiles a scratch Anchor project so user builds start from
warm cargo caches — this layer is what makes the "P95 under 5 minutes"
activation target survivable and is measured by `tools/bakeoff`.

## The workspace requires io_uring

**Agave 3.x's validator hard-requires io_uring** and panics without it:

```
thread 'main' panicked at fs/src/dirs.rs:27:9: assertion failed: io_uring_supported()
```

There is no flag to fall back to mmap or regular file I/O. Docker's default
seccomp profile blocks the io_uring syscalls, so locally the image needs:

```sh
docker run --security-opt seccomp=unconfined ...
```

`DockerProvider` in `packages/sandbox` passes this for the local baseline. It is
acceptable there because that provider is explicitly a development path, and it
is **not** acceptable for workspaces running untrusted user code. A production
sandbox must permit io_uring without disabling seccomp wholesale.

This makes io_uring support a hard requirement in the provider bake-off, not a
preference. Firecracker-based providers run a real guest kernel and should have
it; gVisor does not implement io_uring, so a gVisor-backed provider cannot run
this image's validator. Verify per provider before choosing (docs/07 §2).

Staying on Agave 2.1.x to dodge this does not work: its platform-tools bundle
Cargo 1.79, which cannot parse the `edition2024` manifests crates.io has moved
to, so `anchor build` fails on a freshly resolved tree. Pinning the offending
crate just relocates the failure (`cmov` → `toml_edit`), and `cargo-build-sbf`
from 2.1.21 cannot fetch newer platform-tools. Both were tested.

## The local validator

Every workspace runs its own validator rather than reaching for devnet:

```sh
brik-localnet start    # boot, wait for readiness, fund the wallet
brik-localnet status   # exit 0 if it answers
brik-localnet stop
```

Measured in this image with `--network none`: ready in 2–3 seconds, 1000 SOL airdropped
instantly. That removes the faucet from the first-run path entirely and lets the anonymous
tier run with egress switched off.

Genesis already carries System, SPL Token, Token-2022, the associated token account program,
and Memo v3. Metaplex Token Metadata is the only program the templates need that genesis
lacks, so it is dumped at build time into `/opt/brik/programs` and loaded from disk at
startup. Adding another program means dumping its `.so` in the same layer and adding a
`--bpf-program` pair in `brik-localnet`.

Devnet stays the target for the shareable deploy, which is a later and deliberate step.

## What a template may use

A workspace runs with egress off, so it cannot fetch a crate or an npm package.
Verified: cargo fails to resolve `index.crates.io`. Everything a template needs
has to be compiled into this image, which makes the dependency set the union of
what every template uses:

| Side | Available |
| --- | --- |
| Rust | `anchor-lang` (with `init-if-needed`), `anchor-spl` (with `metadata`) |
| Tests | `@coral-xyz/anchor`, `@solana/spl-token`, `chai`, `mocha`, `ts-mocha` |

Adding a dependency is a change to this image and a full rebuild, not a change
to a template. `pnpm verify-templates` is what catches a template that forgot.

Three things this layer gets right that are easy to get wrong:

- `anchor-spl` must also be in the `idl-build` feature. Without it the SBF build
  succeeds and IDL generation fails on the anchor_spl account types.
- `debug = false` on the dev profile. `anchor build` compiles the test profile
  to generate the IDL, and its debug symbols were 1.7GB of a 2.0GB target
  directory. Dropping them leaves 891MB, so adding anchor-spl cost 80MB net.
- Every build of this image generates a **fresh program keypair**. A template's
  `declare_id!` is therefore stale as soon as the image is rebuilt: the program
  still builds and deploys, and the client then talks to the declared address
  rather than the deployed one, so every test fails against a program that is
  demonstrably there. The workspace runs `anchor keys sync` after writing a
  template, which is the supported fix.

## Pinned versions

| Component | Version | Bump policy |
| --- | --- | --- |
| Rust | 1.85.0 | With Anchor compatibility testing |
| Solana CLI (Agave) | 3.1.9 | With template + agent-eval re-run |
| Anchor | 0.31.1 | Deliberate release: templates, agent context, and evals all pin to this |
| Node | 22.x | LTS track |

Version bumps re-run the agent eval set (docs/07 §2) before rollout —
LLM-generated Anchor code is version-sensitive.
