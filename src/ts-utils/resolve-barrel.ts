import type * as fs from 'node:fs';
import * as path from 'node:path';
import type { BarrelLoaderOptions, ExportInfo } from '../barrel-loader.types';
import { parseExports } from './parse';
import { processExportEntry } from './resolve-utils';

/**
 * Resolve barrel files recursively to include all re-exported exports
 * Prevents infinite loops with visited tracking
 */
function resolveBarrelExportsRecursive(
  filePath: string,
  fileSystem: typeof fs,
  options: BarrelLoaderOptions = {},
  visited: Set<string> = new Set()
): ExportInfo[] {
  const absolutePath = path.resolve(filePath);
  if (visited.has(absolutePath)) return [];
  visited.add(absolutePath);

  const verbose =
    process.env.BARREL_LOADER_VERBOSE === 'true' || process.env.BARREL_LOADER_DEBUG === 'true';

  try {
    const content = fileSystem.readFileSync(filePath, 'utf-8');
    const allExports = parseExports(content, filePath);

    if (verbose) {
      console.log('[resolve-barrel.ts] After parseExports', {
        filePath,
        exportsCount: allExports.length,
        exports: allExports.map((e) => ({
          specifier: e.specifier,
          source: e.source,
          type: e.export_type,
        })),
      });
    }

    const resolved = new Map<string, ExportInfo>();
    for (const exp of allExports) {
      try {
        const results = processExportEntry(
          exp,
          filePath,
          fileSystem,
          options,
          visited,
          resolveBarrelExportsRecursive
        );

        if (verbose) {
          console.log('[resolve-barrel.ts] processExportEntry results', {
            input: { specifier: exp.specifier, source: exp.source },
            resultsCount: results.length,
            results: results.map((r) => ({ spec: r.specifier, src: r.source })),
          });
        }

        for (const result of results) {
          const key = `${result.specifier}:${result.export_type}`;
          resolved.set(key, result);
        }
      } catch (err) {
        const error = err as Error;
        console.error('[resolve-barrel.ts] processExportEntry ERROR:', error.message);
        console.error('[resolve-barrel.ts] Stack:', error.stack);
        console.error('[resolve-barrel.ts] Export was:', JSON.stringify(exp));
      }
    }

    const finalResults = Array.from(resolved.values());
    if (verbose) {
      console.log('[resolve-barrel.ts] Final resolved exports', {
        filePath,
        count: finalResults.length,
      });
    }

    return finalResults;
  } catch {
    return [];
  }
}

export { resolveBarrelExportsRecursive };
