import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Remove duplicate exports
 * @param exports - Array of export objects
 * @returns Deduplicated exports
 */
function getDedupedExports(exports: ExportInfo[]): ExportInfo[] {
  if (!nativeAddon?.remove_duplicates) {
    throw new Error('Native addon not available');
  }

  try {
    return nativeAddon.remove_duplicates(exports);
  } catch (err) {
    const error = err as Error;
    console.warn('Native addon error, falling back to JavaScript:', error.message);
    throw error;
  }
}

export { getDedupedExports };
