use crate::types::ExportInfo;
use std::collections::HashSet;

/// Remove duplicate exports by creating a unique key for each export
/// The key is a combination of export type, specifier, source, and type flag
#[must_use]
pub fn remove_duplicates(exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
    let mut seen = HashSet::new();
    exports
        .into_iter()
        .filter(|exp| {
            let key = format!(
                "{}:{}:{}:{}",
                &exp.export_type, exp.specifier, exp.source, exp.is_type_export
            );
            seen.insert(key)
        })
        .collect()
}
