use regex::Regex;

/// Parse default exports from a line
/// Matches: export { default } from "./module" or export { default as Name } from "./module"
#[must_use]
pub fn parse_default_export(line: &str) -> Option<(String, String)> {
    let re = Regex::new(
        r#"export\s+(?:type\s+)?\{\s*default\s*(?:as\s+(\w+))?\s*\}\s+from\s+['"]([^'"]+)['"]"#,
    )
    .ok()?;
    let caps = re.captures(line)?;
    let specifier = caps
        .get(1)
        .map_or_else(|| "default".to_string(), |m| m.as_str().to_string());
    let source = caps.get(2)?.as_str();

    Some((specifier, source.to_string()))
}
