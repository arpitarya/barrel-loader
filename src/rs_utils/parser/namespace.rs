use regex::Regex;

/// Parse namespace exports from a line
/// Matches: export * from "./module" or export * as helpers from "./module"
#[must_use]
pub fn parse_namespace_export(line: &str) -> Option<(String, String)> {
    let re =
        Regex::new(r#"export\s+(?:type\s+)?\*\s+(?:as\s+(\w+)\s+)?from\s+['"]([^'"]+)['"]"#)
            .ok()?;
    let caps = re.captures(line)?;
    let specifier = caps
        .get(1)
        .map_or_else(|| "*".to_string(), |m| m.as_str().to_string());
    let source = caps.get(2)?.as_str();

    Some((specifier, source.to_string()))
}
