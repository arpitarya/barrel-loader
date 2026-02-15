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
      return nativeAddon.reconstruct_source_napi('', exports);
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
