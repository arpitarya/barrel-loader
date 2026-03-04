import { defineConfig, type RslibConfig } from '@rslib/core';

process.env.BARREL_LOADER_DEBUG = 'true';

const config: RslibConfig = {
  lib: [
    {
      format: 'esm',
      syntax: 'es2020',
      bundle: false,
      output: {
        distPath: './dist',
        cleanDistPath: true,
      },
    },
    {
      format: 'cjs',
      syntax: 'es2020',
      bundle: false,
      output: {
        distPath: './dist',
        cleanDistPath: true,
      },
    },
  ],
  source: {
    entry: {
      index: './src/**',
    },
  },
  tools: {
    rspack: {
      cache: false,
      module: {
        rules: [
          {
            test: /index\.(ts|tsx|js|jsx)$/,
            use: [
              {
                loader: 'barrel-loader',
                options: {
                  removeDuplicates: true,
                  convertNamespaceToNamed: true,
                  sort: true,
                  verbose: true,
                },
              },
            ],
          },
        ],
      },
    },
  },
};

export default defineConfig(config);
