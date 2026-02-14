# Using barrel-loader

This guide walks you through setting up and using the barrel-loader in your project.

## Quick Start

### 1. Installation

```bash
npm install --save-dev barrel-loader
# or with pnpm
pnpm add -D barrel-loader
```

### 2. Configure rspack/webpack

Add the loader to your configuration:

**rspack.config.ts:**
```typescript
import { defineConfig } from "@rspack/cli";

export default defineConfig({
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: false,
          removeDuplicates: true,
          verbose: false,
        },
      },
    ],
  },
});
```

**webpack.config.js:**
```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: false,
          removeDuplicates: true,
          verbose: false,
        },
      },
    ],
  },
};
```

### 3. Use in Your Project

The loader automatically processes all barrel files (index.ts/js/tsx/jsx) that match the configuration.

## Examples

### Example 1: Basic Setup

**Input (src/components/index.ts):**
```typescript
export { Button } from "./Button";
export { Input } from "./Input";
export { Button } from "./Button"; // duplicate
export { Card } from "./Card";
```

**Output (with removeDuplicates: true):**
```typescript
export { Button, Input, Card } from "./Button";
```

### Example 2: Sorting Exports

**Input (src/utils/index.ts):**
```typescript
export { formatDate } from "./date";
export { debounce } from "./async";
export { parseJSON } from "./json";
```

**Output (with sort: true):**
```typescript
export { debounce } from "./async";
export { formatDate } from "./date";
export { parseJSON } from "./json";
```

### Example 3: Complex Barrel with Multiple Exports

**Input (src/ui-lib/index.ts):**
```typescript
// Components
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";

// Hooks
export { useForm } from "./hooks/useForm";
export { useAsync } from "./hooks/useAsync";

// Utilities
export * from "./utils";
export { default as theme } from "./theme";

// Duplicates
export { Button } from "./Button";
export { useForm } from "./hooks/useForm";
```

**Output (with sort: true, removeDuplicates: true):**
```typescript
// Components

// Hooks

// Utilities
export * from "./utils";
export { default as theme } from "./theme";
export { Button, Input, Card } from "./Button";
export { useAsync, useForm } from "./hooks/useAsync";
```

## Configuration Patterns

### Development Environment

Enable sorting for better readability during development:

```typescript
const config = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: true,
          removeDuplicates: true,
          verbose: process.env.DEBUG ? true : false,
        },
      },
    ],
  },
};
```

### Production Environment

Keep original order for consistency and faster builds:

```typescript
const config = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: false,
          removeDuplicates: true,
          verbose: false,
        },
      },
    ],
  },
};
```

### Directory-Specific Configuration

Apply different options to different directories:

```typescript
const config = {
  module: {
    rules: [
      // Strict processing for components
      {
        test: /index\.(ts|tsx)$/,
        include: /src\/components/,
        loader: "barrel-loader",
        options: {
          sort: true,
          removeDuplicates: true,
        },
      },

      // Minimal processing for utilities
      {
        test: /index\.(ts|tsx)$/,
        include: /src\/utils/,
        loader: "barrel-loader",
        options: {
          sort: false,
          removeDuplicates: true,
        },
      },

      // Skip processing for generated files
      {
        test: /index\.(ts|tsx)$/,
        exclude: /generated/,
        loader: "barrel-loader",
        options: {
          sort: false,
          removeDuplicates: true,
        },
      },
    ],
  },
};
```

## Advanced Usage

### Custom Barrel File Detection

You can provide a custom function to determine which files should be treated as barrel files:

```typescript
const config = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          // Only treat files named "barrel.ts" or "index.ts" as barrel files
          isBarrelFile: (filePath) =>
            filePath.endsWith("barrel.ts") || filePath.endsWith("index.ts"),
        },
      },
    ],
  },
};
```

### Converting Namespace Exports to Named Exports

Enable namespace-to-named export conversion to make barrel files more explicit:

```typescript
const config = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          convertNamespaceToNamed: true,
          sort: true,
          removeDuplicates: true,
        },
      },
    ],
  },
};
```

**Before:**
```typescript
export { Button } from "./Button";
export { Card } from "./Card";
export * from "./utils";  // namespace export
```

**After (with convertNamespaceToNamed: true):**
```typescript
export { Button, Card } from "./Button";
export { formatDate, debounce, parseJSON } from "./utils";
```

