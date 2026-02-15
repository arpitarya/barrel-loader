import type { LoaderContext } from '@rspack/core' | 'webpack';

export interface BarrelLoaderOptions {
  /**
   * Enable/disable recursive barrel file resolution
   * @default true
   */
  resolveBarrelFiles?: boolean;

  /**
   * Remove duplicate exports
   * @default true
   */
  removeDuplicates?: boolean;

  /**
   * Sort exports alphabetically
   * @default false
   */
  sort?: boolean;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * Barrel loader for webpack/rspack
 * Optimizes barrel files (index.ts/js with multiple re-exports)
 */
declare function webpackLoader(
  this: LoaderContext<BarrelLoaderOptions>,
  content: string
): string | void;

export default webpackLoader;
