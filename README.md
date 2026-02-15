# barrel-loader

⚡ **High-performance barrel file loader for webpack/rspack** – Built with Rust and NAPI for native Node.js performance.

Automatically optimizes barrel files (index.ts/js/tsx/jsx) by removing duplicates, resolving recursive exports, and maintaining clean re-export chains.

## Features

✨ **Native Performance** – Rust-based implementation with NAPI bindings
🚀 **10-100x Faster** – Compiled to machine code; outperforms JavaScript regex parsers
🔄 **Recursive Resolution** – Follows export chains to find root sources automatically  
🎯 **Webpack/Rspack Compatible** – Drop-in loader for both bundlers
🧹 **Smart Deduplication** – Removes duplicate exports intelligently
📊 **Type-Safe** – Separates type exports from value exports
⚙️ **Zero Configuration** – Works out of the box with sensible defaults

## Documentation

📖 **[View Comprehensive Examples →](docs/EXAMPLES.md)**

Complete guide with real-world examples including:
- Webpack & Rspack configurations
- TypeScript integration
- Monorepo setups
- Troubleshooting guide

## Installation

```bash
pnpm add barrel-loader
# or
npm install barrel-loader
```

## Quick Start

### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        use: 'barrel-loader'
      }
    ]
  }
};
```

### Rspack Configuration

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        use: 'barrel-loader'
      }
    ]
  }
};
```

## Loader Options

Common options:
- `sort` – Sort exports alphabetically
- `removeDuplicates` – Remove duplicate exports
- `resolveBarrelFiles` – Resolve nested barrel files
- `verbose` – Enable debug logging

See [docs/EXAMPLES.md](docs/EXAMPLES.md) for full configuration examples and option details.

## Building from Source

### Quick Setup

Use the automated setup script to install all prerequisites:

```bash
./setup.sh
```

The setup script will:
- ✓ Install Rust (via rustup) if not present
- ✓ Verify Node.js version (18+)
- ✓ Install pnpm if not present
- ✓ Install project dependencies
- ✓ Set up Rust toolchain with required components

### Manual Prerequisites

