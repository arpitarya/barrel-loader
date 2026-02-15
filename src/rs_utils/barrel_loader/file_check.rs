use std::path::Path;

/// Check if a file is a barrel file
/// A barrel file is typically named index.{ts,js,tsx,jsx}
#[must_use]
pub fn is_barrel_file(file_path: &str) -> bool {
    let path = Path::new(file_path);
    path.file_name().is_some_and(|name| {
        let name = name.to_string_lossy();
        matches!(
            name.as_ref(),
            "index.ts" | "index.js" | "index.tsx" | "index.jsx"
        )
    })
}
