use crate::types::ExportInfo;

/// Sort exports first by source, then by specifier
/// This groups exports from the same source together
/// and alphabetically sorts specifiers within each group
#[must_use]
pub fn sort_exports(mut exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
    exports.sort_by(|a, b| {
        if a.source != b.source {
            return a.source.cmp(&b.source);
        }
        a.specifier.cmp(&b.specifier)
    });
    exports
}
