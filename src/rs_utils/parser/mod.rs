mod default;
mod export_builder;
mod line_parser;
mod named;
mod namespace;

pub use default::parse_default_export;
pub use export_builder::create_export;
pub use named::parse_named_export;
pub use namespace::parse_namespace_export;

use crate::types::ExportInfo;
use line_parser::parse_line;

/// Parse exports from source code
#[allow(clippy::unnecessary_wraps)]
pub fn parse_exports(source: &str) -> Result<Vec<ExportInfo>, String> {
    let exports: Vec<ExportInfo> = source
        .lines()
        .enumerate()
        .flat_map(|(index, line)| parse_line(line, index + 1))
        .collect();

    Ok(exports)
}
