# BRIK Solana toolchain image
#
# The workspace base image: Rust, Solana CLI (Agave), Anchor, Node, pnpm.
# Every workspace — local Docker or managed provider — runs this image so
# environments are deterministic. Versions are pinned; bumping them is a
# deliberate release, not a side effect (LLM knowledge of Anchor is
# version-sensitive — templates and agent context pin to these versions).

FROM ubuntu:24.04

ARG RUST_VERSION=1.85.0
# 3.1.9, not 2.1.x: the SBF platform-tools bundled with 2.1.x carry Cargo 1.79,
# which cannot parse the edition2024 manifests that crates.io has moved to, so
# anchor build fails on a freshly resolved tree. 3.1.9 ships platform-tools with
# a modern Cargo. The cost is that its validator requires io_uring; see README.
ARG SOLANA_VERSION=3.1.9
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

# Pre-build a scratch Anchor project AT THE PATH A WORKSPACE ACTUALLY USES.
#
# This is the core of the build-time budget (docs/07 §2), and the path is the
# whole trick. Cargo fingerprints embed absolute paths, so a compiled target
# directory only accelerates a build that runs where it was built. Measured:
# copying this target into a project elsewhere is worth almost nothing (40.3s
# against a 41.7s cold baseline), while overlaying a template's source onto
# this directory in place builds in ~1.2s.
#
# anchor init takes a workspace NAME under the cwd, not a path. --no-install
# because it shells out to yarn and only the cargo artifacts matter here. The
# target directory is deliberately kept: it is the product of this layer.
RUN mkdir -p /workspace \
    && cd /workspace \
    && anchor init project --no-git --no-install \
    && cd /workspace/project \
    && anchor build

# The pre-build is also what populates the SBF platform-tools cache. Without it,
# cargo-build-sbf downloads a tarball from GitHub on first build, which is a hard
# failure in a workspace running with egress off. Fail the image build now rather
# than the user's first build later. The cache lives under $HOME, so a workspace
# must run as the same user that built this layer (root).
RUN ls -d /root/.cache/solana/*/platform-tools >/dev/null 2>&1 \
    || { echo "platform-tools cache missing: offline anchor build would fail"; exit 1; } \
    && test -f /workspace/project/target/deploy/project.so \
    || { echo "pre-built target missing: first user build would be a cold compile"; exit 1; }

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
