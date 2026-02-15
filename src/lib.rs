use napi::bindgen_prelude::*;
use napi_derive::napi;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::Path;

/// Represents an export statement
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ExportInfo {
    pub specifier: String,
    pub source: String,
    #[serde(rename = "type")]
    pub export_type: String, // "named" | "default" | "namespace"
    pub is_type_export: bool,
    pub line: u32,
}

/// Options for the barrel loader
#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct BarrelLoaderOptions {
    pub optimize: Option<bool>,
    pub sort: Option<bool>,
    pub remove_duplicates: Option<bool>,
    pub verbose: Option<bool>,
    pub convert_namespace_to_named: Option<bool>,
    pub resolve_barrel_exports: Option<bool>,
}

/// Main barrel loader
pub struct BarrelLoader {
    options: BarrelLoaderOptions,
}

impl BarrelLoader {
    pub fn new(options: BarrelLoaderOptions) -> Self {
        Self { options }
    }

    /// Check if a file is a barrel file
    pub fn is_barrel_file(&self, file_path: &str) -> bool {
        let path = Path::new(file_path);
        match path.file_name() {
            Some(name) => {
                let name = name.to_string_lossy();
                matches!(
                    name.as_ref(),
                    "index.ts" | "index.js" | "index.tsx" | "index.jsx"
                )
            }
            None => false,
        }
    }

    /// Parse exports from source code
    pub fn parse_exports(&self, source: &str) -> Result<Vec<ExportInfo>, String> {
        let mut exports = Vec::new();
        let lines: Vec<&str> = source.lines().collect();

        for (index, line) in lines.iter().enumerate() {
            let trimmed = line.trim();

            if !trimmed.starts_with("export") {
                continue;
            }

            let is_type_export = trimmed.contains("export type");

            // Parse named exports
            if let Some(captures) = self.parse_named_export(trimmed) {
                for (specifier, source) in captures {
                    exports.push(ExportInfo {
                        specifier,
                        source,
                        export_type: "named".to_string(),
                        is_type_export,
                        line: (index + 1) as u32,
                    });
                }
                continue;
            }

            // Parse default exports
            if let Some((specifier, source)) = self.parse_default_export(trimmed) {
                exports.push(ExportInfo {
                    specifier,
                    source,
                    export_type: "default".to_string(),
                    is_type_export,
                    line: (index + 1) as u32,
                });
                continue;
            }

            // Parse namespace exports
            if let Some((specifier, source)) = self.parse_namespace_export(trimmed) {
                exports.push(ExportInfo {
                    specifier,
                    source,
                    export_type: "namespace".to_string(),
                    is_type_export,
                    line: (index + 1) as u32,
                });
            }
        }

        Ok(exports)
    }

    fn parse_named_export(&self, line: &str) -> Option<Vec<(String, String)>> {
        // Match: export { foo, bar } from "./module"
        let re = Regex::new(r#"export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]"#).ok()?;
        let caps = re.captures(line)?;
        let specifiers = caps.get(1)?.as_str();
        let source = caps.get(2)?.as_str();

        let pairs: Vec<(String, String)> = specifiers
            .split(',')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| (s.to_string(), source.to_string()))
            .collect();

        if pairs.is_empty() {
            None
        } else {
            Some(pairs)
        }
    }

