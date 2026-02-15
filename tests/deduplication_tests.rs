use barrel_loader::{remove_duplicates, ExportInfo};

#[test]
fn test_remove_duplicates() {
    let exports = vec![
        ExportInfo {
            specifier: "Button".to_string(),
            source: "./Button".to_string(),
            export_type: "named".to_string(),
            is_type_export: false,
            line: 1,
        },
        ExportInfo {
            specifier: "Button".to_string(),
            source: "./Button".to_string(),
            export_type: "named".to_string(),
            is_type_export: false,
            line: 2,
        },
    ];
    let deduped = remove_duplicates(exports);
    assert_eq!(deduped.len(), 1);
}
