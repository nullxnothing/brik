# BRIK Solana toolchain image
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

# Anchor via avm. Pinned to the release tag and --locked: installing avm from
# git HEAD pulled transitive crates that require a newer rustc than we pin, so
# an unpinned install breaks this image the moment upstream moves.
RUN cargo install --git https://github.com/coral-xyz/anchor \
      --tag "v${ANCHOR_VERSION}" avm --locked --force \
    && avm install "${ANCHOR_VERSION}" \
    && avm use "${ANCHOR_VERSION}"

# Pre-warm: a scratch Anchor project compiled once so dependency crates are
# cached in the image layer. This is the core of the build-time budget
# (docs/07 §2) — first user builds hit warm caches, not cold compiles.
# anchor init takes a workspace NAME and creates it under the current directory,
# so it must be run from /opt rather than handed a path. --no-install because it
# shells out to yarn by default and the prewarm only needs the cargo caches.
RUN cd /opt \
    && anchor init prewarm --no-git --no-install \
    && cd /opt/prewarm \
    && anchor build \
    && rm -rf /opt/prewarm/target/debug

# The prewarm build is also what populates the SBF platform-tools cache. Without
# it, cargo-build-sbf downloads a tarball from GitHub on first build, which is a
# hard failure in a workspace running with egress off. Fail the image build now
# rather than the user's first build later. The cache lives under $HOME, so a
# workspace must run as the same user that built this layer (root).
RUN ls -d /root/.cache/solana/*/platform-tools >/dev/null 2>&1 \
    || { echo "platform-tools cache missing: offline anchor build would fail"; exit 1; }

# Programs the test validator's genesis does not carry, dumped now so a
# workspace can run its validator with egress switched off. Genesis already
# includes System, SPL Token, Token-2022, associated token account, and Memo;
# Metaplex Token Metadata is the only gap the templates hit.
RUN mkdir -p /opt/brik/programs \
    && for cluster in mainnet-beta devnet; do \
         solana program dump metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s \
           /opt/brik/programs/token-metadata.so --url "$cluster" && break; \
       done \
    && test -s /opt/brik/programs/token-metadata.so

COPY brik-localnet /usr/local/bin/brik-localnet
RUN chmod +x /usr/local/bin/brik-localnet

WORKDIR /workspace
CMD ["bash"]
