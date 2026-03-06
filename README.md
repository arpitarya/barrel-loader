# barrel-loader

High-performance barrel file optimization for webpack and rspack, powered by Rust + NAPI.

`barrel-loader` rewrites `index.ts/js/tsx/jsx` barrel files into clean, explicit, deduplicated exports. It is designed for large codebases where deeply nested `export *` chains can slow builds and create noisy bundles.

---

## Table of Contents

- [What this solves](#what-this-solves)
- [How it works](#how-it-works)
- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Loader options](#loader-options)
- [Examples](#examples)
- [Behavior notes](#behavior-notes)
- [Debugging](#debugging)
- [Build from source](#build-from-source)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## What this solves

In many projects, barrel files gradually become chains of wildcard exports:

```ts
// src/index.ts
export * from './components'
export * from './hooks'

// src/components/index.ts
export * from './button'
export * from './input'
```

This creates a few common issues:

- Duplicate re-exports from different paths
- Harder-to-predict export surfaces
- Slower parsing and transform work in large projects
- Mixed value/type export handling edge cases

`barrel-loader` resolves these by parsing and flattening export graphs, then reconstructing a normalized barrel output.

---

## How it works

Pipeline at build time:

1. Parse exports (native Rust parser)
2. Resolve nested barrels recursively
3. Expand namespace exports when configured
4. Remove duplicates
5. Sort output deterministically
6. Reconstruct the final barrel source

Core execution path is native (Rust + NAPI), with selective JavaScript handling around integration logic.

---

## Features

- Native Rust parsing and transforms via NAPI
- Webpack + rspack loader compatibility
- Recursive barrel resolution
- Namespace-to-named expansion support
- Type-aware export reconstruction
- Deterministic output ordering
- Verbose and debug logging modes

---

## Install

```bash
pnpm add @apec1/barrel-loader
# or
npm install @apec1/barrel-loader
```

Runtime requirements:

- Node.js >= 18
- macOS or Linux (Windows is not officially supported)

---

## Quick start

### webpack

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        use: [
          {
            loader: '@apec1/barrel-loader',
            options: {
              verbose: false,
              convertNamespaceToNamed: true
            }
          }
        ]
      }
    ]
  }
}
```

### rspack

```js
// rspack.config.mjs
export default {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        use: [
          {
            loader: '@apec1/barrel-loader',
            options: {
              verbose: false,
              convertNamespaceToNamed: true
            }
          }
        ]
      }
    ]
  }
}
```

---

## Loader options

```ts
type BarrelLoaderOptions = {
  resolveBarrelFiles?: boolean
  removeDuplicates?: boolean
  sort?: boolean
  convertNamespaceToNamed?: boolean
  verbose?: boolean
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `resolveBarrelFiles` | `boolean` | `true` | Resolve nested barrel chains recursively |
| `removeDuplicates` | `boolean` | `true` | Deduplicate repeated exports |
| `sort` | `boolean` | `false` | Sort exports deterministically |
| `convertNamespaceToNamed` | `boolean` | `false` | Convert `export *` to explicit named exports when resolvable |
| `verbose` | `boolean` | `false` | Emit loader stage logs |

---

## Examples

### 1) Flatten nested barrels

**Input**

```ts
// src/index.ts
export * from './ui'

// src/ui/index.ts
export * from './button'
export * from './input'
```

**Typical output intent**

```ts
export { Button } from './ui/button'
export { Input } from './ui/input'
```

### 2) Convert namespace exports to named exports

With `convertNamespaceToNamed: true`:

```ts
// before
export * from './file'

// after (when analyzable)
export { fnA, fnB, fnC } from './file'
```

### 3) Preserve type exports

```ts
// source
export * from './runtime'
export * from './types'

// output keeps value/type semantics distinct
export { run } from './runtime'
export type { User, Session } from './types'
```

### 4) Enable trace-level diagnostics for local debugging

```bash
BARREL_LOADER_DEBUG=true pnpm build
```

This enables detailed logs from parser/resolver stages and writes debug output files for transformed barrels.

More examples: [docs/EXAMPLES.md](docs/EXAMPLES.md)

---

## Behavior notes

- The loader targets barrel-like entry files (`index.ts/js/tsx/jsx`) in your rule configuration.
- Current transforms are export-focused; direct declaration rewriting is intentionally limited.
- Native addon load failures can surface as fallback warnings, but build behavior depends on where the failure occurs.

---

## Debugging

Environment flags:

- `BARREL_LOADER_DEBUG=true` → deep debug logs + `.debug.ts` outputs for transformed files
- `BARREL_LOADER_VERBOSE=true` → verbose parse/resolve logging

Example:

```bash
BARREL_LOADER_DEBUG=true BARREL_LOADER_VERBOSE=true pnpm build
```

---

## Build from source

### Fast path

```bash
./setup.sh
./build.sh
```

### Common scripts

```bash
pnpm build        # Rust + TypeScript
pnpm build:rust   # Rust only
pnpm build:ts     # TypeScript bundles only
pnpm build:debug  # Debug Rust build + TypeScript

pnpm version:bump patch  # Bump patch in package.json + Cargo.toml
pnpm version:check       # Ensure versions are in sync
pnpm release:verify      # Version check + tests + full build

pnpm test         # JS integration checks
pnpm test:rust    # Rust tests
pnpm lint         # biome + clippy
pnpm fmt          # biome + rustfmt
```

### Build artifacts

- `native/barrel_loader_rs.node`
- `dist/index.cjs`
- `dist/index.mjs`
- `dist/index.d.ts`

---

## Architecture

### Rust side

- `src/lib.rs` – top-level native module
- `src/types.rs` – shared NAPI object shapes
- `src/rs_utils/parser/*` – export parsing
- `src/rs_utils/deduplication.rs` – dedupe logic
- `src/rs_utils/sorting.rs` – deterministic sort
- `src/rs_utils/reconstruction/*` – source regeneration

### TypeScript side

- `src/barrel-loader.ts` – loader orchestration
- `src/ts-utils/resolve-barrel.ts` – recursive traversal
- `src/ts-utils/resolve-utils.ts` – export expansion helpers
- `src/ts-utils/native-addon.ts` – native addon bridge
- `src/index.ts` – package entry and exports

### Bundling

- `rslib` emits CJS + ESM bundles to `dist/`
- Native `.node` addon is copied to `native/` and `dist/` during build

---

## Troubleshooting

A full troubleshooting guide is available here:

➡️ [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

It includes fixes for:

- Rust files accidentally parsed by rslib/rspack
- Native addon field mismatch errors (`exportType` vs `export_type`)
- `rslib: command not found` after cleaning dependencies
- pnpm side-effects cache vs rspack build cache confusion
- Native addon load failures and clean rebuild strategy

---

## Contributing

Contributions are welcome.

Recommended contribution workflow:

1. Open an issue describing the problem/feature
2. Add or update tests (`pnpm test`, `pnpm test:rust`)
3. Keep docs in sync (`README`, `docs/*`)
4. Run lint/format before opening PR

Release and publish details: [PUBLISHING.md](PUBLISHING.md)

---

## License

MIT
