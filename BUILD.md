# Building barrel-loader

This document describes how to build the Rust NAPI addon for barrel-loader.

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
| `pnpm build` | Build release binary (optimized, slower compile) |
| `pnpm build:debug` | Build debug binary (faster compile, slower runtime) |
| `pnpm build:clean` | Clean and rebuild everything |
| `pnpm clean` | Remove build artifacts |
| `pnpm clean:deps` | Remove build artifacts + dependencies |
| `pnpm clean:all` | Remove everything (nuclear clean) |
| `pnpm test` | Run tests |
| `pnpm lint` | Check code with clippy |
| `pnpm fmt` | Format code with rustfmt |

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

### Using build scripts directly

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
