import * as path from 'node:path';
import type { NativeAddon } from '../barrel-loader.types';

/**
 * Load the native Rust addon with fallback support
 */
let nativeAddon: NativeAddon | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const addonPath = path.join(__dirname, 'barrel_loader_rs.node');
  const rawAddon = require(addonPath) as Record<string, unknown>;
  nativeAddon = {
    parse_exports_napi: rawAddon.parseExportsNapi as NativeAddon['parse_exports_napi'],
    process_barrel_file: rawAddon.processBarrelFile as NativeAddon['process_barrel_file'],
    remove_duplicates: rawAddon.removeDuplicates as NativeAddon['remove_duplicates'],
    sort_exports_napi: rawAddon.sortExportsNapi as NativeAddon['sort_exports_napi'],
    reconstruct_source_napi:
      rawAddon.reconstructSourceNapi as NativeAddon['reconstruct_source_napi'],
  };
} catch (err) {
  const error = err as Error;
  console.warn('Failed to load native addon, falling back to JavaScript:', error.message);
  nativeAddon = null;
}

export { nativeAddon };
