/**
 * Webpack/Rspack loader that uses the Rust-based barrel-loader addon
 * This is a drop-in replacement for the TypeScript loader
 */

import * as fs from 'node:fs';
import type { BarrelLoaderOptions, LoaderContext } from './barrel-loader.types';
import { removeDuplicates } from './ts-utils/dedupe';
import { reconstructSource } from './ts-utils/reconstruct';
import { resolveBarrelExportsRecursive } from './ts-utils/resolve-barrel';
import { sortExports } from './ts-utils/sort';

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

  const options = this.getOptions ? this.getOptions() : {};
  const verbose = options.verbose ?? false;

  const logVerbose = (message: string, details?: Record<string, unknown>): void => {
    if (!verbose) return;
    if (details) {
      console.log(`[barrel-loader] ${message} ${JSON.stringify(details)}`);
      return;
    }
    console.log(`[barrel-loader] ${message}`);
  };

  const fileSystem = this.fs || fs;
  logVerbose('Start', { filePath });

  let exports = resolveBarrelExportsRecursive(filePath, fileSystem);
  logVerbose('Resolved exports', {
    total: exports.length,
    typeExports: exports.filter((exp) => exp.is_type_export).length,
    namespaceExports: exports.filter((exp) => exp.export_type === 'namespace').length,
  });

  if (exports.length === 0) {
    logVerbose('No exports resolved, returning original content');
    if (this.sourceMap && this.callback) {
      this.callback(null, _content, null);
      return;
    }
    return _content;
  }

  exports = removeDuplicates(exports);
  logVerbose('Removed duplicates', { total: exports.length });
  exports = sortExports(exports);
  logVerbose('Sorted exports', { total: exports.length });

  const result = reconstructSource(exports);
  logVerbose('Reconstructed source', { length: result.length });

  if (this.sourceMap && this.callback) {
    this.callback(null, result, null);
    return;
  }

  if (process.env.BARREL_LOADER_DEBUG === 'true') {
    const debugPath = filePath.replace('.ts', '.debug.ts');
    fs.writeFileSync(debugPath, result, 'utf-8');
    logVerbose('Wrote debug output', { debugPath });
  }

  return result;
}

export default barrelLoaderRust;
export { barrelLoaderRust };
