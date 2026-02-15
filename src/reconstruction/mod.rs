mod grouping;
mod type_exports;
mod value_exports;

use crate::types::ExportInfo;
use grouping::group_exports_by_source;
use type_exports::generate_type_exports;
use value_exports::generate_value_exports;

/// Reconstruct source from exports
/// Preserves non-export content and regenerates export statements
#[must_use]
pub fn reconstruct_source(original_source: &str, exports: Vec<ExportInfo>) -> String {
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
    let source_map = group_exports_by_source(exports);

    // Generate reconstructed exports
    for (source, (value_exports, type_exports)) in source_map {
        // Generate value exports
        let value_lines = generate_value_exports(&value_exports, &source);
        lines.extend(value_lines);

        // Generate type exports
        let type_lines = generate_type_exports(&type_exports, &source);
        lines.extend(type_lines);
    }

    if !lines.is_empty() {
        lines.push(String::new());
    }

    lines.join("\n")
}
