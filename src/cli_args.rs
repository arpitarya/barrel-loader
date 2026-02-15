use crate::types::BarrelLoaderOptions;

/// Parse command-line arguments into options
pub fn parse_args(args: &[String]) -> BarrelLoaderOptions {
    let mut options = BarrelLoaderOptions::default();

    for arg in args {
        match arg.as_str() {
            "--sort" => options.sort = Some(true),
            "--no-remove-duplicates" => options.remove_duplicates = Some(false),
            "--verbose" => options.verbose = Some(true),
            "--convert-namespace" => options.convert_namespace_to_named = Some(true),
            "--resolve-barrel" => options.resolve_barrel_exports = Some(true),
            _ => {
                eprintln!("Unknown option: {arg}");
                std::process::exit(1);
            }
        }
    }

    options
}

/// Print usage information
pub fn print_usage() {
    eprintln!("Usage: barrel-loader [FILE_PATH] [OPTIONS]");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  --sort                    Sort exports alphabetically");
    eprintln!("  --no-remove-duplicates    Don't remove duplicate exports");
    eprintln!("  --verbose                 Enable verbose logging");
    eprintln!("  --convert-namespace       Convert namespace to named exports");
    eprintln!("  --resolve-barrel          Resolve barrel file chains");
}
