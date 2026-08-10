# BRICK Solana toolchain image
#
# The workspace base image: Rust, Solana CLI (Agave), Anchor, Node, pnpm.
# Every workspace — local Docker or managed provider — runs this image so
# environments are deterministic. Versions are pinned; bumping them is a
# deliberate release, not a side effect (LLM knowledge of Anchor is
# version-sensitive — templates and agent context pin to these versions).

FROM ubuntu:24.04

ARG RUST_VERSION=1.85.0
ARG SOLANA_VERSION=2.1.21
ARG ANCHOR_VERSION=0.31.1
ARG NODE_VERSION=22

ENV DEBIAN_FRONTEND=noninteractive \
    PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates git pkg-config libssl-dev \
    libudev-dev llvm clang cmake protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Node + pnpm
RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

# Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --default-toolchain "${RUST_VERSION}"

# Solana CLI (Agave)
RUN curl -sSfL "https://release.anza.xyz/v${SOLANA_VERSION}/install" | sh

# Anchor via avm
RUN cargo install --git https://github.com/coral-xyz/anchor avm --force \
    && avm install "${ANCHOR_VERSION}" \
    && avm use "${ANCHOR_VERSION}"

# Pre-warm: a scratch Anchor project compiled once so dependency crates are
# cached in the image layer. This is the core of the build-time budget
# (docs/07 §2) — first user builds hit warm caches, not cold compiles.
RUN anchor init /opt/prewarm --no-git \
    && cd /opt/prewarm \
    && anchor build \
    && rm -rf /opt/prewarm/target/debug

WORKDIR /workspace
CMD ["bash"]