    fn parse_default_export(&self, line: &str) -> Option<(String, String)> {
        // Match: export { default } from "./module" or export { default as Name } from "./module"
        let re = Regex::new(r#"export\s+(?:type\s+)?\{\s*default\s*(?:as\s+(\w+))?\s*\}\s+from\s+['"]([^'"]+)['"]"#).ok()?;
        let caps = re.captures(line)?;
        let specifier = caps.get(1).map(|m| m.as_str().to_string()).unwrap_or_else(|| "default".to_string());
        let source = caps.get(2)?.as_str();

        Some((specifier, source.to_string()))
    }

    fn parse_namespace_export(&self, line: &str) -> Option<(String, String)> {
        // Match: export * from "./module" or export * as helpers from "./module"
        let re = Regex::new(r#"export\s+(?:type\s+)?\*\s+(?:as\s+(\w+)\s+)?from\s+['"]([^'"]+)['"]"#).ok()?;
        let caps = re.captures(line)?;
        let specifier = caps.get(1).map(|m| m.as_str().to_string()).unwrap_or_else(|| "*".to_string());
        let source = caps.get(2)?.as_str();

        Some((specifier, source.to_string()))
    }

    /// Remove duplicate exports
    pub fn remove_duplicates(&self, exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
        let mut seen = HashSet::new();
        exports
            .into_iter()
            .filter(|exp| {
                let key = format!(
                    "{}:{}:{}:{}",
                    &exp.export_type,
                    exp.specifier,
                    exp.source,
                    exp.is_type_export
                );
                seen.insert(key)
            })
            .collect()
    }

    /// Sort exports
    pub fn sort_exports(&self, mut exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
        exports.sort_by(|a, b| {
            if a.source != b.source {
                return a.source.cmp(&b.source);
            }
            a.specifier.cmp(&b.specifier)
        });
        exports
    }

    /// Reconstruct source from exports
    pub fn reconstruct_source(&self, original_source: &str, exports: Vec<ExportInfo>) -> String {
        if exports.is_empty() {
            return original_source.to_string();
        }

        let mut lines = Vec::new();

        // Keep original non-export content
        for line in original_source.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("export") {
                break;
            }
            if !trimmed.is_empty() && !trimmed.starts_with("//") {
                lines.push(line.to_string());
            }
        }

        // Group exports by source and type
        let mut source_map: HashMap<String, (Vec<ExportInfo>, Vec<ExportInfo>)> = HashMap::new();
        for exp in exports {
            let key = exp.source.clone();
            let entry = source_map.entry(key).or_insert_with(|| (Vec::new(), Vec::new()));
            if exp.is_type_export {
                entry.1.push(exp);
            } else {
                entry.0.push(exp);
            }
        }

        // Generate reconstructed exports
        for (source, (value_exports, type_exports)) in source_map {
            // Handle value exports
            let namespace_exports: Vec<_> = value_exports
                .iter()
                .filter(|e| e.export_type == "namespace")
                .collect();
            let default_exports: Vec<_> = value_exports
                .iter()
                .filter(|e| e.export_type == "default")
                .collect();
            let named_exports: Vec<_> = value_exports
                .iter()
                .filter(|e| e.export_type == "named")
                .collect();

            // Namespace exports first
            for exp in namespace_exports {
                if exp.specifier == "*" {
                    lines.push(format!(r#"export * from "{}";"#, source));
                } else {
                    lines.push(format!(r#"export * as {} from "{}";"#, exp.specifier, source));
                }
            }

            // Default exports
            for exp in default_exports {
                if exp.specifier == "default" {
                    lines.push(format!(r#"export {{ default }} from "{}";"#, source));
                } else {
                    lines.push(format!(r#"export {{ default as {} }} from "{}";"#, exp.specifier, source));
                }
            }

            // Combined named exports
            if !named_exports.is_empty() {
                let specifiers = named_exports
                    .iter()
                    .map(|e| e.specifier.as_str())
                    .collect::<Vec<_>>()
                    .join(", ");
                lines.push(format!(r#"export {{ {} }} from "{}";"#, specifiers, source));
            }

            // Handle type exports
            let type_namespace_exports: Vec<_> = type_exports
                .iter()
                .filter(|e| e.export_type == "namespace")
                .collect();
            let type_default_exports: Vec<_> = type_exports
                .iter()
                .filter(|e| e.export_type == "default")
                .collect();
            let type_named_exports: Vec<_> = type_exports
                .iter()
                .filter(|e| e.export_type == "named")
                .collect();

            // Type namespace exports
            for exp in type_namespace_exports {
                if exp.specifier == "*" {
                    lines.push(format!(r#"export type * from "{}";"#, source));
                } else {
                    lines.push(format!(r#"export type * as {} from "{}";"#, exp.specifier, source));
                }
            }

            // Type default exports
            for exp in type_default_exports {
                if exp.specifier == "default" {
                    lines.push(format!(r#"export type {{ default }} from "{}";"#, source));
                } else {
                    lines.push(format!(r#"export type {{ default as {} }} from "{}";"#, exp.specifier, source));
                }
            }

            // Combined type named exports
            if !type_named_exports.is_empty() {
                let specifiers = type_named_exports
                    .iter()
                    .map(|e| e.specifier.as_str())
                    .collect::<Vec<_>>()
                    .join(", ");
                lines.push(format!(r#"export type {{ {} }} from "{}";"#, specifiers, source));
            }
        }

        if !lines.is_empty() {
            lines.push(String::new());
        }

        lines.join("\n")
    }

    /// Process a barrel file
    pub fn process(&self, source: &str, file_path: &str) -> Result<String, String> {
        if !self.is_barrel_file(file_path) {
            return Ok(source.to_string());
        }

        if self.options.verbose.unwrap_or(false) {
            eprintln!("[barrel-loader] Processing barrel file: {}", file_path);
        }

        let mut exports = self.parse_exports(source)?;

        if exports.is_empty() {
            if self.options.verbose.unwrap_or(false) {
                eprintln!("[barrel-loader] No exports found in: {}", file_path);
            }
            return Ok(source.to_string());
        }

        // Remove duplicates if requested
        if self.options.remove_duplicates.unwrap_or(true) {
            let before = exports.len();
            exports = self.remove_duplicates(exports);
            if self.options.verbose.unwrap_or(false) && exports.len() < before {
                eprintln!(
                    "[barrel-loader] Removed {} duplicate exports from: {}",
                    before - exports.len(),
                    file_path
                );
            }
        }

        // Sort exports if requested
        if self.options.sort.unwrap_or(false) {
            exports = self.sort_exports(exports);
            if self.options.verbose.unwrap_or(false) {
                eprintln!("[barrel-loader] Sorted exports in: {}", file_path);
            }
        }

        // Reconstruct source
        let transformed = self.reconstruct_source(source, exports);

        if self.options.verbose.unwrap_or(false) && transformed != source {
            eprintln!("[barrel-loader] Transformed barrel file: {}", file_path);
        }

        Ok(transformed)
    }
}

#[napi]
pub fn process_barrel_file(
    source: String,
    file_path: String,
    options: Option<BarrelLoaderOptions>,
) -> Result<String> {
    let opts = options.unwrap_or_default();
    let loader = BarrelLoader::new(opts);
    loader.process(&source, &file_path).map_err(|e| napi::Error::new(napi::Status::GenericFailure, e))
}

#[napi]
pub fn parse_exports_napi(source: String) -> Result<Vec<ExportInfo>> {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    loader.parse_exports(&source).map_err(|e| napi::Error::new(napi::Status::GenericFailure, e))
}

#[napi]
pub fn remove_duplicates(exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    loader.remove_duplicates(exports)
}

#[napi]
pub fn sort_exports_napi(exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    loader.sort_exports(exports)
}

#[napi]
pub fn reconstruct_source_napi(source: String, exports: Vec<ExportInfo>) -> String {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    loader.reconstruct_source(&source, exports)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_barrel_file() {
        let loader = BarrelLoader::new(BarrelLoaderOptions::default());
        assert!(loader.is_barrel_file("/path/to/index.ts"));
        assert!(loader.is_barrel_file("/path/to/index.js"));
        assert!(loader.is_barrel_file("/path/to/index.tsx"));
        assert!(!loader.is_barrel_file("/path/to/component.ts"));
    }

    #[test]
    fn test_parse_named_exports() {
        let loader = BarrelLoader::new(BarrelLoaderOptions::default());
        let source = r#"export { Button, Form } from "./Button";"#;
        let exports = loader.parse_exports(source).unwrap();
        assert_eq!(exports.len(), 2);
        assert_eq!(exports[0].specifier, "Button");
        assert_eq!(exports[1].specifier, "Form");
    }

    #[test]
    fn test_remove_duplicates() {
        let loader = BarrelLoader::new(BarrelLoaderOptions::default());
        let exports = vec![
            ExportInfo {
                specifier: "Button".to_string(),
                source: "./Button".to_string(),
                export_type: "named".to_string(),
                is_type_export: false,
                line: 1,
            },
            ExportInfo {
                specifier: "Button".to_string(),
                source: "./Button".to_string(),
                export_type: "named".to_string(),
                is_type_export: false,
                line: 2,
            },
        ];
        let deduped = loader.remove_duplicates(exports);
        assert_eq!(deduped.len(), 1);
    }

    #[test]
    fn test_process_barrel_file() {
        let loader = BarrelLoader::new(BarrelLoaderOptions {
            remove_duplicates: Some(true),
            ..Default::default()
        });
        let source = r#"export { Button } from "./Button";
export { Button } from "./Button";"#;
        let result = loader.process(source, "/path/to/index.ts").unwrap();
        assert!(result.contains("Button"));
        // Should have only one export statement
        let count = result.matches("export").count();
        assert_eq!(count, 1);
    }
}
