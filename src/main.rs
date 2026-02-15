use barrel_loader::{BarrelLoader, BarrelLoaderOptions};
use std::env;
use std::fs;
use std::io;

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: barrel-loader [FILE_PATH] [OPTIONS]");
        eprintln!();
        eprintln!("Options:");
        eprintln!("  --sort                    Sort exports alphabetically");
        eprintln!("  --no-remove-duplicates    Don't remove duplicate exports");
        eprintln!("  --verbose                 Enable verbose logging");
        eprintln!("  --convert-namespace       Convert namespace to named exports");
        eprintln!("  --resolve-barrel          Resolve barrel file chains");
        std::process::exit(1);
    }

    let file_path = &args[1];
    let source = fs::read_to_string(file_path)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;

    // Parse options
    let mut options = BarrelLoaderOptions::default();
    for arg in &args[2..] {
        match arg.as_str() {
            "--sort" => options.sort = Some(true),
            "--no-remove-duplicates" => options.remove_duplicates = Some(false),
            "--verbose" => options.verbose = Some(true),
            "--convert-namespace" => options.convert_namespace_to_named = Some(true),
            "--resolve-barrel" => options.resolve_barrel_exports = Some(true),
            _ => {
                eprintln!("Unknown option: {}", arg);
                std::process::exit(1);
            }
        }
    }

    let loader = BarrelLoader::new(options);
    match loader.process(&source, file_path) {
        Ok(result) => {
            println!("{}", result);
            Ok(())
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    }
}
