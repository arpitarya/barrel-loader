use crate::types::ExportInfo;

/// Create an `ExportInfo` struct
#[allow(clippy::cast_possible_truncation)]
#[must_use]
pub fn create_export(
    specifier: String,
    source: String,
    export_type: &str,
    is_type_export: bool,
    line_number: usize,
) -> ExportInfo {
    ExportInfo {
        specifier,
        source,
        export_type: export_type.to_string(),
        is_type_export,
        line: line_number as u32,
    }
}
