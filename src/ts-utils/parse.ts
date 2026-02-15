import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Process a barrel file and extract all exports
 * @param content - The content of the barrel file
 * @param filePath - The file path (for error reporting)
 * @returns Array of export objects
 */
function parseExports(content: string, filePath = ''): ExportInfo[] {
  const shouldLog =
    process.env.BARREL_LOADER_VERBOSE === 'true' || process.env.BARREL_LOADER_DEBUG === 'true';

  if (nativeAddon?.parse_exports_napi) {
    try {
      const rawExports = nativeAddon.parse_exports_napi(content) as unknown[];
      return rawExports.map((exp) => {
        const entry = exp as Record<string, unknown>;
        return {
          specifier: (entry.specifier ?? entry.name ?? '') as string,
          source: (entry.source ?? '') as string,
          export_type: (entry.export_type ??
            entry.exportType ??
            'named') as ExportInfo['export_type'],
          is_type_export: (entry.is_type_export ?? entry.isTypeExport ?? false) as boolean,
        } as ExportInfo;
      });
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  } else if (shouldLog) {
    console.warn(
      '[barrel-loader] Native addon missing parse_exports_napi; returning empty exports',
      { filePath }
    );
  }

  // Fallback implementation
  return [];
}

export { parseExports };
