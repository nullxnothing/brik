#!/usr/bin/env bash
#
# Fail the image build now rather than a visitor's first build later.
#
# Each check stands for a way this image has actually broken during
# development, so none of them are hypothetical.

set -euo pipefail

fail() { echo "$1" >&2; exit 1; }

ls -d /root/.cache/solana/*/platform-tools >/dev/null 2>&1 \
  || fail "platform-tools cache missing: offline anchor build would fail"

test -f /workspace/project/target/deploy/project.so \
  || fail "pre-built target missing: first user build would be a cold compile"

test -d /workspace/project/node_modules/ts-mocha \
  || fail "node_modules missing: anchor test would need egress"

ls /workspace/project/target/sbpf-solana-solana/release/deps/libanchor_spl-*.rlib >/dev/null 2>&1 \
  || fail "anchor-spl not compiled: SPL templates would be a cold build"

ls /root/.cargo/registry/cache/*/anchor-spl-*.crate >/dev/null 2>&1 \
  || fail "anchor-spl archive missing: cargo could not re-extract it offline"

test -d /root/.rustup/toolchains/nightly-x86_64-unknown-linux-gnu \
  || fail "nightly missing: IDL generation fails for any program with a PDA"

grep -q '^anchor-spl = ' /workspace/project/programs/project/Cargo.toml \
  || fail "anchor-spl not in the manifest: the dependency edit did not apply"

echo "image checks passed"
