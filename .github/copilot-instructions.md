# GitHub Copilot Instructions for barrel-loader

## Project Overview

**barrel-loader** is a high-performance barrel file loader for webpack/rspack that optimizes barrel files (index.ts/js/tsx/jsx) by removing duplicates, resolving recursive exports, and maintaining clean re-export chains. It achieves 10-100x performance improvement over JavaScript-based parsers through native Rust implementation.

## Tech Stack

- **Rust**: Core parsing and optimization logic (src/lib.rs)
- **NAPI-RS**: Node.js bindings for Rust code (v2.16)
- **TypeScript**: Modular loader and utilities (src/*.ts)
- **Build Tools**: rslib (TypeScript bundling), cargo (Rust compilation)

## Architecture

### Hybrid Rust + TypeScript Project

1. **Rust Core** (`src/lib.rs`):
   - Native module compiled to `barrel_loader_rs.node`
   - Exports NAPI bindings via `#[napi]` macros
   - Implements: `parseExports`, `reconstructSource`, `sortExports`, `removeDuplicates`
   - Key structs: `ExportInfo`, `BarrelLoaderOptions`

2. **TypeScript Modules** (Modular architecture, each ~20-50 lines):
   - **index.ts** - Export-only entry point for the loader
   - **barrel-loader.ts** - Main webpack/rspack loader implementation
   - **parse.ts** - Export parsing from Rust addon
   - **dedupe.ts** - Deduplication of export entries
   - **sort.ts** - Sorting exports by source and name
   - **reconstruct.ts** - Reconstruction of optimized source code
   - **resolve-barrel.ts** - Recursive barrel file resolution
   - **resolve-utils.ts** - Helper utilities for file resolution
   - **transform.ts** - Re-export aggregator for transformation functions
   - **barrel-loader-utils.ts** - Re-export aggregator for public API
   - **native-addon.ts** - Native Rust addon loading with fallback

3. **Type Definitions** (`src/types.ts`):
   - Core type definitions for loader and exports
   - Webpack/Rspack loader context types

## Key Components

### ExportInfo Structure
```typescript
{
  specifier: string;      // Export name (e.g., "MyComponent")
  source: string;         // Import source (e.g., "./components/MyComponent")
  export_type: string;    // "named" | "default" | "namespace"
  is_type_export: boolean;// TypeScript type vs value export
  line: number;           // Line number in source file
}
```

### Loader Options
- `optimize`: Enable optimization (default: true)
- `sort`: Sort exports alphabetically (default: false)
- `remove_duplicates`: Remove duplicate exports (default: true)
- `verbose`: Enable logging (default: false)
- `convert_namespace_to_named`: Convert `export * as` to named exports (default: false)
- `resolve_barrel_exports`: Recursively resolve barrel files (default: false)

## Development Patterns

### Rust Code Guidelines

1. **Safety**: `unsafe_code = "forbid"` in Cargo.toml
2. **Linting**: Pedantic, nursery, and perf clippy lints enabled
3. **NAPI Bindings**: Use `#[napi]` and `#[napi(object)]` for exports
4. **Error Handling**: Return `Result<T, String>` for fallible operations
5. **Performance**: Release builds use LTO, opt-level=3, single codegen unit
6. **File Size**: Keep files under 100 lines when possible; split into modules if needed

### TypeScript Code Guidelines

1. **Type Safety**: All exports must have proper TypeScript types
2. **Loader Pattern**: Follow webpack loader conventions (use `this` context)
3. **File System**: Use injected `fs` parameter for testability
4. **Path Resolution**: Always use `path.resolve()` for absolute paths
5. **Circular Detection**: Track visited files to prevent infinite loops
6. **Module Size**: Target 20-50 lines per file for maximum clarity
7. **Single Responsibility**: Each module should do one thing well
8. **Export Aggregation**: Use re-export files for public API boundaries
9. **Export Placement**: Always place exports at the end of the file, never inline with functions

### Code Organization

- **File Size Target**: Modules are 20-50 lines (with some at 56 lines for utilities)
- **Structure**: Imports → Implementation → Exports (always at end)
- **Modularity**: Each TypeScript file has a single clear responsibility
- **Separation**: Utilities, parsing, transformation, and resolution are separate modules
- **Re-exports**: Aggregator files bundle related functionality for the public API
- **Entry Point**: index.ts contains only re-exports, not implementation
- **Architecture**: Transform → Dedupe → Sort → Reconstruct pipeline for optimization
- **Export Style**: Use named exports at end of file, never inline `export function` declarations

### Naming Conventions

- Rust: Snake case (`parse_exports`, `is_barrel_file`)
- TypeScript: Camel case (`parseExports`, `isBarrelFile`)
- Types: Pascal case (`ExportInfo`, `BarrelLoaderOptions`)
- Constants: Upper snake case (rare in this project)

## Configuration & Schema

### Schema Management
- **biome.json**: Uses relative path to installed package schema: `./node_modules/@biomejs/biome/schemas/schema.json`
  - Always pulls from the installed version, not hardcoded URLs
  - Ensures IDE intellisense matches the actual linter version
  - Updates automatically when dependencies are upgraded

## Supported Platforms

**Operating Systems:**
- **Linux** (x64, arm64)
- **macOS** (x64, arm64/Apple Silicon)

**Note:** Windows is not officially supported. The native Rust module is built for Unix-like systems.

## Build System

### Build Scripts
- `pnpm build`: Full build (Rust → TypeScript)
- `pnpm build:rust`: Compile Rust to native addon (./build.sh)
- `pnpm build:ts`: Bundle TypeScript with rslib
- `pnpm build:debug`: Debug build (no optimizations)

### Output Locations
- Rust: `native/barrel_loader_rs.node` (copied from target/release)
- TypeScript: `dist/index.cjs`, `dist/barrel-loader-utils.cjs`
- Types: `dist/index.d.cts`, `dist/barrel-loader-utils.d.cts`

## Testing

- Rust tests: `rstest` framework in `src/lib.rs`
- Test file: `test.cjs` for integration testing
- Run: `cargo test` for Rust, `node test.cjs` for integration

## Common Workflows

### Adding New Export Parser
1. Add regex pattern in Rust `lib.rs` (e.g., `parse_named_export`)
2. Update `parse_exports` function to handle new pattern
3. Ensure `ExportInfo` captures all necessary data
4. Add test cases using `#[rstest]`
5. Rebuild: `pnpm build:rust`

### Modifying Loader Behavior
1. Update `src/barrel-loader.ts` main loader function
2. Adjust `resolveBarrelExportsRecursive` in `src/resolve-barrel.ts` if needed
3. Update `BarrelLoaderOptions` in `src/types.ts`
4. Rebuild: `pnpm build:ts`

### Performance Optimization
1. Profile target code areas (Rust side preferred)
2. Use `cargo flamegraph` or benchmarks
3. Apply Rust optimizations (iterators, zero-copy, etc.)
4. Test with `pnpm build` (release mode required)

## Important Files

- `src/lib.rs`: Core Rust implementation (511 lines)
- `src/index.ts`: Export-only entry point (7 lines)
- `src/barrel-loader.ts`: Main webpack/rspack loader (42 lines)
- `src/barrel-loader.types.ts`: TypeScript type definitions (52 lines)
- `src/barrel-loader-utils.ts`: Direct API re-export aggregator (8 lines)
- `src/utils/parse.ts`: Export parsing from Rust addon (25 lines)
- `src/utils/dedupe.ts`: Deduplication logic (31 lines)
- `src/utils/sort.ts`: Sorting logic (24 lines)
- `src/utils/reconstruct.ts`: Reconstruction logic (38 lines)
- `src/utils/resolve-barrel.ts`: Recursive barrel resolution (47 lines)
- `src/utils/resolve-utils.ts`: Resolution helper utilities (56 lines)
- `src/utils/native-addon.ts`: Native addon loading (17 lines)
- `Cargo.toml`: Rust package configuration
- `package.json`: Node.js package configuration
- `rslib.config.ts`: TypeScript bundler config
- `build.rs`: NAPI build script
- `build.sh`: Rust compilation script

## Code Suggestions

### When suggesting Rust code:
- Follow strict Clippy lints (pedantic, nursery, perf)
- Use `#[must_use]` for pure functions
- Avoid allocations where possible (use `&str` over `String`)
- Add NAPI bindings with `#[napi]` for exposed functions
- Include documentation comments for public APIs

### When suggesting TypeScript code:
- Match existing coding style (no semicolons, single quotes)
- Use modern ES features (optional chaining, nullish coalescing)
- Properly type all function parameters and returns
- Handle edge cases (empty files, circular deps, missing files)
- Add JSDoc comments for exported functions

### When suggesting tests:
- Use `#[rstest]` for parameterized Rust tests
- Test edge cases: empty input, malformed syntax, circular refs
- Verify both value and type exports are handled correctly
- Check performance on large barrel files

## Dependencies Management

- **Rust**: Add to `Cargo.toml` `[dependencies]`
- **Node.js**: Add via `pnpm add <package>`
- **NAPI**: Keep versions synchronized (napi, napi-derive, napi-build)

## Release Process

1. Update version in both `Cargo.toml` and `package.json` (MUST match exactly)
2. Run `pnpm build` to ensure clean build
3. Test with `node test.cjs` and `cargo test`
4. Commit changes: `git commit -m "chore: version bump to x.y.z"`
5. Follow [PUBLISHING.md](../PUBLISHING.md) for detailed publishing steps

The PUBLISHING.md file contains:
- Pre-publish checklist and testing requirements
- Version sync requirements (Cargo.toml ↔ package.json)
- Manual and GitHub Release publishing workflows
- Native module distribution considerations
- Cross-platform build guidance
- Troubleshooting common publishing issues

## Performance Considerations

- Rust compilation is O(n) on source size, very fast
- Recursive resolution can be expensive; implement visited tracking
- File I/O is the bottleneck; cache results when possible
- Native addon initialization has small overhead (~1ms)

## Known Patterns

### Barrel File Detection
Files matching: `index.{ts,tsx,js,jsx}`

### Export Types Handled
- `export { foo } from './source'` - Named export
- `export { default as foo } from './source'` - Default re-export
- `export * from './source'` - Namespace export
- `export type { Foo } from './source'` - Type-only export
- `export * as namespace from './source'` - Namespace alias

### Not Handled (by design)
- Direct declarations: `export const foo = ...`
- Inline exports: `export function foo() {...}`
- Dynamic imports: `export * from getPath()`

---

**Last Updated**: February 2026 (after Rust migration)
