use crate::types::ExportInfo;

/// Generate namespace export statements
fn generate_namespace(exports: &[ExportInfo], source: &str) -> Vec<String> {
    let mut lines = Vec::new();

    for exp in exports.iter().filter(|e| e.export_type == "namespace") {
        if exp.specifier == "*" {
            lines.push(format!(r#"export type * from "{source}";"#));
        } else {
            lines.push(format!(
                r#"export type * as {} from "{}";"#,
                exp.specifier, source
            ));
        }
    }

    lines
}

/// Generate default export statements
fn generate_default(exports: &[ExportInfo], source: &str) -> Vec<String> {
    let mut lines = Vec::new();

    for exp in exports.iter().filter(|e| e.export_type == "default") {
        if exp.specifier == "default" {
            lines.push(format!(r#"export type {{ default }} from "{source}";"#));
        } else {
            lines.push(format!(
                r#"export type {{ default as {} }} from "{}";"#,
                exp.specifier, source
            ));
        }
    }

    lines
}

/// Generate named export statements
fn generate_named(exports: &[ExportInfo], source: &str) -> Vec<String> {
    let named: Vec<_> = exports.iter().filter(|e| e.export_type == "named").collect();
    if named.is_empty() {
        return Vec::new();
    }
    let specifiers = named.iter().map(|e| e.specifier.as_str()).collect::<Vec<_>>().join(", ");
    vec![format!(r#"export type {{ {specifiers} }} from "{source}";"#)]
}

/// Generate export statements for type exports
#[must_use]
pub fn generate_type_exports(exports: &[ExportInfo], source: &str) -> Vec<String> {
    let mut lines = Vec::new();
    lines.extend(generate_namespace(exports, source));
    lines.extend(generate_default(exports, source));
    lines.extend(generate_named(exports, source));
    lines
}
