use barrel_loader::{BarrelLoader, BarrelLoaderOptions, ExportInfo};
use rstest::rstest;

#[rstest]
#[case("/path/to/index.ts", true)]
#[case("/path/to/index.js", true)]
#[case("/path/to/index.tsx", true)]
#[case("/path/to/index.jsx", true)]
#[case("/path/to/component.ts", false)]
#[case("/path/to/module.js", false)]
#[case("/path/to/utils/index.ts", true)]
fn test_is_barrel_file_parametrized(#[case] file_path: &str, #[case] expected: bool) {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    assert_eq!(loader.is_barrel_file(file_path), expected);
}

#[rstest]
#[case("named", false)]
#[case("default", false)]
#[case("namespace", false)]
fn test_export_types(#[case] export_type: &str, #[case] is_type: bool) {
    let export_info = ExportInfo {
        specifier: "Test".to_string(),
        source: "./test".to_string(),
        export_type: export_type.to_string(),
        is_type_export: is_type,
        line: 1,
    };
    assert_eq!(export_info.export_type, export_type);
    assert_eq!(export_info.is_type_export, is_type);
}
