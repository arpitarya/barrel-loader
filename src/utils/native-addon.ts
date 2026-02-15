import type { NativeAddon } from '../barrel-loader.types';

/**
 * Load the native Rust addon with fallback support
 */
let nativeAddon: NativeAddon | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nativeAddon = require('../../native/barrel_loader_rs.node') as NativeAddon;
} catch (err) {
  const error = err as Error;
  console.warn('Failed to load native addon, falling back to JavaScript:', error.message);
  nativeAddon = null;
}

export { nativeAddon };
