/**
 * TypeScript Types Reference for barrel-loader
 *
 * This file documents all available types and interfaces when using barrel-loader
 * in a TypeScript project.
 */

import type { BarrelLoaderOptions } from "barrel-loader";

/**
 * Options accepted by the barrel-loader
 *
 * @interface BarrelLoaderOptions
 */

/**
 * @property {boolean} [optimize] - Enables optimization of barrel files. Default: true
 * @example
 * ```typescript
 * const options: BarrelLoaderOptions = {
 *   optimize: true
 * };
 * ```
 */

/**
 * @property {boolean} [sort] - Sorts exports alphabetically by source, then by specifier. Default: false
 * @example
 * ```typescript
 * const options: BarrelLoaderOptions = {
 *   sort: true // exports will be sorted
 * };
 * ```
 */

/**
 * @property {boolean} [removeDuplicates] - Removes duplicate export statements. Default: true
 * @example
 * ```typescript
 * const options: BarrelLoaderOptions = {
 *   removeDuplicates: true // duplicates will be removed
 * };
 * ```
 */

/**
 * @property {boolean} [verbose] - Enables detailed logging. Default: false
 * @example
 * ```typescript
 * const options: BarrelLoaderOptions = {
 *   verbose: process.env.DEBUG ? true : false
 * };
 * ```
 */

/**
 * @property {(filePath: string) => boolean} [isBarrelFile] - Custom function to determine if a file is a barrel file
 * @example
 * ```typescript
 * const options: BarrelLoaderOptions = {
 *   isBarrelFile: (filePath) => filePath.endsWith("index.ts")
 * };
 * ```
 */

// =============================================================================
// Example 1: Minimal configuration
// =============================================================================

const minimalConfig: BarrelLoaderOptions = {
  // Uses all defaults
};

// =============================================================================
// Example 2: Full configuration
// =============================================================================

const fullConfig: BarrelLoaderOptions = {
  optimize: true,
  sort: true,
  removeDuplicates: true,
  verbose: false,
  isBarrelFile: (filePath: string) => filePath.endsWith("index.ts"),
};

// =============================================================================
// Example 3: Development configuration
// =============================================================================

const devConfig: BarrelLoaderOptions = {
  sort: true, // Sorted for readability
  removeDuplicates: true,
  verbose: true, // Log all transformations
  isBarrelFile: (filePath) => filePath.includes("__barrel") || filePath.endsWith("index.ts"),
};

// =============================================================================
// Example 4: Production configuration
// =============================================================================

const prodConfig: BarrelLoaderOptions = {
  sort: false, // Preserve order for consistency
  removeDuplicates: true,
  verbose: false, // No logging in production
};

// =============================================================================
// Example 5: Custom barrel file detection
// =============================================================================

interface CustomDetectionStrategy {
  // Option 1: By file name
  byFileName: {
    isBarrelFile: (filePath: string) => boolean;
  };

  // Option 2: By directory
  byDirectory: {
    isBarrelFile: (filePath: string) => boolean;
  };

  // Option 3: By naming convention
  byConvention: {
    isBarrelFile: (filePath: string) => boolean;
  };
}

const customStrategies: CustomDetectionStrategy = {
  byFileName: {
    isBarrelFile: (filePath) => {
      const fileName = filePath.split("/").pop() || "";
      return (
        fileName === "index.ts" || fileName === "index.tsx" || fileName === "barrel.ts" || fileName === "barrel.tsx"
      );
    },
  },

  byDirectory: {
    isBarrelFile: (filePath) => {
      const barrelDirs = ["components", "utils", "hooks", "services"];
      return barrelDirs.some((dir) => filePath.includes(`/${dir}/`)) && filePath.endsWith("index.ts");
    },
  },

  byConvention: {
    isBarrelFile: (filePath) => {
      // Match files like: src/common/index.ts, src/utils/index.tsx, etc.
      const patterns = [/src\/.+\/index\.(ts|tsx)$/, /lib\/.+\/index\.(ts|tsx)$/];
      return patterns.some((pattern) => pattern.test(filePath));
    },
  },
};

// =============================================================================
// Example 6: Rspack configuration with types
// =============================================================================

import type { RspackConfig } from "@rspack/cli";

const rspackConfig: RspackConfig = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        loader: "barrel-loader",
        options: {
          sort: true,
          removeDuplicates: true,
          verbose: process.env.DEBUG ? true : false,
        } as BarrelLoaderOptions,
      },
    ],
  },
};

// =============================================================================
// Example 7: Conditional configurations
// =============================================================================

const getLoaderOptions = (env: "development" | "production"): BarrelLoaderOptions => {
  if (env === "development") {
    return {
      sort: true,
      removeDuplicates: true,
      verbose: true,
    };
  }

  return {
    sort: false,
    removeDuplicates: true,
    verbose: false,
  };
};

const devOptions = getLoaderOptions("development");
const prodOptions = getLoaderOptions("production");

// =============================================================================
// Example 8: Environment-aware configuration builder
// =============================================================================

class BarrelLoaderConfigBuilder {
  private options: BarrelLoaderOptions = {};

  withSorting(enabled: boolean): this {
    this.options.sort = enabled;
    return this;
  }

  withDuplicateRemoval(enabled: boolean): this {
    this.options.removeDuplicates = enabled;
    return this;
  }

  withVerboseLogging(enabled: boolean): this {
    this.options.verbose = enabled;
    return this;
  }

  withCustomDetection(detector: (path: string) => boolean): this {
    this.options.isBarrelFile = detector;
    return this;
  }

  build(): BarrelLoaderOptions {
    return { ...this.options };
  }
}

// Usage:
const builtConfig = new BarrelLoaderConfigBuilder()
  .withSorting(true)
  .withDuplicateRemoval(true)
  .withVerboseLogging(process.env.NODE_ENV === "development")
  .withCustomDetection((path) => path.endsWith("index.ts"))
  .build();

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/**
 * Type guard to check if an object is valid BarrelLoaderOptions
 */
function isValidBarrelLoaderOptions(obj: unknown): obj is BarrelLoaderOptions {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const opts = obj as BarrelLoaderOptions;

  return (
    (opts.sort === undefined || typeof opts.sort === "boolean") &&
    (opts.removeDuplicates === undefined || typeof opts.removeDuplicates === "boolean") &&
    (opts.verbose === undefined || typeof opts.verbose === "boolean") &&
    (opts.isBarrelFile === undefined || typeof opts.isBarrelFile === "function")
  );
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extracts the loader options type for use in other contexts
 */
type LoaderOptions = BarrelLoaderOptions;

/**
 * Partial options - all properties are optional
 */
type PartialBarrelLoaderOptions = Partial<BarrelLoaderOptions>;

/**
 * Required options - all properties are required
 */
type RequiredBarrelLoaderOptions = Required<BarrelLoaderOptions>;

export type { BarrelLoaderOptions, LoaderOptions, PartialBarrelLoaderOptions, RequiredBarrelLoaderOptions };

export { BarrelLoaderConfigBuilder, isValidBarrelLoaderOptions };
