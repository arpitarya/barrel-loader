use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents an export statement
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct ExportInfo {
    pub specifier: String,
    pub source: String,
    #[serde(rename = "type")]
    pub export_type: String, // "named" | "default" | "namespace"
    pub is_type_export: bool,
    pub line: u32,
}

/// Options for the barrel loader
#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct BarrelLoaderOptions {
    pub optimize: Option<bool>,
    pub sort: Option<bool>,
    pub remove_duplicates: Option<bool>,
    pub verbose: Option<bool>,
    pub convert_namespace_to_named: Option<bool>,
    pub resolve_barrel_exports: Option<bool>,
}
