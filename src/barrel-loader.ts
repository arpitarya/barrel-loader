import * as fs from 'node:fs';
import type { BarrelLoaderOptions, LoaderContext } from './barrel-loader.types';
import { getDedupedExports } from './ts-utils/dedupe';
import { reconstructSource } from './ts-utils/reconstruct';
import { resolveBarrelExportsRecursive } from './ts-utils/resolve-barrel';
import { sortExports } from './ts-utils/sort';

function logVerbose(verbose: boolean, message: string, details?: Record<string, unknown>): void {
  if (!verbose) return;
  if (details) {
    console.log(`[barrel-loader] ${message} ${JSON.stringify(details)}`);
    return;
  }
  console.log(`[barrel-loader] ${message}`);
}

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

  // Debug: Write to file to see if loader is invoked
  try {
    fs.appendFileSync(
      '/tmp/barrel-loader-debug.log',
      `Processing: ${filePath}\nOptions: ${JSON.stringify(options)}\n\n`
    );
  } catch (e) {
    console.error('barrel-loader: Failed to write debug log', e);
  }

  logVerbose(verbose, 'Start', { filePath });

  const exports = resolveBarrelExportsRecursive(filePath, fs, options);
  logVerbose(verbose, 'Resolved exports', {
    total: exports.length,
    typeExports: exports.filter((exp) => exp.is_type_export).length,
    namespaceExports: exports.filter((exp) => exp.export_type === 'namespace').length,
  });

  const dedupedExports = getDedupedExports(exports);
  logVerbose(verbose, 'Removed duplicates', { total: dedupedExports.length });

  const sortedExports = sortExports(dedupedExports);
  logVerbose(verbose, 'Sorted exports', { total: sortedExports.length });

  const result = reconstructSource(sortedExports);
  logVerbose(verbose, 'Reconstructed source', {});

  if (this.sourceMap && this.callback) {
    this.callback(null, result, null);
    return;
  }

  if (process.env.BARREL_LOADER_DEBUG === 'true') {
    const debugPath = filePath.replace('.ts', '.debug.ts');
    fs.writeFileSync(debugPath, result, 'utf-8');
    logVerbose(verbose, 'Wrote debug output', { debugPath });
  }

  return result;
}

export default barrelLoaderRust;
export { barrelLoaderRust };