- Rust 1.70+ ([rustup.rs](https://rustup.rs/))
- Node.js 18+
- pnpm (recommended) or npm

### Quick Build

```bash
# Install dependencies
pnpm install

# Build native addon (release optimized)
pnpm build

# Build debug version (faster compile)
pnpm build:debug

# Clean and rebuild
pnpm build:clean
```

### Cleaning Build Artifacts

```bash
# Remove build artifacts only
pnpm clean
# or
./clean.sh

# Remove build artifacts + dependencies
pnpm clean:deps
# or
./clean.sh --deps

# Remove everything (nuclear clean)
pnpm clean:all
# or
./clean.sh --all
```

### Build Scripts

For advanced build options, use the dedicated build script:

```bash
# Release build
./build.sh

# Debug build
./build.sh --debug

# Clean and rebuild
./build.sh --clean

# Verbose output
./build.sh --verbose

# All options
./build.sh --debug --clean --verbose

# Help
./build.sh --help
```

### Build Output

The build process generates:
- `native/barrel_loader_rs.node` – Compiled native addon binary
- `dist/index.cjs` – CommonJS bundle
- `dist/index.mjs` – ESM bundle
- `dist/index.d.cts` – TypeScript type definitions

### Testing & Quality

```bash
# Run tests
pnpm test

# Check for issues
pnpm lint

# Format code
pnpm fmt

# Run tests
pnpm test

# Check for issues
pnpm lint

# Format code
pnpm fmt
```

## Performance Comparison

Benchmarks on 1000 exports across 10 sources:

| Implementation | Time |
|---|---|
| JavaScript (regex) | ~2.5ms |
| Rust (NAPI) | ~0.1ms |
| **Speedup** | **~25x** |

Larger barrel files show even greater improvements due to linear scaling vs JavaScript's overhead.

## Supported Export Formats

### Value Exports
```typescript
export { foo, bar } from "./module";
export { default } from "./module";
export { default as Component } from "./module";
export * from "./module";
export * as utils from "./utils";
```

### Type Exports
```typescript
export type { User, Profile } from "./types";
export type { default } from "./module";
export type * from "./types";
export type * as Types from "./types";
```

## How It Works

1. **Parse** – Rust NAPI function extracts export statements using compiled regex
2. **Deduplicate** – O(n) set-based algorithm removes duplicate export tuples
3. **Sort** – Alphabetically reorganize for consistency (optional)
4. **Reconstruct** – Group exports by source and type, regenerate source

All operations run as native compiled code via NAPI binding.

## Webpack Integration

The loader automatically:
- Resolves circular references in barrel files
- Deduplicates re-exported symbols
- Separates type from value exports
- Maintains compatibility with TypeScript/TSX syntax

## Troubleshooting

### Native addon not loading

The module includes a JavaScript fallback. If the native addon fails:

```
Failed to load native addon, falling back to JavaScript
```

**Solution:** Rebuild the addon:

```bash
pnpm build
```

### Build errors

Ensure Rust and Node.js are installed:

```bash
rustc --version   # Should output Rust version
node --version    # Should be 18+
pnpm --version
```

Then clean and rebuild:

```bash
rm -rf node_modules
pnpm install
pnpm build
```

### Module not found

Check that the package is installed correctly:

```bash
pnpm list barrel-loader
```

If missing, reinstall:

```bash
pnpm add barrel-loader
```

## Development

### Project Structure

```
barrel-loader/
├── src/
│   ├── lib.rs                    # Rust NAPI addon implementation
│   ├── barrel-loader.types.ts    # TypeScript type definitions
│   └── index.ts                  # TypeScript webpack/rspack loader
├── native/
│   └── barrel_loader_rs.node     # Compiled native addon
├── dist/
│   ├── index.cjs                 # Built loader (CommonJS)
│   ├── index.mjs                 # Built loader (ESM)
│   └── index.d.cts               # TypeScript definitions
├── build.rs                      # NAPI build script
├── Cargo.toml                    # Rust package manifest
├── tsconfig.json                 # TypeScript configuration
├── rslib.config.ts               # rslib bundler configuration
├── package.json                  # npm package manifest
├── rust-toolchain.toml           # Rust toolchain version
├── clippy.toml                   # Rust linter config
├── .rustfmt.toml                 # Rust formatter config
├── eslint.config.mjs             # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .cargo/
│   └── config.toml               # Cargo build configuration
├── setup.sh / setup.bat          # Automated environment setup
├── build.sh / build.bat          # Build scripts
└── clean.sh / clean.bat          # Clean scripts
```

**Key Components:**
- **Rust Source** (`src/lib.rs`): Core parsing and processing logic compiled to native addon
- **TypeScript Source** (`src/*.ts`): Loader and utilities written in TypeScript
- **Built Outputs** (`dist/*.cjs`, `dist/*.mjs`): Bundled CommonJS and ESM modules
- **Configuration**: Multiple config files for Rust, TypeScript, linting, and bundling

### Testing

```bash
pnpm test                    # Run JavaScript functional tests
pnpm test:rust               # Run Rust unit tests with rstest
pnpm test -- --verbose       # With output
```

### Code Quality

```bash
pnpm lint               # Check for issues
pnpm fmt                # Format code
```

## Supported Platforms

**Operating Systems:**
- Linux (x64, arm64)
- macOS (x64, arm64/Apple Silicon)

**Note:** Windows is not officially supported. The native Rust module is built for Unix-like systems.

**Node.js Versions:**
- Node.js 18+ (LTS)
- Pre-built binaries available via npm/pnpm

## Further Reading

- **[Comprehensive Examples](docs/EXAMPLES.md)** – Real-world usage patterns and configurations
- **[Publishing Guide](PUBLISHING.md)** – Release and distribution workflow
- **[Build Documentation](BUILD.md)** – Detailed build instructions

## License

ISC

## Contributing

Contributions welcome! Please submit PRs with:
- Tests for new features
- Benchmark comparisons if performance-related
- Documentation updates
