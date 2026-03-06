#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$ROOT_DIR/package.json"
CARGO_TOML="$ROOT_DIR/Cargo.toml"

node_version="$(node -e "const p=require('$PACKAGE_JSON'); process.stdout.write(p.version)")"
rust_version="$(awk '
  BEGIN { in_package = 0 }
  /^\[[^]]+\][[:space:]]*$/ {
    in_package = ($0 == "[package]")
    next
  }
  in_package && $0 ~ /^[[:space:]]*version[[:space:]]*=[[:space:]]*"[^"]+"/ {
    sub(/^[[:space:]]*version[[:space:]]*=[[:space:]]*"/, "", $0)
    sub(/".*/, "", $0)
    print $0
    exit
  }
' "$CARGO_TOML")"

if [[ -z "$rust_version" ]]; then
  echo "Could not read [package] version from Cargo.toml" >&2
  exit 1
fi

if [[ "$node_version" != "$rust_version" ]]; then
  echo "Version mismatch detected:" >&2
  echo "  package.json: $node_version" >&2
  echo "  Cargo.toml:   $rust_version" >&2
  exit 1
fi

echo "Version sync OK: $node_version"
