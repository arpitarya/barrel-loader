mod rs_utils;
mod types;

// Re-export public API
pub use rs_utils::barrel_loader::BarrelLoader;
pub use types::{BarrelLoaderOptions, ExportInfo};

// Re-export NAPI bindings
pub use rs_utils::napi_bindings::{
    parse_exports_napi, process_barrel_file, reconstruct_source_napi, remove_duplicates,
    sort_exports_napi,
};
