import type * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExportInfo } from '../barrel-loader.types';
import { parseExports } from './parse';

const TYPE_EXPORTS_LIST_RE = /^export\s+type\s+\{([^}]+)\}/;
const TYPE_NAME_RE = /^export\s+type\s+([A-Za-z0-9_]+)/;
const INTERFACE_NAME_RE = /^export\s+interface\s+([A-Za-z0-9_]+)/;
const ENUM_NAME_RE = /^export\s+enum\s+([A-Za-z0-9_]+)/;

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
