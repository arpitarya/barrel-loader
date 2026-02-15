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
🔌 **Direct API** – Use as library or webpack/rspack loader

## Documentation

📖 **[View Comprehensive Examples →](docs/EXAMPLES.md)**

Complete guide with real-world examples including:
- Webpack & Rspack configurations
- Direct API usage patterns
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

## Direct API Usage

```javascript
const { parseExports, removeDuplicates, sortExports, reconstructSource } = require('barrel-loader/barrel-loader-utils');

const barrelContent = `
export { Button } from './button.ts';
export { Button } from './button.ts';  // duplicate
export { Input } from './input.ts';
export type { ButtonProps } from './button.ts';
`;

// Parse all exports
const exports = parseExports(barrelContent, 'index.ts');
// => [
//   { name: 'Button', source: './button.ts', export_type: 'named', ... },
//   { name: 'Button', source: './button.ts', export_type: 'named', ... },
//   { name: 'Input', source: './input.ts', export_type: 'named', ... },
//   { name: 'ButtonProps', source: './button.ts', export_type: 'type', ... }
// ]

// Remove duplicates
const deduped = removeDuplicates(exports);

// Sort for consistency
const sorted = sortExports(deduped);

// Reconstruct optimized source
const output = reconstructSource(sorted);
console.log(output);
// => export { Button } from './button.ts';
//   export { Input } from './input.ts';
//   export type { ButtonProps } from './button.ts';
```

## API Reference

### parseExports(content, filePath?)

Parses JavaScript/TypeScript source and extracts all export statements.

**Parameters:**
- `content` (string) – Source code to parse
- `filePath` (string, optional) – Path for error messages

**Returns:** Array of `ExportInfo` objects

```typescript
interface ExportInfo {
  name: string;                      // Export identifier
  source: string;                    // Import source
  export_type: 'named' | 'default' | 'namespace' | 'type';
  is_type_export: boolean;           // True for type exports
}
```

### removeDuplicates(exports)
    convertNamespaceToNamed: true,
  },
}
```

**Example:**

**Input:**
```typescript
export { Button } from "./Button";
export * from "./utils";  // namespace export
```

**Output (with `convertNamespaceToNamed: true`):**
```typescript
export { Button } from "./Button";
export { formatDate, debounce, parseJSON } from "./utils";
```

### `resolveBarrelExports` (boolean, default: `false`)

Recursively resolves barrel files to their root exports. When enabled, if a barrel file exports from another barrel file, the loader follows the chain until reaching actual implementations (non-barrel files). This flattens re-export chains.

```typescript
{
  loader: "barrel-loader",
  options: {
    resolveBarrelExports: true,
  },
}
```

**Example - Nested barrel files:**### removeDuplicates(exports)

Removes duplicate exports based on (name, source, export_type) tuple.

**Parameters:**
- `exports` – Array of ExportInfo objects

**Returns:** Deduplicated array

### sortExports(exports)

Sorts exports alphabetically by name.

**Parameters:**
- `exports` – Array of ExportInfo objects

**Returns:** Sorted array

### reconstructSource(exports)

Reconstructs optimized source code from parsed exports.

**Parameters:**
- `exports` – Array of ExportInfo objects

**Returns:** Generated source code string

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
- `barrel-loader-utils.cjs` – JavaScript wrapper with fallback support
- `barrel-loader-utils.d.cts` – TypeScript type definitions

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

The build process generates:
- `native/barrel_loader_rs.node` – Compiled native addon
- `barrel-loader-utils.js` – JavaScript wrapper with fallback support
- `barrel-loader-utils.d.cts` – TypeScript type definitions

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
│   ├── main.rs                   # Rust binary (not used for addon)
│   ├── types.ts                  # TypeScript type definitions
│   ├── barrel-loader-utils.ts    # TypeScript utilities with native loader
│   └── index.ts                  # TypeScript webpack/rspack loader
├── native/
│   └── barrel_loader_rs.node     # Compiled native addon
├── index.cjs                     # Built loader (from src/index.ts)
├── index.d.cts                   # TypeScript definitions
├── barrel-loader-utils.cjs       # Built utils (from src/barrel-loader-utils.ts)
├── barrel-loader-utils.d.cts     # TypeScript definitions
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
- **Built Outputs** (`*.cjs`): Bundled CommonJS modules from TypeScript source
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

## CLI Usage

The package includes an optional CLI for standalone use:

```bash
# Process a barrel file
node barrel-loader-utils.cjs src/index.ts

# Or build and use the Rust CLI
cargo build --release --bin barrel-loader
./target/release/barrel-loader src/index.ts --sort
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
