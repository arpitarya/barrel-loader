import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    entry: {
      index: ['./src/**/*.ts'],
    },
    tsconfigPath: './tsconfig.json',
  },
  lib: [
    {
      format: 'cjs',
      bundle: false,
      output: {
        minify: false,
        manifest: {
          filename: 'manifest.cjs.json',
        },
        filename: {
          js: '[name].cjs',
        },
      },
      dts: true,
    },
    {
      format: 'esm',
      bundle: false,
      output: {
        minify: false,
        manifest: {
          filename: 'manifest.esm.json',
        },
        filename: {
          js: '[name].mjs',
        },
      },
      dts: true,
    },
  ],
  output: {
    target: 'node',
    distPath: {
      root: './dist',
    },
    sourceMap: true,
  },
});
