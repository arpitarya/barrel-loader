/**
 * Webpack/Rspack loader that uses the Rust-based barrel-loader addon
 * This is a drop-in replacement for the TypeScript loader
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  parseExports,
  reconstructSource,
  removeDuplicates,
  sortExports,
} from './barrel-loader-utils';
import type { BarrelLoaderOptions, ExportInfo, LoaderContext } from './types';

/**
 * Resolve barrel files recursively to include all re-exported exports
 * Prevents infinite loops with visited tracking
 */
function resolveBarrelExportsRecursive(
  filePath: string,
  fileSystem: typeof fs,
  visited: Set<string> = new Set()
): ExportInfo[] {
  // Prevent circular references
  const absolutePath = path.resolve(filePath);
  if (visited.has(absolutePath)) {
    return [];
  }
  visited.add(absolutePath);

  try {
    const content = fileSystem.readFileSync(filePath, 'utf-8');
    const allExports = parseExports(content, filePath);

    // Recursively resolve any re-exports from other barrel files
    const resolved = new Map<string, ExportInfo>();
    for (const exp of allExports) {
      const sourceExtension = path.extname(exp.source);

      // If it's a relative import without extension or with .js/.ts/.mjs/.mts
      if (exp.source.startsWith('.')) {
        let sourceFile = path.resolve(path.dirname(filePath), exp.source);

        // Try common extensions
        if (!sourceExtension) {
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs'];
          for (const ext of extensions) {
            const candidate = sourceFile + ext;
            if (fileSystem.existsSync(candidate)) {
              sourceFile = candidate;
              break;
            }
          }
        }

        try {
          // Check if source is a barrel file (re-exports from other files)
          const sourceContent = fileSystem.readFileSync(sourceFile, 'utf-8');
          const sourceExports = parseExports(sourceContent, sourceFile);

          // If the source also exports, resolve it recursively
          if (sourceExports.some((e) => e.source.startsWith('.'))) {
            const nestedExports = resolveBarrelExportsRecursive(sourceFile, fileSystem, visited);

            // For each export that re-exports from the source file,
            // update with the nested exports
            for (const nested of nestedExports) {
              const nestedKey = `${nested.name}:${nested.export_type}`;

              if (exp.source.endsWith(path.basename(sourceFile).split('.')[0])) {
                resolved.set(nestedKey, nested);
              }
            }
          }
        } catch {
          // File doesn't exist or can't be read, skip
        }
      }

      // Keep the original export
      const key = `${exp.name}:${exp.export_type}`;
      resolved.set(key, exp);
    }

    return Array.from(resolved.values());
  } catch {
    // Return empty array if file can't be read
    return [];
  }
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

  // Resolve all exports including from nested barrel files
  const fileSystem = this.fs || fs;
  let exports = resolveBarrelExportsRecursive(filePath, fileSystem);

  // Cleanup and deduplicate
  exports = removeDuplicates(exports);

  // Sort for consistent output
  exports = sortExports(exports);

  // Reconstruct the source with optimized exports
  const result = reconstructSource(exports);

  // Add webpack source map if needed
  if (this.sourceMap && this.callback) {
    this.callback(null, result, null);
    return;
  }

  return result;
}

export default barrelLoaderRust;
// Also export as named export for compatibility
export { barrelLoaderRust };
