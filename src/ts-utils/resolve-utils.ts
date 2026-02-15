import type * as fs from 'node:fs';
import * as path from 'node:path';
import type { BarrelLoaderOptions, ExportInfo } from '../barrel-loader.types';
import { parseExports } from './parse';

const TYPE_EXPORTS_LIST_RE = /^export\s+type\s+\{([^}]+)\}/;
const TYPE_NAME_RE = /^export\s+type\s+([A-Za-z0-9_]+)/;
const INTERFACE_NAME_RE = /^export\s+interface\s+([A-Za-z0-9_]+)/;
const ENUM_NAME_RE = /^export\s+enum\s+([A-Za-z0-9_]+)/;
const EXPORT_LIST_RE = /^export\s+\{\s*([^}]+)\s*\}/;

function parseDirectExports(sourceContent: string): string[] {
  const exports = new Set<string>();

  for (const line of sourceContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
    if (trimmed.includes(' from ')) continue; // Skip re-exports

    const exportListMatch = trimmed.match(EXPORT_LIST_RE);
    if (exportListMatch?.[1]) {
      const items = exportListMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => {
          // Handle "name as alias" - we want the exported name (alias)
          const parts = item.split(' as ');
          return parts.length > 1 ? parts[1].trim() : parts[0].trim();
        });
      for (const item of items) {
        exports.add(item);
      }
    }
  }

  return Array.from(exports);
}

function isTypesFile(sourceImport: string, resolvedPath: string): boolean {
  const importLower = sourceImport.toLowerCase();
  const pathLower = resolvedPath.toLowerCase();
  return (
    importLower.includes('.types') || pathLower.includes('.types.') || pathLower.endsWith('.d.ts')
  );
}

function extractTypeExportNames(sourceContent: string): string[] {
  const names = new Set<string>();

  for (const line of sourceContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    const listMatch = trimmed.match(TYPE_EXPORTS_LIST_RE);
    if (listMatch?.[1]) {
      const parts = listMatch[1]
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) => part.split(' as ')[0]);
      for (const name of parts) names.add(name);
      continue;
    }

    const typeMatch = trimmed.match(TYPE_NAME_RE);
    if (typeMatch?.[1]) {
      names.add(typeMatch[1]);
      continue;
    }

    const interfaceMatch = trimmed.match(INTERFACE_NAME_RE);
    if (interfaceMatch?.[1]) {
      names.add(interfaceMatch[1]);
      continue;
    }

    const enumMatch = trimmed.match(ENUM_NAME_RE);
    if (enumMatch?.[1]) {
      names.add(enumMatch[1]);
    }
  }

  return Array.from(names);
}

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

  // Check if the path already has a valid extension
  const ext = path.extname(sourceFile);
  if (ext && extensions.includes(ext)) {
    return fileSystem.existsSync(sourceFile) ? sourceFile : null;
  }

  // Try as a file with various extensions
  for (const extension of extensions) {
    const candidate = sourceFile + extension;
    if (fileSystem.existsSync(candidate)) return candidate;
  }

  // Try as a directory with index files
  if (fileSystem.existsSync(sourceFile) && fileSystem.statSync(sourceFile).isDirectory()) {
    for (const extension of extensions) {
      const indexFile = path.join(sourceFile, `index${extension}`);
      if (fileSystem.existsSync(indexFile)) return indexFile;
    }
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
  options: BarrelLoaderOptions,
  visited: Set<string>,
  resolveRecursive: (
    path: string,
    fs: typeof fs,
    options: BarrelLoaderOptions,
    visited: Set<string>
  ) => ExportInfo[]
): ExportInfo[] {
  const verbose = process.env.BARREL_LOADER_DEBUG === 'true';

  const sourceFile = resolveSourceFile(exp.source, path.dirname(filePath), fileSystem);
  if (!sourceFile) return [exp];

  try {
    const sourceContent = fileSystem.readFileSync(sourceFile, 'utf-8');
    const sourceExports = parseExports(sourceContent, sourceFile);

    if (verbose) {
      console.log('[processExportEntry] Source exports:', {
        sourceFile,
        count: sourceExports.length,
        hasRelativeImports: sourceExports.some((e) => e.source.startsWith('.')),
      });
    }

    if (sourceExports.some((e) => e.source.startsWith('.'))) {
      const resolved = resolveRecursive(sourceFile, fileSystem, options, visited);
      if (verbose) {
        console.log('[processExportEntry] Recursively resolved:', {
          sourceFile,
          count: resolved.length,
          exports: resolved.map((r) => ({ spec: r.specifier, src: r.source })),
        });
      }

      // When convertNamespaceToNamed is true and this is a namespace export,
      // map the resolved exports to use the original source path
      if (
        options.convertNamespaceToNamed &&
        exp.export_type === 'namespace' &&
        exp.specifier === '*'
      ) {
        if (verbose) {
          console.log(
            '[processExportEntry] Mapping resolved exports to original source:',
            exp.source
          );
        }
        return resolved.map((r) => ({
          ...r,
          source: exp.source,
        }));
      }

      return resolved;
    }

    // When convertNamespaceToNamed is enabled, expand namespace exports to individual named exports
    if (
      options.convertNamespaceToNamed &&
      exp.export_type === 'namespace' &&
      exp.specifier === '*'
    ) {
      if (verbose) {
        console.log('[processExportEntry] Converting namespace to named exports');
      }
      // Find all direct exports from the source file using parseExports
      const directExports = sourceExports.filter((e) => !e.source.startsWith('.'));

      // Also parse direct export lists that the Rust parser doesn't handle
      const directExportNames = parseDirectExports(sourceContent);
      const directTypeNames = extractTypeExportNames(sourceContent);

      if (verbose) {
        console.log('[processExportEntry] Found exports:', {
          fromParser: directExports.length,
          directExportNames: directExportNames.length,
          directTypeNames: directTypeNames.length,
        });
      }

      const allExports: ExportInfo[] = [];

      // Add exports from parser
      for (const e of directExports) {
        allExports.push({
          ...e,
          source: exp.source,
        });
      }

      // Add direct value exports
      for (const name of directExportNames) {
        allExports.push({
          specifier: name,
          source: exp.source,
          export_type: 'named',
          is_type_export: false,
          line: 0,
        } as ExportInfo);
      }

      // Add type exports
      for (const name of directTypeNames) {
        allExports.push({
          specifier: name,
          source: exp.source,
          export_type: 'named',
          is_type_export: true,
          line: 0,
        } as ExportInfo);
      }

      if (allExports.length > 0) {
        if (verbose) {
          console.log('[processExportEntry] Returning expanded exports:', {
            count: allExports.length,
            exports: allExports.map((e) => ({ spec: e.specifier, type: e.is_type_export })),
          });
        }
        return allExports;
      }
    }

    if (
      exp.export_type === 'namespace' &&
      exp.specifier === '*' &&
      sourceExports.length === 0 &&
      isTypesFile(exp.source, sourceFile)
    ) {
      const typeNames = extractTypeExportNames(sourceContent);
      if (typeNames.length > 0) {
        return typeNames.map(
          (name) =>
            ({
              specifier: name,
              source: exp.source,
              export_type: 'named',
              is_type_export: true,
              line: 0,
            }) as ExportInfo
        );
      }
    }
  } catch {
    // File can't be read
  }

  return [exp];
}

export { resolveSourceFile, processExportEntry };
