#!/bin/bash

# barrel-loader build script (local use)
# Compiles Rust NAPI addon and TypeScript bundles for webpack/rspack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BUILD_TYPE="release"
VERBOSE=0
CLEAN=0
BUILD_TS=1

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --debug)
      BUILD_TYPE="debug"
      shift
      ;;
    --release)
      BUILD_TYPE="release"
      shift
      ;;
    --clean)
      CLEAN=1
      shift
      ;;
    --verbose|-v)
      VERBOSE=1
      shift
      ;;
    --rust-only|--skip-npm|--skip-ts)
      BUILD_TS=0
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --debug              Build debug binary (faster compile, slower runtime)"
      echo "  --release            Build release binary (default, optimized)"
      echo "  --clean              Clean build artifacts before building"
      echo "  --verbose, -v        Show detailed build output"
      echo "  --rust-only          Build only the Rust addon (skip npm build)"
      echo "  --help, -h           Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Print header
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  barrel-loader Build Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$CI" ]; then
  echo -e "${YELLOW}Note: build.sh is intended for local use. CI should run pnpm build or cargo build directly.${NC}"
fi

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v cargo &> /dev/null; then
  echo -e "${RED}✗ Rust/Cargo not found${NC}"
  echo "Install from: https://rustup.rs/"
  exit 1
fi
echo -e "${GREEN}✓ Cargo$(NC) $(cargo --version)"

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js$(NC) $(node --version)"

# Clean if requested
if [ $CLEAN -eq 1 ]; then
  echo -e "\n${YELLOW}Cleaning build artifacts...${NC}"
  cargo clean
  rm -rf target/
  echo -e "${GREEN}✓ Cleaned${NC}"
fi

# Create native directory if it doesn't exist
echo -e "\n${YELLOW}Setting up directories...${NC}"
mkdir -p native
echo -e "${GREEN}✓ Created native/$(NC)"

# Build
echo -e "\n${YELLOW}Building Rust NAPI addon (${BUILD_TYPE})...${NC}"

if [ $VERBOSE -eq 1 ]; then
  if [ "$BUILD_TYPE" = "release" ]; then
    cargo build --release
  else
    cargo build
  fi
else
  if [ "$BUILD_TYPE" = "release" ]; then
    cargo build --release 2>&1 | grep -E "^(Compiling|Finished|error|warning:|   Compiling)" || true
  else
    cargo build 2>&1 | grep -E "^(Compiling|Finished|error|warning:|   Compiling)" || true
  fi
fi

# Determine output directory
if [ "$BUILD_TYPE" = "release" ]; then
  TARGET_DIR="target/release"
else
  TARGET_DIR="target/debug"
fi

# Find and copy the .node file
echo -e "\n${YELLOW}Copying native addon...${NC}"

# Determine platform-specific library name
case "$(uname -s)" in
  Darwin*)
    LIB_NAME="barrel_loader.dylib"
    NODE_NAME="barrel_loader_rs.node"
    ;;
  Linux*)
    LIB_NAME="barrel_loader.so"
    NODE_NAME="barrel_loader_rs.node"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    LIB_NAME="barrel_loader.dll"
    NODE_NAME="barrel_loader_rs.node"
    ;;
  *)
    LIB_NAME="barrel_loader.so"
    NODE_NAME="barrel_loader_rs.node"
    ;;
esac

# Try to find and copy the compiled library
if [ -f "$TARGET_DIR/lib$LIB_NAME" ]; then
  cp "$TARGET_DIR/lib$LIB_NAME" "native/$NODE_NAME"
  echo -e "${GREEN}✓ Copied lib$LIB_NAME → native/$NODE_NAME${NC}"
elif [ -f "$TARGET_DIR/$LIB_NAME" ]; then
  cp "$TARGET_DIR/$LIB_NAME" "native/$NODE_NAME"
  echo -e "${GREEN}✓ Copied $LIB_NAME → native/$NODE_NAME${NC}"
else
  echo -e "${RED}✗ Could not find compiled library${NC}"
  echo "Expected: $TARGET_DIR/lib$LIB_NAME or $TARGET_DIR/$LIB_NAME"
  exit 1
fi

# Verify the addon loads
echo -e "\n${YELLOW}Verifying addon...${NC}"
if node -e "require('./native/$NODE_NAME'); console.log('✓ Addon loads successfully');" 2>/dev/null; then
  echo -e "${GREEN}✓ Addon verification passed${NC}"
else
  echo -e "${YELLOW}⚠ Could not verify addon loading (may be expected on cross-platform builds)${NC}"
fi

# Build TypeScript outputs
if [ $BUILD_TS -eq 1 ]; then
  echo -e "\n${YELLOW}Building TypeScript bundles...${NC}"
  if command -v pnpm &> /dev/null; then
    pnpm build:ts
  elif command -v npm &> /dev/null; then
    npm run build:ts
  else
    echo -e "${RED}✗ pnpm or npm not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ TypeScript build complete${NC}"
fi

# Print summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Build Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Output: $(pwd)/native/$NODE_NAME"
echo "Size: $(du -h "native/$NODE_NAME" | cut -f1)"
echo ""
echo "Next steps:"
echo "  • Test: pnpm test"
echo "  • Lint: pnpm lint"
echo "  • Format: pnpm fmt"
echo ""
