# barrel-loader

An rspack/webpack loader for optimizing barrel files (index.ts/js files with multiple re-exports).

## Features

- 🎯 **Automatic Detection**: Automatically detects and processes barrel files (index.ts/js/tsx/jsx)
- 🔍 **Duplicate Removal**: Removes duplicate exports from barrel files
- 📊 **Export Sorting**: Optionally sorts exports alphabetically by source
- ⚙️ **Customizable**: Fully configurable with custom barrel file detection
- 🐛 **Verbose Logging**: Optional detailed logging for debugging
- 📝 **Format Preservation**: Maintains original code structure and comments

## Installation

```bash
npm install --save-dev barrel-loader
# or with pnpm
pnpm add -D barrel-loader
```

## Usage

### Basic Setup with Rspack

Add the loader to your `rspack.config.ts`:

```typescript
import { defineConfig } from "@rspack/cli";

export default defineConfig({
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          verbose: false,
          sort: false,
          removeDuplicates: true,
        },
      },
    ],
  },
});
```

### Webpack Configuration

The loader also works with webpack:

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          verbose: false,
          sort: true,
          removeDuplicates: true,
        },
      },
    ],
  },
};
```

## Options

### `optimize` (boolean, default: `true`)

Enables optimization of barrel files. When disabled, the loader acts as a pass-through.

```typescript
{
  loader: "barrel-loader",
  options: {
    optimize: true,
  },
}
```

### `sort` (boolean, default: `false`)

Sorts exports alphabetically by source path, then by specifier name. Useful for maintaining consistent, readable barrel files.

```typescript
{
  loader: "barrel-loader",
  options: {
    sort: true,
  },
}
```

### `removeDuplicates` (boolean, default: `true`)

Removes duplicate export statements. For example, if `foo` is exported from the same module twice, it will only be exported once.

```typescript
{
  loader: "barrel-loader",
  options: {
    removeDuplicates: true,
  },
}
```

### `verbose` (boolean, default: `false`)

Enables detailed logging to help debug which files are being processed and what changes are made.

```typescript
{
  loader: "barrel-loader",
  options: {
    verbose: true,
  },
}
```

### `isBarrelFile` (function, optional)

Custom function to determine if a file should be treated as a barrel file. By default, checks if the filename is `index.ts`, `index.js`, `index.tsx`, or `index.jsx`.

```typescript
{
  loader: "barrel-loader",
  options: {
    isBarrelFile: (filePath) => filePath.includes("barrel"),
  },
}
```

### `convertNamespaceToNamed` (boolean, default: `false`)

Converts namespace exports (`export * from "./module"`) to named exports by analyzing the source module and extracting actual export names. This feature requires the loader to have access to the file system through webpack's loader context.

When enabled, it:
- Reads the exported module to determine what's actually exported
- Converts `export * from "./utils"` to `export { actual, exports } from "./utils"`
- Converts `export * as helpers from "./helpers"` to explicit named exports with prefixes
- Falls back to original namespace export if the source file cannot be read

```typescript
{
  loader: "barrel-loader",
  options: {
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

**Example - Nested barrel files:**

**File structure:**
```
src/
  components/
    index.ts       (exports from ../common)
  common/
    index.ts       (exports from ../utils)
  utils/
    index.ts       (actual implementations)
```

**Input (src/components/index.ts):**
```typescript
export { Button } from "./Button";
export * from "../common";  // barrel file
```

**Content (src/common/index.ts):**
```typescript
export * from "../utils";  // barrel file
export { helpers } from "./helpers";
```

**Output (with `resolveBarrelExports: true`):**
```typescript
export { Button } from "./Button";
// Recursively resolved from ../common which points to ../utils
export { ... } from "../common";
```

This feature:
- Automatically detects when exports point to other barrel files
- Follows the chain until reaching non-barrel files
- Prevents infinite loops with visited tracking
- Maintains export structure and relationships


### Input (src/components/index.ts)

```typescript
export { Button } from "./Button";
export { Card } from "./Card";
export { Button } from "./Button"; // duplicate
export { Dialog } from "./Dialog";
export * from "./utils";
export { default as Modal } from "./Modal";
```

### Output (with `sort: true, removeDuplicates: true`)

```typescript
export * from "./utils";
export { default as Modal } from "./Modal";
export { Button, Card, Dialog } from "./Button";
```

## How It Works

1. **Detection**: The loader checks if a file is a barrel file using the `isBarrelFile` function
2. **Parsing**: If it is a barrel file, it parses all export statements and categorizes them by:
   - Source module
   - Export type (named, default, namespace)
   - Export kind (value vs type)
3. **Optimization**: Based on options, it:
   - Removes duplicate exports (with intelligent handling of different export kinds)
   - Sorts exports for consistency
4. **Reconstruction**: Rebuilds the source code by:
   - Grouping exports by source module
   - Separating value and type exports
   - Combining multiple named exports from the same source into single statements
   - Preserving original comments and formatting

## Supported Export Formats

### Value Exports
- Named exports: `export { foo, bar } from "./module"`
- Default exports: `export { default } from "./module"`
- Aliased exports: `export { default as Component } from "./module"`
- Namespace exports: `export * from "./module"`
- Namespace with alias: `export * as utils from "./utils"`

### Type Exports (TypeScript)
- Type named exports: `export type { User, Profile } from "./types"`
- Type default exports: `export type { default } from "./module"`
- Type aliased exports: `export type { User as UserModel } from "./types"`
- Type namespace exports: `export type * from "./types"`
- Type namespace with alias: `export type * as Types from "./types"`

### Mixed Exports
Barrel files can contain both value and type exports. The loader automatically:
- Separates type exports from value exports
- Combines multiple named exports from the same source
- Treats `export type { Foo }` and `export { Foo }` as different exports
- Removes duplicate type exports independently from value exports

**Example - Multiple exports from same source:**
```typescript
// Input
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { getValue } from "./Button";
export type { Config } from "./Button";

// Output (combined by type)
export { Button, getValue } from "./Button";
export type { ButtonProps, Config } from "./Button";
```

**Example - Scoped packages:**
```typescript
// Input
export { Component } from "@scope/ui";
export type { Props } from "@scope/ui";
export { useHook } from "@scope/ui";

// Output (combined by type)
export { Component, useHook } from "@scope/ui";
export type { Props } from "@scope/ui";
```

## Performance

The loader is optimized to work with barrel files of any size. Parsing and reconstruction operations are linear time complexity relative to the number of export statements.

## TypeScript Support

Full TypeScript support is built-in. Type definitions for loader options are included:

```typescript
import type { BarrelLoaderOptions } from "barrel-loader";

const options: BarrelLoaderOptions = {
  sort: true,
  removeDuplicates: true,
  verbose: false,
};
```

## Testing

Run the test suite:

```bash
pnpm test
pnpm test:watch
```

## License

ISC
