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

# Install the nightly toolchain Anchor's IDL build needs, without its docs.
#
# anchor build generates the IDL with a host-side compile that runs under
# +nightly, and left alone rustup fetches a full nightly on first use: 1.5GB, of
# which 926MB is documentation nothing reads. Installing it here with the
# minimal profile costs 592MB instead.
#
# Pinning RUSTUP_TOOLCHAIN to the stable toolchain instead looks like it removes
# nightly entirely, and it does compile the scratch program. It then fails every
# real template: under stable the IDL build cannot resolve a `seeds` expression
# that names another account, so a program with any PDA gets
# "cannot find value `mint` in this scope" from inside #[derive(Accounts)].
# Nightly is load-bearing. tools/verify-templates is what catches this, because
# the scratch program built here has no PDAs and passes either way.
RUN rustup toolchain install nightly --profile minimal

# Pre-build a scratch Anchor project AT THE PATH A WORKSPACE ACTUALLY USES.
#
# This is the core of the build-time budget (docs/07 §2), and the path is the
# whole trick. Cargo fingerprints embed absolute paths, so a compiled target
# directory only accelerates a build that runs where it was built. Measured:
# copying this target into a project elsewhere is worth almost nothing (40.3s
# against a 41.7s cold baseline), while overlaying a template's source onto
# this directory in place builds in ~1.2s.
#
# The steps live in prepare-project.sh rather than inline here, because this has
# to survive two parsers. Docker and E2B's Dockerfile-to-template converter
# disagree about escape sequences: E2B rewrites a backslash-n inside a RUN into
# a literal letter n, which collapsed the Cargo.toml edit into one corrupt line
# and failed the build. Measured in a probe template: a COPYed file arrives byte
# for byte, so the script is the one form both parsers agree on and the local
# image and the E2B template cannot drift.
#
# The script explains each edit it makes and why.
COPY prepare-project.sh /tmp/prepare-project.sh
RUN chmod +x /tmp/prepare-project.sh \
    && /tmp/prepare-project.sh \
    && rm /tmp/prepare-project.sh

# The pre-build is also what populates the SBF platform-tools cache. Without it,
# cargo-build-sbf downloads a tarball from GitHub on first build, which is a hard
# failure in a workspace running with egress off. Fail the image build now rather
# than the user's first build later. The cache lives under $HOME, so a workspace
# must run as the same user that built this layer (root).
COPY verify-image.sh /tmp/verify-image.sh
RUN chmod +x /tmp/verify-image.sh \
    && /tmp/verify-image.sh \
    && rm /tmp/verify-image.sh

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
