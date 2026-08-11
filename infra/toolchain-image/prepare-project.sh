#!/usr/bin/env bash
#
# Build the pre-warmed Anchor project that every workspace starts from.
#
# This lives in a file rather than inline in the Dockerfile because it has to
# survive two different parsers. Docker handles escape sequences one way, and
# E2B's Dockerfile-to-template converter another: it turns "\n" into a literal
# "n" and does not substitute ARG values, which silently produced a corrupt
# Cargo.toml and a failed build. A COPYed script is passed through verbatim by
# both, so the two paths cannot drift.
#
# Three deliberate edits before the build, each measured:
#
# 1. The dependency set is the UNION of what every template needs, because a
#    workspace runs with egress off and cannot fetch a crate at runtime. A
#    template may only use crates compiled here. anchor-spl also has to join the
#    idl-build feature, or the SBF build succeeds and IDL generation fails on
#    the anchor_spl account types.
# 2. debug = false on the dev profile. anchor build compiles the test profile to
#    generate the IDL, and its debug symbols were 1.7GB of a 2.0GB target
#    directory. Dropping them leaves 891MB.
# 3. npm, because yarn is not installed. This is what makes anchor test work
#    offline. @solana/spl-token is added on top because a template test cannot
#    create a mint without it, and npm install is as unavailable at runtime as
#    cargo fetch is.

set -euo pipefail

# Taken from the installed CLI rather than a build argument, so the crate
# version always matches the Anchor that compiles it, and so this does not
# depend on ARG substitution working.
ANCHOR_VERSION="${ANCHOR_VERSION:-$(anchor --version | awk '{print $2}')}"
echo "preparing the pre-built project against Anchor ${ANCHOR_VERSION}"

# anchor init takes a workspace NAME under the cwd, not a path. --no-install
# because it shells out to yarn, which is not in this image.
mkdir -p /workspace
cd /workspace
anchor init project --no-git --no-install
cd /workspace/project

MANIFEST=programs/project/Cargo.toml
sed -i "s|^anchor-lang = .*|anchor-lang = { version = \"${ANCHOR_VERSION}\", features = [\"init-if-needed\"] }|" "$MANIFEST"
sed -i "/^anchor-lang = /a anchor-spl = { version = \"${ANCHOR_VERSION}\", features = [\"metadata\"] }" "$MANIFEST"
sed -i "s|^idl-build = .*|idl-build = [\"anchor-lang/idl-build\", \"anchor-spl/idl-build\"]|" "$MANIFEST"

printf '\n[profile.dev]\ndebug = false\n' >> Cargo.toml

sed -i "s|^package_manager = .*|package_manager = \"npm\"|" Anchor.toml
sed -i "s|^test = .*|test = \"npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts\"|" Anchor.toml

npm install --no-audit --no-fund
npm install --no-audit --no-fund --save-dev @solana/spl-token

anchor build

# The cargo git checkouts and unpacked registry sources go once the build is
# done, 278MB together. registry/cache and registry/index stay: cache holds the
# .crate archives cargo re-extracts from, and deleting index/*/.cache breaks an
# offline build outright.
rm -rf /root/.cargo/git /root/.cargo/registry/src

echo "pre-built project ready"
