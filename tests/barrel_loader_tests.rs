use barrel_loader::{BarrelLoader, BarrelLoaderOptions};

#[test]
fn test_is_barrel_file() {
    let loader = BarrelLoader::new(BarrelLoaderOptions::default());
    assert!(loader.is_barrel_file("/path/to/index.ts"));
    assert!(loader.is_barrel_file("/path/to/index.js"));
    assert!(loader.is_barrel_file("/path/to/index.tsx"));
    assert!(!loader.is_barrel_file("/path/to/component.ts"));
}

#[test]
fn test_process_barrel_file() {
    let loader = BarrelLoader::new(BarrelLoaderOptions {
        remove_duplicates: Some(true),
        ..Default::default()
    });
    let source = r#"export { Button } from "./Button";
export { Button } from "./Button";"#;
    let result = loader.process(source, "/path/to/index.ts").unwrap();
    assert!(result.contains("Button"));
    // Should have only one export statement
    let count = result.matches("export").count();
    assert_eq!(count, 1);
}
