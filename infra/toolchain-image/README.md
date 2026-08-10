# BRICK Solana toolchain image

The deterministic base image for every BRICK workspace.

## Build

```sh
docker build -t brick/solana-toolchain:dev .
```

Expect a long first build (Rust toolchain + Anchor compile + pre-warm). The
pre-warm layer compiles a scratch Anchor project so user builds start from
warm cargo caches — this layer is what makes the "P95 under 5 minutes"
activation target survivable and is measured by `tools/bakeoff`.

## Pinned versions

| Component | Version | Bump policy |
| --- | --- | --- |
| Rust | 1.85.0 | With Anchor compatibility testing |
| Solana CLI (Agave) | 2.1.21 | With template + agent-eval re-run |
| Anchor | 0.31.1 | Deliberate release: templates, agent context, and evals all pin to this |
| Node | 22.x | LTS track |

Version bumps re-run the agent eval set (docs/07 §2) before rollout —
LLM-generated Anchor code is version-sensitive.
