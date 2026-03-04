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
    return nativeAddon.reconstruct_source_napi('', exports);
  } catch (err) {
    const error = err as Error;
    console.warn('Native addon error, falling back to JavaScript:', error.message);
    throw error;
  }
}

export { reconstructSource };
