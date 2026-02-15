use barrel_loader::parse_exports_napi;
use rstest::rstest;

#[rstest]
#[case(r#"export { Button } from "./Button";"#, 1, "Button")]
#[case(r#"export { Button, Form } from "./components";"#, 2, "Button")]
#[case(r#"export { default as App } from "./App";"#, 1, "default as App")]
fn test_parse_exports_parametrized(
    #[case] source: &str,
    #[case] expected_count: usize,
    #[case] first_specifier: &str,
) {
    let exports = parse_exports_napi(source.to_string()).unwrap();
    assert_eq!(exports.len(), expected_count);
    if expected_count > 0 {
        assert_eq!(exports[0].specifier, first_specifier);
    }
}

#[test]
fn test_parse_named_exports() {
    let source = r#"export { Button, Form } from "./Button";"#;
    let exports = parse_exports_napi(source.to_string()).unwrap();
    assert_eq!(exports.len(), 2);
    assert_eq!(exports[0].specifier, "Button");
    assert_eq!(exports[1].specifier, "Form");
}
