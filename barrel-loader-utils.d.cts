/**
 * Type definitions for barrel-loader-rs native addon
 */

export interface ExportInfo {
  name: string;
  source: string;
  export_type: 'named' | 'default' | 'namespace' | 'type';
  is_type_export: boolean;
}

/**
 * Parse a barrel file and extract all exports
 * @param content - The content of the barrel file
 * @param filePath - The file path (for error reporting)
 * @returns Array of export objects
 */
export function parseExports(content: string, filePath?: string): ExportInfo[];

/**
 * Remove duplicate exports
 * @param exports - Array of export objects
 * @returns Deduplicated exports
 */
export function removeDuplicates(exports: ExportInfo[]): ExportInfo[];

/**
 * Sort exports by name
 * @param exports - Array of export objects
 * @returns Sorted exports
 */
export function sortExports(exports: ExportInfo[]): ExportInfo[];

/**
 * Reconstruct source code from parsed exports
 * @param exports - Array of export objects
 * @returns Reconstructed source code
 */
export function reconstructSource(exports: ExportInfo[]): string;

/**
 * Access to the native addon (if available)
 */
export const nativeAddon: any;
