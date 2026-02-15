import type * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExportInfo } from '../barrel-loader.types';
import { parseExports } from './parse';
import { processExportEntry } from './resolve-utils';

/**
 * Resolve barrel files recursively to include all re-exported exports
 * Prevents infinite loops with visited tracking
 */
function resolveBarrelExportsRecursive(
  filePath: string,
  fileSystem: typeof fs,
  visited: Set<string> = new Set()
): ExportInfo[] {
  const absolutePath = path.resolve(filePath);
  if (visited.has(absolutePath)) return [];
  visited.add(absolutePath);

  try {
    const content = fileSystem.readFileSync(filePath, 'utf-8');
    const allExports = parseExports(content, filePath);

    const resolved = new Map<string, ExportInfo>();
    for (const exp of allExports) {
      const results = processExportEntry(
        exp,
        filePath,
        fileSystem,
        visited,
        resolveBarrelExportsRecursive
      );

      for (const result of results) {
        const key = `${result.specifier}:${result.export_type}`;
        resolved.set(key, result);
      }
    }

    return Array.from(resolved.values());
  } catch {
    return [];
  }
}

export { resolveBarrelExportsRecursive };
