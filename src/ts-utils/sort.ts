import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Sort exports by source and name
 * @param exports - Array of export objects
 * @returns Sorted exports
 */
function sortExports(exports: ExportInfo[]): ExportInfo[] {
  if (nativeAddon?.sort_exports_napi) {
    try {
      return nativeAddon.sort_exports_napi(exports);
    } catch (err) {
      const error = err as Error;
      console.warn('Native addon error, falling back to JavaScript:', error.message);
    }
  }

  return [...exports].sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.specifier.localeCompare(b.specifier);
  });
}

export { sortExports };
