/**
 * Webpack/Rspack loader that uses the Rust-based barrel-loader addon
 * This is a drop-in replacement for the TypeScript loader
 */

import * as fs from 'node:fs';
import type { BarrelLoaderOptions, LoaderContext } from './barrel-loader.types';
import { removeDuplicates } from './utils/dedupe';
import { reconstructSource } from './utils/reconstruct';
import { resolveBarrelExportsRecursive } from './utils/resolve-barrel';
import { sortExports } from './utils/sort';

/**
 * Main loader function for webpack/rspack
 * Compatible with both @rspack/core and webpack loader context
 */
function barrelLoaderRust(
  this: LoaderContext<BarrelLoaderOptions>,
  _content: string
): string | undefined {
  const filePath = this.resourcePath || this.resource;

  if (!filePath) {
    throw new Error('barrel-loader: resourcePath is required');
  }

  const fileSystem = this.fs || fs;
  let exports = resolveBarrelExportsRecursive(filePath, fileSystem);

  exports = removeDuplicates(exports);
  exports = sortExports(exports);

  const result = reconstructSource(exports);

  if (this.sourceMap && this.callback) {
    this.callback(null, result, null);
    return;
  }

  return result;
}

export default barrelLoaderRust;
export { barrelLoaderRust };
