use crate::barrel_loader::BarrelLoader;
use crate::deduplication::remove_duplicates as remove_duplicates_internal;
use crate::parser::parse_exports as parse_exports_internal;
use crate::reconstruction::reconstruct_source as reconstruct_source_internal;
use crate::sorting::sort_exports as sort_exports_internal;
use crate::types::{BarrelLoaderOptions, ExportInfo};
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
#[allow(clippy::needless_pass_by_value)]
pub fn process_barrel_file(
    source: String,
    file_path: String,
    options: Option<BarrelLoaderOptions>,
) -> Result<String> {
    let opts = options.unwrap_or_default();
    let loader = BarrelLoader::new(opts);
    loader
        .process(&source, &file_path)
        .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e))
}

#[napi]
#[allow(clippy::needless_pass_by_value)]
pub fn parse_exports_napi(source: String) -> Result<Vec<ExportInfo>> {
    parse_exports_internal(&source)
        .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e))
}

#[napi]
#[must_use]
pub fn remove_duplicates(exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
    remove_duplicates_internal(exports)
}

#[napi]
#[must_use]
pub fn sort_exports_napi(exports: Vec<ExportInfo>) -> Vec<ExportInfo> {
    sort_exports_internal(exports)
}

#[napi]
#[must_use]
#[allow(clippy::needless_pass_by_value)]
pub fn reconstruct_source_napi(source: String, exports: Vec<ExportInfo>) -> String {
    reconstruct_source_internal(&source, exports)
}
