/**
 * Type definitions for barrel-loader
 */

export interface ExportInfo {
  specifier: string;
  source: string;
  export_type: 'named' | 'default' | 'namespace' | 'type';
  is_type_export: boolean;
}

export interface BarrelLoaderOptions {
  /**
   * Enable/disable recursive barrel file resolution
   * @default true
   */
  resolveBarrelFiles?: boolean;

  /**
   * Remove duplicate exports
   * @default true
   */
  removeDuplicates?: boolean;

  /**
   * Sort exports alphabetically
   * @default false
   */
  sort?: boolean;

  /**
   * Convert namespace exports to named exports
   * @default false
   */
  convertNamespaceToNamed?: boolean;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

export interface LoaderContext<T = unknown> {
  resourcePath?: string;
  resource?: string;
  fs?: typeof import('fs');
  sourceMap?: boolean;
  callback?: (err: Error | null, content?: string, sourceMap?: unknown) => void;
  getOptions?: () => T;
}

export interface NativeAddon {
  process_barrel_file?: (
    content: string,
    filePath: string,
    options?: BarrelLoaderOptions
  ) => string;
  parse_exports_napi?: (content: string) => ExportInfo[];
  remove_duplicates?: (exports: ExportInfo[]) => ExportInfo[];
  sort_exports_napi?: (exports: ExportInfo[]) => ExportInfo[];
  reconstruct_source_napi?: (source: string, exports: ExportInfo[]) => string;
}
