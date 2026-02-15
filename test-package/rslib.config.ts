import { defineConfig, type RslibConfig } from "@rslib/core";

process.env.BARREL_LOADER_DEBUG = "true";

const config: RslibConfig = {
  lib: [
    {
      format: "esm",
      syntax: "es2020",
      bundle: false,
      output: {
        distPath: "./dist",
      },
    },
    {
      format: "cjs",
      syntax: "es2020",
      bundle: false,
      output: {
        distPath: "./dist",
      },
    },
  ],
  source: {
    entry: {
      index: "./src/**",
    },
  },
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /index\.(ts|tsx|js|jsx)$/,
            loader: "barrel-loader",
            options: {
              removeDuplicates: true,
              convertNamespaceToNamed: true,
              sort: true,
              verbose: true,
            },
          },
        ],
      },
    },
  },
};

export default defineConfig(config);
