# Copilot Instructions

This file provides coding guidelines and instructions for GitHub Copilot when working on the Sentenel project.

## Project Context

- **Polyglot Project**: Python 3.14, Node.js 24, and Rust
- **Package Managers**: 
  - Python: PDM with uv backend
  - JavaScript/TypeScript: pnpm
  - Rust: Cargo
- **Testing Frameworks**: 
  - TypeScript/JavaScript: Rstest
  - Python: pytest
  - Rust: cargo test
- **Notebooks**: Jupyter (IPython)

## Code Style Standards

### General
- **Indentation**: 2 spaces (all files)
- **Line Endings**: LF
- **Final Newline**: Always include
- **Trailing Whitespace**: Trim (except Markdown files)
- **Line Length**: 120 characters max (Python), no hard limit (TypeScript)

### Python
- **Target Version**: Python 3.14
- **Formatter**: Ruff
- **Linting Rules**: E (errors), F (pyflakes), W (warnings), I (isort)
- **Import Style**: Use isort-compatible imports
- **Type Hints**: Encourage type annotations

Example:
```python
def process_data(items: list[str]) -> dict[str, int]:
    """Process items and return counts."""
    return {item: len(item) for item in items}
```

### TypeScript/JavaScript
- **Target Version**: ES2024
- **Compiler**: TypeScript 5.9.3
- **Formatting**: Biome (enforced)
- **Module System**: ESM (`type: "module"`)
- **Build Tool**: Rslib for library packages

Example:
```typescript
export interface Config {
  name: string;
  timeout: number;
}

export function createConfig(name: string): Config {
  return { name, timeout: 5000 };
}
```

### Rust
- **Edition**: 2021
- **Formatter**: `rustfmt` (enforced)
- **Linter**: `clippy`
- **Module Organization**: Modular, clear file structure

Example:
```rust
pub fn process_data(items: &[&str]) -> std::collections::HashMap<&str, usize> {
    items.iter()
        .map(|item| (*item, item.len()))
        .collect()
}
```

## Testing Guidelines

### TypeScript/JavaScript Tests (Rstest)
- **File Naming**: `*.test.ts` or `*.spec.ts`
- **Location**: Co-locate tests with source files
- **Parametrized Tests**: Use Rstest's parameter support

Example:
```typescript
import { describe, it, expect } from "@rstest/core";

describe("Utils", () => {
  it("should handle string input", () => {
    expect(processString("test")).toBe("TEST");
  });
});
```

### Python Tests (pytest)
- **File Naming**: `test_*.py` or `*_test.py`
- **Location**: `tests/` directory or co-located with source
- **Markers**: Use @pytest.mark for categorization

Example:
```python
import pytest

@pytest.mark.unit
def test_process_data():
    result = process_data(["a", "bb", "ccc"])
    assert result == {"a": 1, "bb": 2, "ccc": 3}
```

### Rust Tests (cargo)
- **File Naming**: Tests in `tests/` directory or inline with `#[cfg(test)]`
- **Convention**: Use `#[test]` attribute for unit tests

Example:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_data() {
        let items = vec!["a", "bb", "ccc"];
        let result = process_data(&items);
        assert_eq!(result.len(), 3);
    }
}
```

### Jupyter Notebooks
- **File Naming**: Descriptive names, e.g., `01-data-exploration.ipynb`
- **Location**: `notebooks/` directory
- **Convention**: Use clear cell structure with markdown headers
- **Execution**: Ensure all cells run successfully from top to bottom

## Workspace Structure

```
sentenel/
├── packages/
│   └── node-utils/          # TypeScript utilities package
│       ├── dist/            # Build output (esm/cjs)
│       ├── index.ts
│       ├── paths/
│       ├── dotenv/
│       ├── package.json
│       └── rslib.config.ts
├── src/                     # Python/Rust source
├── tests/                   # Python/Rust tests
├── notebooks/               # Jupyter notebooks
├── crates/                  # Rust packages (if applicable)
├── pyproject.toml
├── package.json
├── tsconfig.json
├── ruff.toml
├── Cargo.toml              # Root workspace (if using Rust)
└── pnpm-workspace.yaml
```

## Common Commands

### Python
```bash
pdm install                  # Install dependencies
pdm run ruff check .         # Lint
pdm run ruff format .        # Format
pdm run pytest               # Run tests
```

### JavaScript/TypeScript
```bash
pnpm install                 # Install dependencies
pnpm test                    # Run tests with Rstest
pnpm test:watch              # Run tests in watch mode
pnpm -F @sentenel/node-utils build  # Build package with Rslib
```

### Rust
```bash
cargo test                   # Run tests
cargo fmt                    # Format code
cargo clippy                 # Lint with clippy
cargo build --release        # Build optimized binary
```

## Import Aliases

### TypeScript
Use `@sentenel/*` for monorepo packages:
```typescript
import { RootPath } from "@sentenel/node-utils/paths";
```

## Best Practices

1. **Keep Functions Pure**: Minimize side effects
2. **Use Type Safety**: Always use TypeScript/Rust strict typing
3. **Write Tests First**: Test-driven development when possible
4. **Document Complex Logic**: Add JSDoc/docstrings/doc comments
5. **Follow DRY**: Don't repeat yourself—extract reusable utilities
6. **Handle Errors Gracefully**: Use try-catch, Option/Result types
7. **Use Constants**: Define magic strings/numbers as named constants
8. **Modularity**: Keep modules focused on single responsibility

## Ignored Patterns

These directories/files are excluded from most operations:
- `node_modules/`
- `target/`
- `dist/`, `build/`
- `.venv/`, `__pycache__/`
- `.ipynb_checkpoints/`
- `*.pyc`

## Git Conventions

- **Branch Names**: `feature/description`, `fix/description`, `docs/description`
- **Commit Messages**: Use conventional commits (feat:, fix:, docs:, etc.)
- **PR Titles**: Descriptive, reference issue numbers when applicable

## When in Doubt

1. Check existing code patterns in the codebase
2. Refer to AGENTS.md for project-specific setup guidance
3. Follow the style of the nearest similar file
4. Ask for clarification rather than guessing intent
- **PR Titles**: Descriptive, reference issue numbers when applicable

## When in Doubt

1. Check existing code patterns in the codebase
2. Refer to AGENTS.md for project-specific setup guidance
3. Follow the style of the nearest similar file
4. Ask for clarification rather than guessing intent
