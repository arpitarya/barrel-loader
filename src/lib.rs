// Module declarations
mod barrel_loader;
mod deduplication;
mod napi_bindings;
mod parser;
mod reconstruction;
mod sorting;
mod types;

// Re-export public API
pub use barrel_loader::BarrelLoader;
pub use types::{BarrelLoaderOptions, ExportInfo};

// Re-export NAPI bindings
pub use napi_bindings::{
    parse_exports_napi, process_barrel_file, reconstruct_source_napi, remove_duplicates,
    sort_exports_napi,
};
