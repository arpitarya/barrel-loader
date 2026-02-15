import type { ExportInfo } from '../barrel-loader.types';
import { nativeAddon } from './native-addon';

/**
 * Process a barrel file and extract all exports
 * @param content - The content of the barrel file
 * @param filePath - The file path (for error reporting)
 * @returns Array of export objects
 */
function parseExports(content: string, filePath = ''): ExportInfo[] {
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

export { parseExports };
