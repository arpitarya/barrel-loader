// Load the native Rust addon
let nativeAddon;

try {
  nativeAddon = require("./native/barrel_loader_rs.node");
} catch (err) {
  // Fallback to JavaScript implementation if native addon is not available
  console.warn("Failed to load native addon, falling back to JavaScript:", err.message);
  nativeAddon = null;
}

/**
 * Process a barrel file and extract all exports
 * @param {string} content - The content of the barrel file
 * @param {string} filePath - The file path (for error reporting)
 * @returns {Array} Array of export objects
 */
function parseExports(content, filePath = "") {
  if (nativeAddon && nativeAddon.process_barrel_file) {
    try {
      return nativeAddon.process_barrel_file(content, filePath);
    } catch (err) {
      console.warn("Native addon error, falling back to JavaScript:", err.message);
    }
  }

  // Fallback implementation
  return [];
}

/**
 * Remove duplicate exports
 * @param {Array} exports - Array of export objects
 * @returns {Array} Deduplicated exports
 */
function removeDuplicates(exports) {
  if (nativeAddon && nativeAddon.remove_duplicates) {
    try {
      return nativeAddon.remove_duplicates(exports);
    } catch (err) {
      console.warn("Native addon error, falling back to JavaScript:", err.message);
    }
  }

  // Fallback: deduplicate by creating a map
  const seen = new Map();
  const deduped = [];

  for (const exp of exports) {
    const key = `${exp.name}:${exp.source}:${exp.export_type}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(exp);
    }
  }

  return deduped;
}

/**
 * Sort exports by name
 * @param {Array} exports - Array of export objects
 * @returns {Array} Sorted exports
 */
function sortExports(exports) {
  if (nativeAddon && nativeAddon.sort_exports_napi) {
    try {
      return nativeAddon.sort_exports_napi(exports);
    } catch (err) {
      console.warn("Native addon error, falling back to JavaScript:", err.message);
    }
  }

  // Fallback: sort by name
  return [...exports].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Reconstruct source code from parsed exports
 * @param {Array} exports - Array of export objects
 * @returns {string} Reconstructed source code
 */
function reconstructSource(exports) {
  if (nativeAddon && nativeAddon.reconstruct_source_napi) {
    try {
      return nativeAddon.reconstruct_source_napi(exports);
    } catch (err) {
      console.warn("Native addon error, falling back to JavaScript:", err.message);
    }
  }

  // Fallback implementation
  if (exports.length === 0) {
    return "";
  }

  let result = "";
  const sources = new Map();

  // Group exports by source
  for (const exp of exports) {
    const key = `${exp.source}:${exp.export_type}`;
    if (!sources.has(key)) {
      sources.set(key, []);
    }
    sources.get(key).push(exp.name);
  }

  // Reconstruct imports
  for (const [key, names] of sources) {
    const [source, exportType] = key.split(":");
    const typePrefix = exportType === "type" ? "type " : "";
    result += `export ${typePrefix}{ ${names.join(", ")} } from '${source}';\n`;
  }

  return result;
}

module.exports = {
  parseExports,
  removeDuplicates,
  sortExports,
  reconstructSource,
  // For testing/advanced usage
  nativeAddon,
};
