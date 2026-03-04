# Troubleshooting Guide

This guide focuses on real failure modes seen when building and using `barrel-loader` in webpack/rspack projects.

---

## Table of Contents

- [1) Rust files parsed as JavaScript](#1-rust-files-parsed-as-javascript)
- [2) `Missing field exportType` / `Missing field export_type`](#2-missing-field-exporttype--missing-field-export_type)
- [3) `rslib: command not found`](#3-rslib-command-not-found)
- [4) Native addon fails to load](#4-native-addon-fails-to-load)
- [5) pnpm cache confusion](#5-pnpm-cache-confusion)
- [6) Build scripts ignored warning](#6-build-scripts-ignored-warning)
- [7) Why output size/file count changes between builds](#7-why-output-sizefile-count-changes-between-builds)
- [8) Verbose debugging workflow](#8-verbose-debugging-workflow)
- [9) Known limitations and practical workarounds](#9-known-limitations-and-practical-workarounds)

---

## 1) Rust files parsed as JavaScript

### Symptoms

- `Module parse failed` for files like `src/lib.rs`, `src/types.rs`, `src/rs_utils/...`
- `JavaScript parse error: Expected ';', '}' or <eof>`

### Root cause

Your `rslib` entry glob is too broad and includes Rust source paths indirectly.

### Fix

Use explicit TS entries or TS-only globs.

Good:

```ts
source: {
  entry: {
    index: './src/index.ts'
    // optionally: 'barrel-loader': './src/barrel-loader.ts'
  }
}
```

Also safe:

```ts
source: {
  entry: {
    index: ['./src/**/*.ts']
  }
}
```

Avoid:

```ts
source: {
  entry: {
    index: ['./src/**']
  }
}
```

---

## 2) `Missing field exportType` / `Missing field export_type`

### Symptoms

- Build fails while loader runs on barrel files
- Stack traces point to `dedupe` or `reconstruct` paths
- Error alternates between `exportType` and `export_type`

### Root cause

Mismatch between JavaScript object field casing and Rust NAPI object bindings.

### Fix checklist

1. Ensure Rust NAPI object maps expected JS names:

```rust
#[napi(js_name = "export_type")]
pub export_type: String,

#[napi(js_name = "is_type_export")]
pub is_type_export: bool,
```

2. Keep TS-to-native payload shape consistent across parse/dedupe/sort/reconstruct.
3. Rebuild everything:

```bash
./build.sh
```

4. Rebuild consumer package (if linked locally):

```bash
cd test-package
pnpm build
```

---

## 3) `rslib: command not found`

### Symptoms

- `pnpm build:ts` fails with `sh: rslib: command not found`
- Usually happens right after cleaning dependencies

### Root cause

`node_modules` was removed and dependencies were not reinstalled.

### Fix

```bash
pnpm install
pnpm build:ts
# or full
./build.sh
```

---

## 4) Native addon fails to load

### Symptoms

- Warnings like `Failed to load native addon`
- Runtime falls back or build fails depending on call path

### Root cause

- Native `.node` not built/copied
- Architecture mismatch
- Node ABI mismatch
- Unsupported platform

### Fix sequence

```bash
# 1) clean stale binaries
./clean.sh --all

# 2) install deps
pnpm install

# 3) setup toolchain
./setup.sh

# 4) build
./build.sh
```

Verify addon:

```bash
node -e "require('./native/barrel_loader_rs.node'); console.log('ok')"
```

---

## 5) pnpm cache confusion

### Symptoms

- Rebuilds are very fast and seem cached
- You disabled pnpm side-effects cache but still see fast builds

### Explanation

There are two different caches:

1. pnpm side-effects cache (package install related)
2. rspack/rsbuild cache (actual bundler build cache)

Disabling pnpm side-effects cache does **not** disable rspack cache.

### Fix options

Disable pnpm side-effects cache in `.npmrc` (already common in this repo):

```properties
side-effects-cache=false
```

Clear rspack cache for a truly cold build:

```bash
rm -rf node_modules/.cache/rspack
pnpm build
```

---

## 6) Build scripts ignored warning

### Symptoms

- pnpm prints: `Ignored build scripts: core-js...`

### Explanation

This is pnpm’s dependency script approval model. It may be informational and not always a blocker for this project.

### If needed

```bash
pnpm approve-builds
```

Then rerun install/build.

---

## 7) Why output size/file count changes between builds

### Symptoms

- `N files generated in dist` fluctuates
- Bundle size changes slightly between runs

### Common causes

- Entry glob changes in `rslib.config.ts`
- Additional source files included/excluded by glob
- Local modifications in debug/logging code
- Changes in linked package source when using `link:..`

### Check quickly

```bash
git diff -- rslib.config.ts src/
pnpm build:ts
ls -la dist
```

---

## 8) Verbose debugging workflow

Use this when you need to understand exactly what export graph the loader is building.

```bash
BARREL_LOADER_DEBUG=true BARREL_LOADER_VERBOSE=true pnpm build
```

What you get:

- Parse logs (`parse.ts`)
- Recursive resolution logs (`resolve-barrel.ts`)
- Expanded namespace conversion logs (`resolve-utils.ts`)
- Generated `.debug.ts` output files for transformed barrels

---

## 9) Known limitations and practical workarounds

### Direct declaration exports may not be fully transformed

Examples:

```ts
export const x = 1
export function y() {}
```

These are not the primary target of barrel-chain reconstruction.

Workaround:

- Prefer explicit re-export style in barrels:

```ts
export { x, y } from './module'
```

### Option behavior can evolve between versions

If an option seems ignored, verify current implementation in loader pipeline and test with a minimal fixture.

---

## If you still need help

When opening an issue, include:

1. Node version (`node -v`)
2. pnpm version (`pnpm -v`)
3. OS + architecture (`node -p "process.platform + '-' + process.arch"`)
4. Your `rslib.config.ts` loader rule
5. Full error output
6. Minimal reproducible barrel file set
