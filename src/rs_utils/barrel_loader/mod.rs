mod file_check;
mod processor;

use crate::types::BarrelLoaderOptions;
pub use file_check::is_barrel_file;
use processor::process_file;

/// Main barrel loader
pub struct BarrelLoader {
    options: BarrelLoaderOptions,
}

impl BarrelLoader {
    #[must_use]
    pub const fn new(options: BarrelLoaderOptions) -> Self {
        Self { options }
    }

    /// Check if a file is a barrel file
    #[must_use]
    pub fn is_barrel_file(&self, file_path: &str) -> bool {
        is_barrel_file(file_path)
    }

    /// Process a barrel file
    pub fn process(&self, source: &str, file_path: &str) -> Result<String, String> {
        if !self.is_barrel_file(file_path) {
            return Ok(source.to_string());
        }

        process_file(source, file_path, &self.options)
    }
}
