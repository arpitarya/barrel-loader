import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  lib: [
    {
      format: 'cjs',
      output: {
        distPath: {
          root: './dist',
        },
        filename: {
          js: '[name].cjs',
        },
        cleanDistPath: true,
      },
      dts: false,
    },
    {
      format: 'esm',
      output: {
        distPath: {
          root: './dist',
        },
        filename: {
          js: '[name].mjs',
        },
        cleanDistPath: true,
      },
      dts: false,
    },
  ],
  output: {
    target: 'node',
    sourceMap: true,
  },
});
