import fs from "node:fs";
import type { LoaderContext } from "@rspack/core";

interface BarrelLoaderOptions {
  /**
   * Whether to optimize barrel files by removing unused exports
   */
  optimize?: boolean;

  /**
   * Whether to sort exports alphabetically
   */
  sort?: boolean;

  /**
   * Custom filter function to determine if a file is a barrel file
   */
  isBarrelFile?: (filePath: string) => boolean;

  /**
   * Whether to remove duplicate exports
   */
  removeDuplicates?: boolean;

  /**
   * Whether to log barrel file detection and changes
   */
  verbose?: boolean;

  /**
   * Whether to convert namespace exports to named exports
   * Resolves `export * from "./module"` to `export { actual, exports } from "./module"`
   */
  convertNamespaceToNamed?: boolean;

  /**
   * Whether to recursively resolve barrel files to their root exports
   * If a barrel file exports from another barrel file, follows the chain to get actual exports
   */
  resolveBarrelExports?: boolean;
}

interface ExportInfo {
  specifier: string;
  source: string;
  type: "named" | "default" | "namespace";
  isTypeExport: boolean;
  line: number;
}

/**
 * Default barrel file detection: checks if file is an index file
 */
function defaultIsBarrelFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || "";
  return fileName === "index.ts" || fileName === "index.js" || fileName === "index.tsx" || fileName === "index.jsx";
}

/**
 * Extract export names from source code
 */
function extractExportNames(source: string): string[] {
  const names = new Set<string>();
  const lines = source.split("\n");

  // Match various export patterns
  const patterns = [
    // export function/class/const/interface/type/enum Name
    /^export\s+(?:function|class|const|interface|type|enum)\s+(\w+)/,
    // export { Name }
    /export\s*\{\s*([^}]+)\s*\}/,
    // export default (with optional name in some formats)
    /^export\s+default\s+(?:function|class|const)?\s*(\w+)?/,
  ];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Skip re-exports (they don't define new exports)
    if (trimmed.includes("from")) {
      return;
    }

    patterns.forEach((pattern) => {
      const match = trimmed.match(pattern);
      if (match) {
        if (match[1]) {
          // For export { x, y, z }, split and add each
          if (match[1].includes(",")) {
            match[1].split(",").forEach((name) => {
              const cleanName = name.trim().split(" ")[0]; // Handle "x as X" case
              if (cleanName) {
                names.add(cleanName);
              }
            });
          } else {
            const cleanName = match[1].trim().split(" ")[0];
            if (cleanName && cleanName !== "") {
              names.add(cleanName);
            }
          }
        }
      }
    });
  });

  return Array.from(names);
}

/**
 * Resolve namespace exports to named exports using loader context
 */
async function resolveNamespaceExports(
  filePath: string,
  loaderContext: LoaderContext<BarrelLoaderOptions>,
): Promise<string[]> {
  try {
    // Try to read the file using webpack's file system
    if (typeof loaderContext.fs?.readFile !== "function" || !loaderContext.fs) {
      return [];
    }

    const fileContent = await new Promise<string>((resolve, reject) => {
      loaderContext.fs!.readFile(filePath, (err: Error | null, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString("utf-8"));
        }
      });
    });

    return extractExportNames(fileContent);
  } catch {
    return [];
  }
}

/**
 * Resolve namespace export synchronously (fallback)
 */
function resolveNamespaceExportsSync(filePath: string, loaderContext: LoaderContext<BarrelLoaderOptions>): string[] {
  try {
    // Try to use sync read if available
    if (typeof loaderContext.fs?.readFileSync !== "function" || !loaderContext.fs) {
      return [];
    }

    const fileContent = loaderContext.fs.readFileSync(filePath, "utf-8");
    return extractExportNames(fileContent);
  } catch {
    return [];
  }
}

/**
 * Recursively resolve barrel file exports to their root sources
 * If a barrel file exports from another barrel file, follows the chain to actual implementations
 */
