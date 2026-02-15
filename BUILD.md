# Building barrel-loader

This document describes how to build the barrel-loader project, which includes both Rust NAPI addon and TypeScript source files.

## Project Structure

barrel-loader consists of two main components:
- **Rust NAPI Addon** - Native performance implementation in `src/*.rs`
- **TypeScript Loader** - Webpack/Rspack loader and utilities in `src/*.ts`

The build process compiles both components:
1. Rust code → native Node.js addon (`.node` file)
2. TypeScript code → CommonJS and ESM bundles (`.cjs`, `.mjs`) using rslib

## Automated Setup

The easiest way to get started is using the automated setup script:

**macOS/Linux:**
```bash
./setup.sh
```

**Windows:**
```batch
setup.bat
```

This will automatically:
- ✓ Check and install Rust (via rustup)
- ✓ Verify Node.js is installed (v18+)
- ✓ Install pnpm if needed
- ✓ Install project dependencies with `pnpm install`
- ✓ Configure Rust toolchain with rustfmt and clippy

After running the setup script, you can proceed directly to building the project.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the native addon
pnpm build

# Verify it works
pnpm test
```

## Build Commands

### Using pnpm scripts (cross-platform)

| Command | Description |
|---------|-------------|
| `pnpm build` | Build both Rust addon and TypeScript files |
| `pnpm build:rust` | Build Rust NAPI addon only (cargo build + native copy) |
| `pnpm build:ts` | Build TypeScript files only (using rslib) |
| `pnpm build:debug` | Build debug Rust addon + TypeScript bundles |
| `pnpm build:clean` | Clean and rebuild everything |
| `pnpm test` | Run JavaScript functional tests |
| `pnpm test:rust` | Run Rust unit tests with rstest |
| `pnpm lint` | Lint both TypeScript and Rust code |
| `pnpm lint:ts` | Lint TypeScript with ESLint |
| `pnpm lint:rust` | Lint Rust with clippy |
| `pnpm fmt` | Format both TypeScript and Rust code |
| `pnpm fmt:ts` | Format TypeScript with Prettier |
| `pnpm fmt:rust` | Format Rust with rustfmt |
| `pnpm typecheck` | Type check TypeScript without emitting |
| `pnpm clean` | Remove build artifacts |
| `pnpm clean:deps` | Remove build artifacts + dependencies |
| `pnpm clean:all` | Remove everything (nuclear clean) |

### Cleaning Build Artifacts

**macOS/Linux:**
```bash
# Remove build artifacts only
./clean.sh

# Remove build artifacts + dependencies
./clean.sh --deps

# Remove everything
./clean.sh --all

# With verbose output
./clean.sh --all --verbose
```

**Windows:**
```batch
REM Remove build artifacts only
clean.bat

REM Remove build artifacts + dependencies
clean.bat --deps

REM Remove everything
clean.bat --all
```

### Using build scripts directly (local use only)

#### macOS/Linux

```bash
# Release build (default)
./build.sh

# Debug build
./build.sh --debug

# Clean build
./build.sh --clean

# Verbose output
./build.sh --verbose

# Combined options
./build.sh --debug --clean --verbose

# Show help
./build.sh --help
```

#### Windows

```batch
REM Release build (default)
build.bat

REM Debug build
build.bat --debug

REM Clean build
build.bat --clean

REM Verbose output
build.bat --verbose

REM Help
build.bat --help
```

## Prerequisites

### macOS
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
cargo --version
```

### Linux (Ubuntu/Debian)
```bash
# Install build tools
sudo apt-get install build-essential

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Windows
1. Download Rust installer from https://rustup.rs/
2. Run the installer and follow the instructions
3. Verify installation:
   ```batch
   rustc --version
   cargo --version
   ```

## Rust Toolchain Configuration

The project includes Rust toolchain configuration files that are automatically detected by `rustup`:

### `rust-toolchain.toml`
Specifies the Rust toolchain version and required components:
- **Channel**: `stable` - Uses the latest stable Rust release
- **Components**: `rustfmt`, `clippy` - Code formatter and linter
- **Profile**: `minimal` - Installs only essential components

When you run any `cargo` or `rustup` command in the project directory, rustup automatically uses the toolchain specified in this file.

### `.cargo/config.toml`
Cargo build configuration including:
- Incremental compilation for faster rebuilds
- Platform-specific linker flags for macOS, Linux, and Windows
- Rust flags enforcing no `unsafe` (`-Funsafe-code`)
- Development and release profile optimizations

### `clippy.toml`
Configuration for the Rust linter (clippy):
- Cognitive complexity thresholds
- Function argument limits
- Code quality rules

### `.rustfmt.toml`
Configuration for the Rust code formatter:
- Code style preferences
- Line width and formatting options
- Import organization rules

### Verifying Toolchain

```bash
# Check active toolchain
rustup show

# Should output:
# active toolchain
# ----------------
# name: stable-<platform>
# active because: overridden by '/path/to/barrel-loader/rust-toolchain.toml'
```

## Build Output

After a successful build:

```
native/barrel_loader_rs.node      - Compiled native addon (platform-specific)
index.cjs                         - Webpack/rspack loader
index.d.cts                       - TypeScript loader definitions
barrel-loader-utils.cjs           - JavaScript wrapper with fallback
barrel-loader-utils.d.cts         - TypeScript type definitions for utils
```

### Output Sizes (Release Build)

Typical binary sizes:

- macOS (arm64): ~2.5 MB
- macOS (x64): ~2.8 MB
- Linux (x64): ~2.2 MB
- Windows (x64): ~2.6 MB

## Troubleshooting

### Build fails with "cargo not found"

Ensure Rust is installed and on your PATH:

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Windows - Use rustup installer
```

