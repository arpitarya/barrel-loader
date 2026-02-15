mod cli_args;

use barrel_loader::BarrelLoader;
use cli_args::{parse_args, print_usage};
use std::env;
use std::fs;
use std::io;

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_usage();
        std::process::exit(1);
    }

    let file_path = &args[1];
    let source = fs::read_to_string(file_path)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;

    let options = parse_args(&args[2..]);
    let loader = BarrelLoader::new(options);

    match loader.process(&source, file_path) {
        Ok(result) => {
            println!("{result}");
            Ok(())
        }
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    }
}
