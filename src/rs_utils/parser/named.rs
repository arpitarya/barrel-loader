use regex::Regex;

/// Parse named exports from a line
/// Matches: export { foo, bar } from "./module"
#[must_use]
pub fn parse_named_export(line: &str) -> Option<Vec<(String, String)>> {
    let re = Regex::new(r#"export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]"#).ok()?;
    let caps = re.captures(line)?;
    let specifiers = caps.get(1)?.as_str();
    let source = caps.get(2)?.as_str();

    let pairs: Vec<(String, String)> = specifiers
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| (s.to_string(), source.to_string()))
        .collect();

    if pairs.is_empty() {
        None
    } else {
        Some(pairs)
    }
}
