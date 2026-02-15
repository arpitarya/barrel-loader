use crate::types::ExportInfo;
use std::collections::HashMap;

/// Group exports by source and type (value vs type exports)
/// Returns a `HashMap` where:
/// - Key: source path
/// - Value: (`value_exports`, `type_exports`)
#[must_use]
pub fn group_exports_by_source(
    exports: Vec<ExportInfo>,
) -> HashMap<String, (Vec<ExportInfo>, Vec<ExportInfo>)> {
    let mut source_map: HashMap<String, (Vec<ExportInfo>, Vec<ExportInfo>)> = HashMap::new();

    for exp in exports {
        let key = exp.source.clone();
        let entry = source_map
            .entry(key)
            .or_insert_with(|| (Vec::new(), Vec::new()));
        if exp.is_type_export {
            entry.1.push(exp);
        } else {
            entry.0.push(exp);
        }
    }

    source_map
}