function resolveBarrelExportsRecursive(
  filePath: string,
  loaderContext: LoaderContext<BarrelLoaderOptions>,
  isBarrelFile: (filePath: string) => boolean,
  visited: Set<string> = new Set(),
): ExportInfo[] {
  // Prevent infinite loops
  if (visited.has(filePath)) {
    return [];
  }
  visited.add(filePath);

  try {
    if (typeof loaderContext.fs?.readFileSync !== "function" || !loaderContext.fs) {
      return [];
    }

    const fileContent = loaderContext.fs.readFileSync(filePath, "utf-8");
    const exports = parseExports(fileContent);

    if (!isBarrelFile(filePath)) {
      // Not a barrel file, return exports as-is
      return exports;
    }

    // This is a barrel file, check if it exports from other barrel files
    const resolvedExports: ExportInfo[] = [];
    const path = require("node:path");

    for (const exp of exports) {
      const dir = path.dirname(filePath);
      const resolvedPath = path.resolve(dir, exp.source);
      const extensions = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];

      let fullPath = "";
      for (const ext of extensions) {
        const candidate = resolvedPath.endsWith(ext) ? resolvedPath : `${resolvedPath}${ext}`;
        try {
          loaderContext.fs.readFileSync(candidate, "utf-8");
          fullPath = candidate;
          break;
        } catch {
          // Try next extension
        }
      }

      if (!fullPath) {
        // File not found, keep original export
        resolvedExports.push(exp);
        continue;
      }

      // Check if the resolved file is also a barrel file
      if (isBarrelFile(fullPath)) {
        // Recursively resolve this barrel file
        const barrelExports = resolveBarrelExportsRecursive(fullPath, loaderContext, isBarrelFile, visited);
        // Map exports to point to this barrel file's source
        for (const barrelExp of barrelExports) {
          resolvedExports.push({
            ...barrelExp,
            source: exp.source,
            isTypeExport: exp.isTypeExport || barrelExp.isTypeExport,
          });
        }
      } else {
        // Not a barrel file, keep original export
        resolvedExports.push(exp);
      }
    }

    return resolvedExports;
  } catch {
    return [];
  }
}
function parseExports(source: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const lines = source.split("\n");

  const reexportRegex = /^export\s+(?:\{[^}]+\}|\*)\s+from\s+['"]([^'"]+)['"]/;
  const typeReexportRegex = /^export\s+type\s+(?:\{[^}]+\}|\*)\s+from\s+['"]([^'"]+)['"]/;
  const defaultRegex = /^export\s+\{\s*default\s*(?:as\s+(\w+))?\s*\}\s+from\s+['"]([^'"]+)['"]/;
  const typeDefaultRegex = /^export\s+type\s+\{\s*default\s*(?:as\s+(\w+))?\s*\}\s+from\s+['"]([^'"]+)['"]/;
  const namespaceRegex = /^export\s+\*\s+(?:as\s+(\w+)\s+)?from\s+['"]([^'"]+)['"]/;
  const typeNamespaceRegex = /^export\s+type\s+\*\s+(?:as\s+(\w+)\s+)?from\s+['"]([^'"]+)['"]/;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed.startsWith("export")) {
      return;
    }

    const isTypeExport = trimmed.includes("export type");

    // Check for namespace export: export * from "..." or export type * from "..."
    const namespaceRegexToUse = isTypeExport ? typeNamespaceRegex : namespaceRegex;
    const namespaceMatch = trimmed.match(namespaceRegexToUse);
    if (namespaceMatch) {
      exports.push({
        specifier: namespaceMatch[1] || "*",
        source: namespaceMatch[2],
        type: "namespace",
        isTypeExport,
        line: index + 1,
      });
      return;
    }

    // Check for default export: export { default } from "..." or export type { default } from "..."
    const defaultRegexToUse = isTypeExport ? typeDefaultRegex : defaultRegex;
    const defaultMatch = trimmed.match(defaultRegexToUse);
    if (defaultMatch) {
      exports.push({
        specifier: defaultMatch[1] || "default",
        source: defaultMatch[2],
        type: "default",
        isTypeExport,
        line: index + 1,
      });
      return;
    }

    // Check for named re-exports: export { x, y } from "..." or export type { x, y } from "..."
    const reexportRegexToUse = isTypeExport ? typeReexportRegex : reexportRegex;
    const reexportMatch = trimmed.match(reexportRegexToUse);
    if (reexportMatch) {
      const source = reexportMatch[1];
      const specifiersMatch = trimmed.match(/\{([^}]+)\}/);
      if (specifiersMatch) {
        const specifiers = specifiersMatch[1].split(",").map((s) => s.trim());
        specifiers.forEach((spec) => {
          if (spec) {
            exports.push({
              specifier: spec,
              source,
              type: "named",
              isTypeExport,
              line: index + 1,
            });
          }
        });
      }
    }
  });

  return exports;
}

