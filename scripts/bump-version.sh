#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$ROOT_DIR/package.json"
CARGO_TOML="$ROOT_DIR/Cargo.toml"

usage() {
  echo "Usage: scripts/bump-version.sh <patch|minor|major|x.y.z>"
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

specifier="$1"

current_version="$(node -e "const p=require('$PACKAGE_JSON'); process.stdout.write(p.version)")"

if [[ ! "$current_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Current package.json version is not valid semver: $current_version" >&2
  exit 1
fi

IFS='.' read -r major minor patch <<< "$current_version"

case "$specifier" in
  patch)
    next_version="$major.$minor.$((patch + 1))"
    ;;
  minor)
    next_version="$major.$((minor + 1)).0"
    ;;
  major)
    next_version="$((major + 1)).0.0"
    ;;
  *)
    if [[ "$specifier" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      next_version="$specifier"
    else
      echo "Invalid version specifier: $specifier" >&2
      usage
      exit 1
    fi
    ;;
esac

if [[ "$next_version" == "$current_version" ]]; then
  echo "Version is already $next_version"
  exit 0
fi

node - <<'NODE' "$PACKAGE_JSON" "$next_version"
const fs = require('fs')

const packageJsonPath = process.argv[2]
const nextVersion = process.argv[3]

const data = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
data.version = nextVersion
fs.writeFileSync(packageJsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
NODE

temp_file="$(mktemp)"
awk -v next_version="$next_version" '
  BEGIN { in_package = 0; updated = 0 }
  /^\[[^]]+\][[:space:]]*$/ {
    in_package = ($0 == "[package]")
    print
    next
  }
  {
    if (in_package && $0 ~ /^[[:space:]]*version[[:space:]]*=[[:space:]]*"[^"]+"([[:space:]]*#.*)?$/) {
      match($0, /^[[:space:]]*/)
      indent = substr($0, RSTART, RLENGTH)
      print indent "version = \"" next_version "\""
      updated = 1
      next
    }
    print
  }
  END {
    if (!updated) {
      exit 2
    }
  }
' "$CARGO_TOML" > "$temp_file" || {
  rm -f "$temp_file"
  echo "Could not update [package] version in Cargo.toml" >&2
  exit 1
}

mv "$temp_file" "$CARGO_TOML"

echo "Updated version: $current_version -> $next_version"
echo "Files updated: package.json, Cargo.toml"
