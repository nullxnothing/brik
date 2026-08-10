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

## Known blocker: the pre-warm layer does not build yet

**The pre-warm `anchor build` fails on the pinned versions and needs a decision
before this image can be built.** Three earlier blockers in this file have been
fixed (unpinned `avm` from git HEAD, `anchor init` invoked with a path instead
of a workspace name, and `anchor init` shelling out to yarn). This one is not a
bug in the Dockerfile.

`cargo-build-sbf` runs the Cargo bundled with the SBF platform-tools, which for
Agave 2.1.21 is **Cargo 1.79**. Current crates.io releases have broadly adopted
`edition2024`, which 1.79 cannot parse, so a freshly resolved dependency tree
fails:

```
error: failed to parse manifest at .../cmov-0.5.4/Cargo.toml
  feature `edition2024` is required ... not stabilized in this version of Cargo (1.79.0)
```

Pinning the offending crate does not fix it: pinning `cmov` to 0.5.3 moved the
same failure to `toml_edit 0.25.13`. Every new release drags the tree forward,
so per-crate pins are unwinnable.

Two real options, both of which are deliberate releases under the version
policy below:

1. **Bump `SOLANA_VERSION`** to a release whose platform-tools bundles a modern
   Cargo, and re-pin Anchor to a compatible version. Highest leverage, and it is
   the version pair the ecosystem is actually testing against.
2. **Ship a `Cargo.lock` with every template** and build from it, so resolution
   is frozen to a known-good tree and never picks up a new edition2024 crate.
   This is worth doing regardless, because it is also what makes user builds
   reproducible and keeps the agent's generated code on versions it knows.

The recommendation is to do both: 1 unblocks the image, 2 stops the problem
recurring. Note the local validator work below is unaffected and verified
independently, since it does not depend on the pre-warm layer.

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

## Pinned versions

| Component | Version | Bump policy |
| --- | --- | --- |
| Rust | 1.85.0 | With Anchor compatibility testing |
| Solana CLI (Agave) | 2.1.21 | With template + agent-eval re-run |
| Anchor | 0.31.1 | Deliberate release: templates, agent context, and evals all pin to this |
| Node | 22.x | LTS track |

Version bumps re-run the agent eval set (docs/07 §2) before rollout —
LLM-generated Anchor code is version-sensitive.
