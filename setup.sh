#!/bin/bash

# barrel-loader environment setup script
# Sets up Rust, Node.js, and pnpm for building the project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Minimum versions
MIN_NODE_VERSION="18"
REQUIRED_RUST_CHANNEL="stable"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  barrel-loader Environment Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to compare versions
version_ge() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

# Check and install Rust
echo -e "${YELLOW}Checking Rust installation...${NC}"
if command_exists rustc; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    echo -e "${GREEN}✓ Rust is installed: $RUST_VERSION${NC}"

    # Check if rustup is available
    if command_exists rustup; then
        echo -e "${GREEN}✓ rustup is available${NC}"

        # Update rustup
        echo -e "${YELLOW}Updating rustup...${NC}"
        rustup update

        # Ensure required components are installed
        echo -e "${YELLOW}Installing required components...${NC}"
        rustup component add rustfmt clippy
    else
        echo -e "${YELLOW}⚠ rustup not found. Rust was installed manually.${NC}"
        echo -e "${YELLOW}  Consider reinstalling Rust via rustup for better toolchain management.${NC}"
    fi
else
    echo -e "${RED}✗ Rust is not installed${NC}"
    echo -e "${YELLOW}Installing Rust via rustup...${NC}"

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal
    else
        echo -e "${RED}✗ Unsupported OS: $OSTYPE${NC}"
        echo -e "${YELLOW}Please install Rust manually from https://rustup.rs/${NC}"
        exit 1
    fi

    # Source cargo env
    source "$HOME/.cargo/env"

    # Install required components
    rustup component add rustfmt clippy

    echo -e "${GREEN}✓ Rust installed successfully${NC}"
fi

echo ""

# Check and install Node.js
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    echo -e "${GREEN}✓ Node.js is installed: v$(node --version | cut -d'v' -f2)${NC}"

    if [ "$NODE_VERSION" -ge "$MIN_NODE_VERSION" ]; then
        echo -e "${GREEN}✓ Node.js version is compatible (>= v${MIN_NODE_VERSION})${NC}"
    else
        echo -e "${RED}✗ Node.js version is too old (v${NODE_VERSION}.x < v${MIN_NODE_VERSION}.x)${NC}"
        echo -e "${YELLOW}Please upgrade Node.js to v${MIN_NODE_VERSION} or higher${NC}"
        echo -e "${YELLOW}Visit: https://nodejs.org/${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js v${MIN_NODE_VERSION}+ from https://nodejs.org/${NC}"
    echo -e "${YELLOW}Or use a version manager like nvm or fnm${NC}"
    exit 1
fi

echo ""

# Check and install pnpm
echo -e "${YELLOW}Checking pnpm installation...${NC}"
if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✓ pnpm is installed: $PNPM_VERSION${NC}"
else
    echo -e "${RED}✗ pnpm is not installed${NC}"
    echo -e "${YELLOW}Installing pnpm...${NC}"

    # Install pnpm via npm
    npm install -g pnpm

    if command_exists pnpm; then
        echo -e "${GREEN}✓ pnpm installed successfully: $(pnpm --version)${NC}"
    else
        echo -e "${RED}✗ Failed to install pnpm${NC}"
        exit 1
    fi
fi

echo ""

# Install project dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
pnpm install

echo ""

# Verify rustup toolchain
echo -e "${YELLOW}Verifying Rust toolchain...${NC}"
if [ -f "rust-toolchain.toml" ]; then
    echo -e "${GREEN}✓ rust-toolchain.toml found${NC}"
    rustup show
else
    echo -e "${YELLOW}⚠ rust-toolchain.toml not found${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Environment Setup Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Installed tools:"
echo "  • Rust: $(rustc --version)"
echo "  • Cargo: $(cargo --version)"
echo "  • Node.js: $(node --version)"
echo "  • pnpm: $(pnpm --version)"
echo ""
echo "Next steps:"
echo "  1. Build the project: ${GREEN}pnpm build${NC}"
echo "  2. Run tests: ${GREEN}pnpm test${NC}"
echo "  3. Check code: ${GREEN}pnpm lint${NC}"
echo ""
echo -e "${YELLOW}Note: If this is a new terminal, you may need to restart it or run:${NC}"
echo -e "${YELLOW}  source \$HOME/.cargo/env${NC}"
echo ""
