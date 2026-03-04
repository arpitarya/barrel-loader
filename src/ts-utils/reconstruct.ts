import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Reconstruct source code from parsed exports
 * @param exports - Array of export objects
 * @returns Reconstructed source code
 */
function reconstructSource(exports: ExportInfo[]): string {
  if (!nativeAddon?.reconstruct_source_napi) {
    throw new Error('Native addon not available');
  }

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
    throw error;
  }
}

export { reconstructSource };