/**
 * Remove duplicate exports (keeps first occurrence)
 */
function removeDuplicateExports(exports: ExportInfo[]): ExportInfo[] {
  const seen = new Set<string>();
  return exports.filter((exp) => {
    const key = `${exp.type}:${exp.specifier}:${exp.source}:${exp.isTypeExport}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Sort exports alphabetically
 */
function sortExports(exports: ExportInfo[]): ExportInfo[] {
  return [...exports].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }
    return a.specifier.localeCompare(b.specifier);
  });
}

/**
 * Reconstruct source code from export info
 */
function reconstructSource(
  originalSource: string,
  exports: ExportInfo[],
  loaderContext?: LoaderContext<BarrelLoaderOptions>,
  convertNamespaceToNamed?: boolean,
): string {
  if (exports.length === 0) {
    return originalSource;
  }

  // Group exports by source, then by type (value vs type)
  const sourceMap = new Map<string, { valueExports: ExportInfo[]; typeExports: ExportInfo[] }>();
  exports.forEach((exp) => {
    if (!sourceMap.has(exp.source)) {
      sourceMap.set(exp.source, { valueExports: [], typeExports: [] });
    }
    const group = sourceMap.get(exp.source)!;
    if (exp.isTypeExport) {
      group.typeExports.push(exp);
    } else {
      group.valueExports.push(exp);
    }
  });

  const lines: string[] = [];

  // Keep original comments and non-export content at the top
  const originalLines = originalSource.split("\n");
  for (let i = 0; i < originalLines.length; i++) {
    const line = originalLines[i].trim();
    if (line.startsWith("export")) {
      break;
    }
    if (line && !line.startsWith("//")) {
      lines.push(originalLines[i]);
    }
  }

  // Add reconstructed exports, organized by source
  sourceMap.forEach((group, source) => {
    const { valueExports, typeExports } = group;

    // Process value exports first
    const valueNamedExports = valueExports.filter((e) => e.type === "named");
    const valueDefaultExports = valueExports.filter((e) => e.type === "default");
    const valueNamespaceExports = valueExports.filter((e) => e.type === "namespace");

    // Handle namespace exports
    valueNamespaceExports.forEach((exp) => {
      // Try to resolve namespace exports to named exports
      let resolvedNames: string[] = [];
      if (convertNamespaceToNamed && loaderContext) {
        const path = require("node:path");
        const dir = path.dirname(loaderContext.resourcePath);
        const fullPath = path.resolve(dir, exp.source);
        const extensions = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];

        for (const ext of extensions) {
          const filePath = fullPath.endsWith(ext) ? fullPath : `${fullPath}${ext}`;
          resolvedNames = resolveNamespaceExportsSync(filePath, loaderContext);
          if (resolvedNames.length > 0) {
            break;
          }
        }
      }

      if (resolvedNames && resolvedNames.length > 0) {
        // Convert to named export
        if (exp.specifier === "*") {
          lines.push(`export { ${resolvedNames.join(", ")} } from "${source}";`);
        } else {
          // For aliased namespace exports like `export * as helpers from "./helpers"`
          lines.push(
            `export { ${resolvedNames.map((n) => `${n} as ${exp.specifier}_${n}`).join(", ")} } from "${source}";`,
          );
        }
      } else {
        // Keep original namespace export if we can't resolve
        if (exp.specifier === "*") {
          lines.push(`export * from "${source}";`);
        } else {
          lines.push(`export * as ${exp.specifier} from "${source}";`);
        }
      }
    });

    // Handle default exports
    valueDefaultExports.forEach((exp) => {
      lines.push(`export { default${exp.specifier !== "default" ? ` as ${exp.specifier}` : ""} } from "${source}";`);
    });

    // Handle named exports
    if (valueNamedExports.length > 0) {
      const specifiers = valueNamedExports.map((e) => e.specifier).join(", ");
      lines.push(`export { ${specifiers} } from "${source}";`);
    }

    // Process type exports
    const typeNamedExports = typeExports.filter((e) => e.type === "named");
    const typeDefaultExports = typeExports.filter((e) => e.type === "default");
    const typeNamespaceExports = typeExports.filter((e) => e.type === "namespace");

    // Handle type namespace exports
    typeNamespaceExports.forEach((exp) => {
      let resolvedNames: string[] = [];
      if (convertNamespaceToNamed && loaderContext) {
        const path = require("node:path");
        const dir = path.dirname(loaderContext.resourcePath);
        const fullPath = path.resolve(dir, exp.source);
        const extensions = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];

        for (const ext of extensions) {
          const filePath = fullPath.endsWith(ext) ? fullPath : `${fullPath}${ext}`;
          resolvedNames = resolveNamespaceExportsSync(filePath, loaderContext);
          if (resolvedNames.length > 0) {
            break;
          }
        }
      }

      if (resolvedNames && resolvedNames.length > 0) {
        if (exp.specifier === "*") {
          lines.push(`export type { ${resolvedNames.join(", ")} } from "${source}";`);
        } else {
          lines.push(
            `export type { ${resolvedNames.map((n) => `${n} as ${exp.specifier}_${n}`).join(", ")} } from "${source}";`,
          );
        }
      } else {
        if (exp.specifier === "*") {
          lines.push(`export type * from "${source}";`);
        } else {
          lines.push(`export type * as ${exp.specifier} from "${source}";`);
        }
      }
    });

    // Handle type default exports
    typeDefaultExports.forEach((exp) => {
      lines.push(
        `export type { default${exp.specifier !== "default" ? ` as ${exp.specifier}` : ""} } from "${source}";`,
      );
    });

    // Handle type named exports
    if (typeNamedExports.length > 0) {
      const specifiers = typeNamedExports.map((e) => e.specifier).join(", ");
      lines.push(`export type { ${specifiers} } from "${source}";`);
    }
  });

  // Ensure final newline
  if (lines.length > 0 && lines[lines.length - 1] !== "") {
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Rspack loader for barrel files
 */
function barrelLoader(this: LoaderContext<BarrelLoaderOptions>, source: string): string {
  const options: BarrelLoaderOptions = this.getOptions() || {};
  const isBarrelFile = options.isBarrelFile || defaultIsBarrelFile;

  // Check if this is a barrel file
  if (!isBarrelFile(this.resourcePath)) {
    return source;
  }

  if (options.verbose) {
    console.log(`[barrel-loader] Processing barrel file: ${this.resourcePath}`);
  }

  let exports = parseExports(source);

  if (exports.length === 0) {
    if (options.verbose) {
      console.log(`[barrel-loader] No exports found in: ${this.resourcePath}`);
    }
    return source;
  }

  // Resolve barrel exports recursively if requested
  if (options.resolveBarrelExports) {
    const resolvedExports = resolveBarrelExportsRecursive(this.resourcePath, this, isBarrelFile);
    if (resolvedExports.length > 0) {
      exports = resolvedExports;
      if (options.verbose) {
        console.log(`[barrel-loader] Resolved barrel exports in: ${this.resourcePath}`);
      }
    }
  }

  // Remove duplicates if requested
  if (options.removeDuplicates !== false) {
    const before = exports.length;
    exports = removeDuplicateExports(exports);
    if (options.verbose && exports.length < before) {
      console.log(`[barrel-loader] Removed ${before - exports.length} duplicate exports from: ${this.resourcePath}`);
    }
  }

  // Sort exports if requested
  if (options.sort) {
    exports = sortExports(exports);
    if (options.verbose) {
      console.log(`[barrel-loader] Sorted exports in: ${this.resourcePath}`);
    }
  }

  // Reconstruct source
  const transformed = reconstructSource(source, exports, this, options.convertNamespaceToNamed);

  if (options.verbose && transformed !== source) {
    console.log(`[barrel-loader] Transformed barrel file: ${this.resourcePath}`);
  }

  if (process.env.BARREL_LOADER_DEBUG === "true" && transformed !== source) {
    console.log(`[barrel-loader] Original source:\n${source}`);
    console.log(`[barrel-loader] Transformed source:\n${transformed}`);

    const barrelTransformedPath = `${this.resourcePath}.transformed.barrel.ts`;
    fs.writeFileSync(barrelTransformedPath, transformed, "utf-8");
  }

  return transformed;
}

export type { BarrelLoaderOptions };
export default barrelLoader;
