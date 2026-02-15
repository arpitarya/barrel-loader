#!/bin/bash

# barrel-loader clean script
# Removes build artifacts, dependencies, and temporary files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
CLEAN_DEPS=0
CLEAN_ALL=0
VERBOSE=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --deps)
      CLEAN_DEPS=1
      shift
      ;;
    --all)
      CLEAN_ALL=1
      CLEAN_DEPS=1
      shift
      ;;
    --verbose|-v)
      VERBOSE=1
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --deps               Remove node_modules and Rust cache"
      echo "  --all                Remove everything (deps + all build artifacts)"
      echo "  --verbose, -v        Show detailed output"
      echo "  --help, -h           Show this help message"
      echo ""
      echo "Default (no flags): Removes build artifacts only"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  barrel-loader Clean Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to remove directory/file
remove_item() {
  local item=$1
  local description=$2

  if [ -e "$item" ]; then
    if [ $VERBOSE -eq 1 ]; then
      echo -e "${YELLOW}Removing $description: $item${NC}"
      du -sh "$item" 2>/dev/null || true
    fi
    rm -rf "$item"
    echo -e "${GREEN}✓ Removed $description${NC}"
  else
    if [ $VERBOSE -eq 1 ]; then
      echo -e "${BLUE}⊘ $description not found (already clean)${NC}"
    fi
  fi
}

# Clean build artifacts (always)
echo -e "${YELLOW}Cleaning build artifacts...${NC}"

remove_item "target" "Rust build directory"
remove_item "native" "compiled native addon"
remove_item "dist" "distribution files"
remove_item "build" "build output"

# Clean Node.js build artifacts
remove_item ".pnpm-store" "pnpm store cache"

# Clean temp files
remove_item "*.log" "log files"
remove_item ".DS_Store" "macOS metadata"

echo ""

# Clean dependencies (optional)
if [ $CLEAN_DEPS -eq 1 ]; then
  echo -e "${YELLOW}Cleaning dependencies...${NC}"

  remove_item "node_modules" "Node.js dependencies"

  # Clean Rust incremental cache
  if [ -d "$HOME/.cargo/registry" ] && [ $CLEAN_ALL -eq 1 ]; then
    echo -e "${YELLOW}Cleaning Cargo cache...${NC}"
    if [ $VERBOSE -eq 1 ]; then
      du -sh "$HOME/.cargo/registry" 2>/dev/null || true
    fi
    cargo clean
    echo -e "${GREEN}✓ Cleaned Cargo cache${NC}"
  fi

  echo ""
fi

# Calculate freed space (approximate)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Clean Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $CLEAN_DEPS -eq 1 ]; then
  echo "Cleaned: Build artifacts + dependencies"
  echo ""
  echo "To rebuild:"
  echo "  1. Install dependencies: ${GREEN}pnpm install${NC}"
  echo "  2. Build project:        ${GREEN}pnpm build${NC}"
else
  echo "Cleaned: Build artifacts only"
  echo ""
  echo "To rebuild:"
  echo "  • Run: ${GREEN}pnpm build${NC}"
fi

echo ""
echo "For more aggressive cleaning, use:"
echo "  • ${YELLOW}./clean.sh --deps${NC}     (remove dependencies)"
echo "  • ${YELLOW}./clean.sh --all${NC}      (remove everything)"
echo ""
