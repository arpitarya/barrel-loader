import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Reconstruct source code from parsed exports
 * @param exports - Array of export objects
 * @returns Reconstructed source code
 */
function reconstructSource(exports: ExportInfo[]): string {
  if (nativeAddon?.reconstruct_source_napi) {
    try {
      // Convert snake_case to camelCase for native addon and add line field
      const normalizedExports = exports.map((exp) => ({
        specifier: exp.specifier,
        source: exp.source,
        exportType: exp.export_type,
        isTypeExport: exp.is_type_export,
        line: 0, // Line numbers not used in reconstruction
      })) as unknown as ExportInfo[];
      return nativeAddon.reconstruct_source_napi('', normalizedExports);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  if (exports.length === 0) return '';

  let result = '';
  const sources = new Map<string, string[]>();

  for (const exp of exports) {
    const key = `${exp.source}:${exp.export_type}`;
    if (!sources.has(key)) sources.set(key, []);
    sources.get(key)?.push(exp.specifier);
  }

  for (const [key, specifiers] of sources) {
    const [source, exportType] = key.split(':');
    const typePrefix = exportType === 'type' ? 'type ' : '';
    result += `export ${typePrefix}{ ${specifiers.join(', ')} } from "${source}";\n`;
  }

  return result;
}

export { reconstructSource };
