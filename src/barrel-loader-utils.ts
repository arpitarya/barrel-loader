import type { ExportInfo, NativeAddon } from './types';

// Load the native Rust addon
let nativeAddon: NativeAddon | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nativeAddon = require('../native/barrel_loader_rs.node') as NativeAddon;
} catch (err) {
  // Fallback to JavaScript implementation if native addon is not available
  const error = err as Error;
  console.warn('Failed to load native addon, falling back to JavaScript:', error.message);
  nativeAddon = null;
}

/**
 * Process a barrel file and extract all exports
 * @param content - The content of the barrel file
 * @param filePath - The file path (for error reporting)
 * @returns Array of export objects
 */
export function parseExports(content: string, filePath = ''): ExportInfo[] {
  if (nativeAddon?.process_barrel_file) {
    try {
      return nativeAddon.process_barrel_file(content, filePath);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  // Fallback implementation
  return [];
}

/**
 * Remove duplicate exports
 * @param exports - Array of export objects
 * @returns Deduplicated exports
 */
export function removeDuplicates(exports: ExportInfo[]): ExportInfo[] {
  if (nativeAddon?.remove_duplicates) {
    try {
      return nativeAddon.remove_duplicates(exports);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  // Fallback: deduplicate by creating a map
  const seen = new Map<string, boolean>();
  const deduped: ExportInfo[] = [];

  for (const exp of exports) {
    const key = `${exp.name}:${exp.source}:${exp.export_type}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(exp);
    }
  }

  return deduped;
}

/**
 * Sort exports by name
 * @param exports - Array of export objects
 * @returns Sorted exports
 */
export function sortExports(exports: ExportInfo[]): ExportInfo[] {
  if (nativeAddon?.sort_exports_napi) {
    try {
      return nativeAddon.sort_exports_napi(exports);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  // Fallback: sort by name
  return [...exports].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Reconstruct source code from parsed exports
 * @param exports - Array of export objects
 * @returns Reconstructed source code
 */
export function reconstructSource(exports: ExportInfo[]): string {
  if (nativeAddon?.reconstruct_source_napi) {
    try {
      return nativeAddon.reconstruct_source_napi(exports);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  // Fallback implementation
  if (exports.length === 0) {
    return '';
  }

  let result = '';
  const sources = new Map<string, string[]>();

  // Group exports by source
  for (const exp of exports) {
    const key = `${exp.source}:${exp.export_type}`;
    if (!sources.has(key)) {
      sources.set(key, []);
    }
    const names = sources.get(key);
    if (names) {
      names.push(exp.name);
    }
  }

  // Reconstruct imports
  for (const [key, names] of sources) {
    const [source, exportType] = key.split(':');
    const typePrefix = exportType === 'type' ? 'type ' : '';
    result += `export ${typePrefix}{ ${names.join(', ')} } from '${source}';\n`;
  }

  return result;
}

// Export native addon for testing/advanced usage
export { nativeAddon };
