import type * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExportInfo } from '../barrel-loader.types';
import { parseExports } from './parse';

/**
 * Resolve source file path trying common extensions
 */
function resolveSourceFile(
  sourceImport: string,
  sourceDir: string,
  fileSystem: typeof fs
): string | null {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs'];
  const sourceFile = path.resolve(sourceDir, sourceImport);

  if (path.extname(sourceFile)) {
    return fileSystem.existsSync(sourceFile) ? sourceFile : null;
  }

  for (const ext of extensions) {
    const candidate = sourceFile + ext;
    if (fileSystem.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Process a single export entry from a barrel file
 */
function processExportEntry(
  exp: ExportInfo,
  filePath: string,
  fileSystem: typeof fs,
  visited: Set<string>,
  resolveRecursive: (path: string, fs: typeof fs, visited: Set<string>) => ExportInfo[]
): ExportInfo[] {
  if (!exp.source.startsWith('.')) return [exp];

  const sourceFile = resolveSourceFile(exp.source, path.dirname(filePath), fileSystem);
  if (!sourceFile) return [exp];

  try {
    const sourceContent = fileSystem.readFileSync(sourceFile, 'utf-8');
    const sourceExports = parseExports(sourceContent, sourceFile);

    if (sourceExports.some((e) => e.source.startsWith('.'))) {
      return resolveRecursive(sourceFile, fileSystem, visited);
    }
  } catch {
    // File can't be read
  }

  return [exp];
}

export { resolveSourceFile, processExportEntry };
