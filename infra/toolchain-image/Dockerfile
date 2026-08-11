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
# anchor init takes a workspace NAME under the cwd, not a path. --no-install
# because it shells out to yarn, which is not in this image; npm install below
# does the same job. The target directory is deliberately kept: it is the
# product of this layer.
#
# Three deliberate edits before the build, each measured:
#
# 1. The dependency set is the UNION of what every template needs, because a
#    workspace runs with egress off and literally cannot fetch a crate at
#    runtime (verified: cargo fails to resolve index.crates.io). A template may
#    therefore only use crates compiled here. anchor-spl with "metadata" pulls
#    the SPL token and Metaplex bindings; "init-if-needed" is an anchor-lang
#    feature, and features are part of the fingerprint, so the superset has to
#    be compiled now or a template using it triggers a cold rebuild.
#    anchor-spl also has to join the idl-build feature, or the SBF build
#    succeeds and IDL generation fails on the anchor_spl account types.
# 2. debug = false on the dev profile. anchor build compiles the test profile
#    to generate the IDL, and its debug symbols were 1.7GB of a 2.0GB target
#    directory. Dropping them takes the target to 891MB, which is smaller than
#    this layer was before anchor-spl was added, with no loss of build speed.
# 2b. The cargo git checkouts and unpacked registry sources go once the build is
#    done, 278MB together. registry/cache and registry/index stay: cache holds
#    the .crate archives cargo re-extracts from, and deleting index/*/.cache
#    breaks an offline build outright.
# 3. npm, because yarn is not installed. This is what makes anchor test work
#    offline; node_modules costs 85MB. @solana/spl-token is added on top
#    because a template test cannot create a mint or a token account without
#    it, and npm install is as unavailable at runtime as cargo fetch is.
RUN mkdir -p /workspace \
    && cd /workspace \
    && anchor init project --no-git --no-install \
    && cd /workspace/project \
    && sed -i "s|^anchor-lang = .*|anchor-lang = { version = \"${ANCHOR_VERSION}\", features = [\"init-if-needed\"] }\nanchor-spl = { version = \"${ANCHOR_VERSION}\", features = [\"metadata\"] }|" \
         programs/project/Cargo.toml \
    && sed -i "s|^idl-build = .*|idl-build = [\"anchor-lang/idl-build\", \"anchor-spl/idl-build\"]|" \
         programs/project/Cargo.toml \
    && printf '\n[profile.dev]\ndebug = false\n' >> Cargo.toml \
    && sed -i "s|^package_manager = .*|package_manager = \"npm\"|" Anchor.toml \
    && sed -i "s|^test = .*|test = \"npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts\"|" Anchor.toml \
    && npm install --no-audit --no-fund \
    && npm install --no-audit --no-fund --save-dev @solana/spl-token \
    && anchor build \
    && rm -rf /root/.cargo/git /root/.cargo/registry/src

# The pre-build is also what populates the SBF platform-tools cache. Without it,
# cargo-build-sbf downloads a tarball from GitHub on first build, which is a hard
# failure in a workspace running with egress off. Fail the image build now rather
# than the user's first build later. The cache lives under $HOME, so a workspace
# must run as the same user that built this layer (root).
RUN ls -d /root/.cache/solana/*/platform-tools >/dev/null 2>&1 \
    || { echo "platform-tools cache missing: offline anchor build would fail"; exit 1; } \
    && test -f /workspace/project/target/deploy/project.so \
    || { echo "pre-built target missing: first user build would be a cold compile"; exit 1; } \
    && test -d /workspace/project/node_modules/ts-mocha \
    || { echo "node_modules missing: anchor test would need egress"; exit 1; } \
    && ls /workspace/project/target/sbpf-solana-solana/release/deps/libanchor_spl-*.rlib \
         >/dev/null 2>&1 \
    || { echo "anchor-spl not compiled: SPL templates would be a cold build"; exit 1; } \
    && ls /root/.cargo/registry/cache/*/anchor-spl-*.crate >/dev/null 2>&1 \
    || { echo "anchor-spl archive missing: cargo could not re-extract it offline"; exit 1; } \
    && test -d /root/.rustup/toolchains/nightly-x86_64-unknown-linux-gnu \
    || { echo "nightly missing: IDL generation fails for any program with a PDA"; exit 1; }

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
