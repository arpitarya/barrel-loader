use crate::types::ExportInfo;

use super::{create_export, parse_default_export, parse_named_export, parse_namespace_export};

/// Parse exports from a single line of code
pub fn parse_line(line: &str, line_number: usize) -> Vec<ExportInfo> {
    let trimmed = line.trim();
    if !trimmed.starts_with("export") {
        return Vec::new();
    }

    let is_type = trimmed.contains("export type");

    // Named exports
    if let Some(captures) = parse_named_export(trimmed) {
        return captures
            .into_iter()
            .map(|(spec, src)| create_export(spec, src, "named", is_type, line_number))
            .collect();
    }

    // Default exports
    if let Some((spec, src)) = parse_default_export(trimmed) {
        return vec![create_export(spec, src, "default", is_type, line_number)];
    }

    // Namespace exports
    if let Some((spec, src)) = parse_namespace_export(trimmed) {
        return vec![create_export(spec, src, "namespace", is_type, line_number)];
    }

    Vec::new()
}
