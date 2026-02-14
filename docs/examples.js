#!/usr/bin/env node

/**
 * This file demonstrates various use cases of the barrel-loader
 * in an rspack/webpack configuration.
 */

// Example 1: Basic usage with rspack
const basicRspackConfig = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: true,
          removeDuplicates: true,
          verbose: true,
        },
      },
    ],
  },
};

// Example 2: With custom barrel file detection
const customDetectionConfig = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          isBarrelFile: (filePath) => {
            // Treat files ending with "barrel.ts" as barrel files
            return filePath.endsWith("barrel.ts") || filePath.endsWith("index.ts");
          },
          verbose: false,
        },
      },
    ],
  },
};

// Example 3: Different configurations for different paths
const pathSpecificConfig = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx)$/,
        include: /src\/components/,
        loader: "barrel-loader",
        options: {
          sort: true,
          removeDuplicates: true,
        },
      },
      {
        test: /index\.(ts|tsx)$/,
        include: /src\/utils/,
        loader: "barrel-loader",
        options: {
          sort: false, // Keep original order for utilities
          removeDuplicates: true,
        },
      },
    ],
  },
};

/**
 * Real-world example: Transforming a complex barrel file
 */

// Input: src/components/index.ts
const inputBarrelFile = `
/**
 * Component exports from this module
 */

// UI Components
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";

// Layout Components
export { Container } from "./layout/Container";
export { Grid } from "./layout/Grid";

// Hooks
export { useForm } from "../hooks/useForm";
export { useAsync } from "../hooks/useAsync";

// Utils
export * from "../utils/helpers";

// Theme
export { default as theme } from "../theme/default";

// Duplicates (will be removed if removeDuplicates is enabled)
export { Button } from "./Button";
export { useForm } from "../hooks/useForm";
`;

// Output with options: { sort: true, removeDuplicates: true }
const outputBarrelFile = `/**
 * Component exports from this module
 */

// UI Components

export * from "../hooks/useAsync";
export { default as theme } from "../theme/default";
export { Container } from "./layout/Container";
export { Grid } from "./layout/Grid";
export { useForm } from "../hooks/useForm";
export { Button, Input, Card } from "./Button";
`;

/**
 * TypeScript example with proper types
 */

// rspack.config.ts
const rspackConfigTS = `import { defineConfig, RspackConfig } from "@rspack/cli";
import type { BarrelLoaderOptions } from "barrel-loader";

const barrelLoaderOptions: BarrelLoaderOptions = {
  sort: true,
  removeDuplicates: true,
  verbose: process.env.DEBUG ? true : false,
  isBarrelFile: (filePath) => {
    // Custom detection logic
    return filePath.includes("/index.") && !filePath.includes("/test/");
  },
};

const config: RspackConfig = defineConfig({
  module: {
    rules: [
      {
        test: /\\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: barrelLoaderOptions,
      },
    ],
  },
});

export default config;`;

/**
 * Webpack example (barrel-loader is webpack compatible)
 */

// webpack.config.js
const webpackConfigJS = `module.exports = {
  module: {
    rules: [
      {
        test: /index\\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: true,
          removeDuplicates: true,
          verbose: false,
        },
      },
    ],
  },
};`;

/**
 * Advanced: Custom isBarrelFile function examples
 */

// Strategy 1: By naming convention
const detectByNaming = {
  isBarrelFile: (filePath) =>
    filePath.endsWith("index.ts") ||
    filePath.endsWith("index.tsx") ||
    filePath.endsWith("barrel.ts") ||
    filePath.endsWith("barrel.tsx"),
};

// Strategy 2: By directory depth
const detectByDepth = {
  isBarrelFile: (filePath) => {
    // Only process barrel files in these directories
    const allowedDirs = ["src/components", "src/utils", "src/hooks", "src/themes"];
    return allowedDirs.some((dir) => filePath.includes(dir)) && filePath.endsWith("index.ts");
  },
};

// Strategy 3: By file content (would need to be done in a more advanced loader)
const detectByContent = {
  isBarrelFile: (filePath) => {
    // Exclude specific files
    const excluded = ["node_modules", ".next", "dist", "coverage", "test", ".spec", ".test"];
    return !excluded.some((exc) => filePath.includes(exc)) && filePath.endsWith("index.ts");
  },
};

/**
 * Usage with environment variables
 */

const envAwareConfig = {
  module: {
    rules: [
      {
        test: /index\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          // Only sort in development for easier reading
          sort: process.env.NODE_ENV === "development",
          // Always remove duplicates
          removeDuplicates: true,
          // Enable verbose logging in development
          verbose: process.env.NODE_ENV === "development",
        },
      },
    ],
  },
};

console.log("Example configurations available in this file");
console.log("- basicRspackConfig");
console.log("- customDetectionConfig");
console.log("- pathSpecificConfig");
console.log("- rspackConfigTS");
console.log("- webpackConfigJS");
console.log("- detectByNaming, detectByDepth, detectByContent");
console.log("- envAwareConfig");
