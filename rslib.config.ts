import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
      syntax: "es2020",
      output: {
        distPath: "./dist",
      },
    },
    {
      format: "cjs",
      syntax: "es2020",
      output: {
        distPath: "./dist",
      },
    },
  ],
  source: {
    entry: {
      index: "./src/index.ts",
    },
  },
});
