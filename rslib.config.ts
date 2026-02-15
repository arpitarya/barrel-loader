import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      // Main loader entry
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
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
      // Barrel loader utilities
      source: {
        entry: {
          'barrel-loader-utils': './src/barrel-loader-utils.ts',
        },
      },
      format: 'cjs',
      output: {
        distPath: {
          root: './dist',
        },
        filename: {
          js: '[name].cjs',
        },
      },
      dts: false,
    },
  ],
  output: {
    target: 'node',
    sourceMap: true,
  },
});