### Build fails with compiler errors

Update your Rust toolchain:

```bash
rustup update
```

### Clean build fails

Sometimes a clean build is needed:

```bash
# Full clean
pnpm build:clean

# Or manually
rm -rf target native
pnpm build
```

### Native addon doesn't load

The module includes a JavaScript fallback. If the native addon fails:

```bash
# Rebuild
pnpm build

# Verify
node -e "console.log(require('./native/barrel_loader_rs.node'))"
```

If it still fails, check:
1. Node.js version: `node --version` (must be 18+)
2. Architecture match: `node -p "process.platform + '-' + process.arch"`
3. Platform compatibility

## TypeScript and Bundler Configuration

### TypeScript Setup

The project uses TypeScript for the loader implementation with the following configuration:

**`tsconfig.json`**
- Target: ES2020 for modern Node.js compatibility
- Module: CommonJS for Node.js/webpack/rspack
- Strict type checking enabled
- Source maps for debugging

**TypeScript Source Files:**
- `src/types.ts` - Type definitions
- `src/barrel-loader-utils.ts` - Utility functions with native addon loader
- `src/index.ts` - Main webpack/rspack loader

### rslib Bundler

The project uses [rslib](https://github.com/web-infra-dev/rslib) for bundling TypeScript to CommonJS modules.

**`rslib.config.ts`** configures:
- Two separate builds: `index.cjs` and `barrel-loader-utils.cjs`
- CommonJS format with `.cjs` extension
- Node.js target
- Source maps enabled

**Build Process:**
```bash
# Build TypeScript only
pnpm build:ts

# Output:
# - index.cjs (webpack/rspack loader)
# - barrel-loader-utils.cjs (utilities with native addon)
```

**Why rslib?**
- Built on Rspack - extremely fast builds
- Simple configuration for library builds
- Native support for CommonJS output
- Excellent TypeScript support

### Code Quality Tools

**ESLint:** TypeScript linting with recommended rules
```bash
pnpm lint:ts        # Check TypeScript code
pnpm lint:ts --fix  # Auto-fix issues
```

**Prettier:** Code formatting
```bash
pnpm fmt:ts      # Format TypeScript files
pnpm fmt:check   # Check formatting without changes
```

**TypeScript Compiler:**
```bash
pnpm typecheck   # Type check without emitting files
```

### Rust Testing with rstest

The project uses [rstest](https://crates.io/crates/rstest) for parametrized testing:

**Cargo.toml** includes:
```toml
[dev-dependencies]
rstest = "0.23"
```

**Example parametrized test:**
```rust
#[rstest]
#[case("/path/to/index.ts", true)]
#[case("/path/to/index.js", true)]
#[case("/path/to/component.ts", false)]
fn test_is_barrel_file_parametrized(
    #[case] file_path: &str,
    #[case] expected: bool
) {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    assert_eq!(loader.is_barrel_file(file_path), expected);
}
```

**Run tests:**
```bash
pnpm test:rust   # Run all Rust tests with rstest
```

**Test output shows parametrized cases:**
```
running 17 tests
test tests::test_is_barrel_file_parametrized::case_1 ... ok
test tests::test_is_barrel_file_parametrized::case_2 ... ok
test tests::test_is_barrel_file_parametrized::case_3 ... ok
test tests::test_export_types::case_1 ... ok
test tests::test_export_types::case_2 ... ok
```

## Development Workflow

### Making Changes

1. Edit Rust code in `src/lib.rs` or `src/main.rs`
2. Build the addon: `pnpm build`
3. Test: `pnpm test`
4. Check code quality: `pnpm lint`
5. Format code: `pnpm fmt`

### Release Build Checklist

```bash
# 1. Ensure all tests pass
pnpm test

# 2. Lint and format code
pnpm lint
pnpm fmt

# 3. Clean build
pnpm build:clean

# 4. Verify size is reasonable
ls -lh native/barrel_loader_rs.node

# 5. Test the built addon
pnpm test

# 6. Verify it can be loaded by Node.js
node -e "const addon = require('./barrel-loader-utils.cjs'); console.log(addon)"
```

## Platform-Specific Notes

### macOS ARM64 (M1/M2/M3)

Native support. The build will automatically detect your architecture.

```bash
./build.sh                    # Builds for ARM64

# To build for x86_64:
rustup target add x86_64-apple-darwin
cargo build --release --target x86_64-apple-darwin
```

### Linux

Tested on Ubuntu 20.04+. Ensure you have build tools:

```bash
sudo apt-get install build-essential
pnpm build
```

### Windows

Requires Visual Studio Build Tools or MinGW. The build script handles detection.

```batch
build.bat                     # Builds for current architecture
```

## Performance Tips

1. **Use release builds** – Rust code is 10-100x slower in debug builds
2. **Clean before major rebuilds** – `pnpm build:clean`
3. **Parallel compilation** – `cargo` uses all CPU cores by default

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Native Addon

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
```

## See Also

- [NAPI Documentation](https://napi.rs/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Cargo Guide](https://doc.rust-lang.org/cargo/)
- [Node.js Native Addons](https://nodejs.org/api/addons.html)