This feature is particularly useful when:
- You want to make all exports explicit for better tree-shaking
- You need to track all exported symbols at compile time
- You're migrating from namespace exports to named exports
- You want better IDE autocomplete for barrel files

**Note:** This feature requires the loader to have file system access through webpack's loader context. If the source files cannot be read, the loader will fall back to the original namespace export.

### Resolving Barrel File Chains

Enable recursive barrel file resolution to automatically flatten export chains:

```typescript
const config = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          resolveBarrelExports: true,
          sort: true,
          removeDuplicates: true,
        },
      },
    ],
  },
};
```

**Use case:** When you have nested barrel files that re-export from other barrel files:

**Project structure:**
```
src/
  ui/index.ts          → exports from ../core
  core/index.ts        → exports from ../utils
  utils/index.ts       → actual implementations
```

**Before (with `resolveBarrelExports: false`):**
```typescript
// src/ui/index.ts
export * from "../core";
```

**After (with `resolveBarrelExports: true`):**
```typescript
// Recursively resolved to point directly to utils through core
export * from "../core";
```

The loader:
- Detects when exports come from other barrel files
- Follows the chain recursively to find actual implementations
- Prevents infinite loops automatically
- Maintains the export structure and source references

This is useful when:
- You have deeply nested barrel files
- You want to eliminate redundant re-export layers
- You want to track actual export origins
- You're refactoring a complex module structure

### Conditional Configuration

Use environment variables to adjust behavior:

```typescript
const loaderOptions = {
  sort: process.env.NODE_ENV === "development",
  removeDuplicates: true,
  verbose: process.env.DEBUG ? true : false,
  isBarrelFile: (path) => {
    // Custom logic based on path
    return path.includes("__barrel") || path.endsWith("index.ts");
  },
};

const config = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: loaderOptions,
      },
    ],
  },
};
```

## Supported Export Formats

The loader handles these export patterns:

### Named Exports
```typescript
export { foo, bar } from "./module";
export { foo as Foo } from "./module";
```

### Default Exports
```typescript
export { default } from "./module";
export { default as Component } from "./module";
```

### Namespace Exports
```typescript
export * from "./module";
export * as utils from "./utils";
```

### Mixed Exports
```typescript
export { foo } from "./foo";
export * from "./utils";
export { default as Component } from "./component";
```

## Troubleshooting

### Files Not Being Processed

Check that your files match the `test` regex and `isBarrelFile` function:

```typescript
// Enable verbose logging to see what's happening
{
  loader: "barrel-loader",
  options: {
    verbose: true, // Logs all processed files
    isBarrelFile: (path) => {
      console.log(`Checking: ${path}`);
      return path.endsWith("index.ts");
    },
  },
}
```

### Unexpected Export Order

If exports are not in the expected order, check the `sort` option:

```typescript
// To sort exports alphabetically:
{
  loader: "barrel-loader",
  options: {
    sort: true, // Enables sorting
  },
}
```

### Duplicates Not Being Removed

Ensure `removeDuplicates` is enabled (it's enabled by default):

```typescript
{
  loader: "barrel-loader",
  options: {
    removeDuplicates: true, // Default: true
  },
}
```

## Best Practices

1. **Keep barrel files simple**: Barrel files should primarily contain re-exports. Avoid adding other code.

2. **Use consistent export patterns**: Mix named and namespace exports consistently across your barrel files.

3. **Enable sorting in development**: Makes it easier to spot duplicates and maintain exports.

4. **Disable sorting in production**: Preserves build consistency and potentially faster builds.

5. **Use custom detection for special cases**: If you have barrel files with non-standard names, use the `isBarrelFile` option.

6. **Monitor with verbose mode**: When debugging issues, enable verbose logging to see what the loader is doing.

## Performance Considerations

The loader is highly optimized and adds minimal overhead:
- Parsing: Linear time relative to number of export statements
- Deduplication: Uses Set-based approach for O(n) performance
- Sorting: Standard comparison-based sort, O(n log n)
- Reconstruction: Linear time relative to number of exports

For typical barrel files (10-100 exports), the loader adds negligible build time overhead.

## TypeScript Support

Full TypeScript support is built-in:

```typescript
import type { BarrelLoaderOptions } from "barrel-loader";

const options: BarrelLoaderOptions = {
  sort: true,
  removeDuplicates: true,
  verbose: false,
};
```

See `docs/types.ts` for comprehensive type examples.
