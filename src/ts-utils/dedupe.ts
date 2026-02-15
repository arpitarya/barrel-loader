import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Remove duplicate exports
 * @param exports - Array of export objects
 * @returns Deduplicated exports
 */
function removeDuplicates(exports: ExportInfo[]): ExportInfo[] {
  if (nativeAddon?.remove_duplicates) {
    try {
      return nativeAddon.remove_duplicates(exports);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  const seen = new Map<string, boolean>();
  const deduped: ExportInfo[] = [];

  for (const exp of exports) {
    const key = `${exp.specifier}:${exp.source}:${exp.export_type}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(exp);
    }
  }

  return deduped;
}

export { removeDuplicates };
