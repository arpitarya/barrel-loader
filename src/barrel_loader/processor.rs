use crate::deduplication::remove_duplicates;
use crate::parser::parse_exports;
use crate::reconstruction::reconstruct_source;
use crate::sorting::sort_exports;
use crate::types::BarrelLoaderOptions;

/// Process a barrel file with the given options
pub fn process_file(
    source: &str,
    file_path: &str,
    options: &BarrelLoaderOptions,
) -> Result<String, String> {
    if options.verbose.unwrap_or(false) {
        eprintln!("[barrel-loader] Processing barrel file: {file_path}");
    }

    let mut exports = parse_exports(source)?;

    if exports.is_empty() {
        if options.verbose.unwrap_or(false) {
            eprintln!("[barrel-loader] No exports found in: {file_path}");
        }
        return Ok(source.to_string());
    }

    // Remove duplicates if requested
    if options.remove_duplicates.unwrap_or(true) {
        let before = exports.len();
        exports = remove_duplicates(exports);
        if options.verbose.unwrap_or(false) && exports.len() < before {
            eprintln!(
                "[barrel-loader] Removed {} duplicate exports from: {}",
                before - exports.len(),
                file_path
            );
        }
    }

    // Sort exports if requested
    if options.sort.unwrap_or(false) {
        exports = sort_exports(exports);
        if options.verbose.unwrap_or(false) {
            eprintln!("[barrel-loader] Sorted exports in: {file_path}");
        }
    }

    // Reconstruct source
    let transformed = reconstruct_source(source, exports);

    if options.verbose.unwrap_or(false) && transformed != source {
        eprintln!("[barrel-loader] Transformed barrel file: {file_path}");
    }

    Ok(transformed)
}
