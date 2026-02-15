# barrel-loader Examples

Practical examples for using barrel-loader in your webpack/rspack projects.

## Table of Contents

- [Quick Start](#quick-start)
- [Webpack Configuration](#webpack-configuration)
- [Rspack Configuration](#rspack-configuration)
- [Loader Options](#loader-options)
- [Real-World Use Cases](#real-world-use-cases)
- [TypeScript Examples](#typescript-examples)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Setup

Install the package:

```bash
pnpm add barrel-loader
# or
npm install barrel-loader
```

Add to your bundler config:

```javascript
// webpack.config.js or rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        use: 'barrel-loader'
      }
    ]
  }
};
```

That's it! The loader will automatically optimize all barrel files matching the pattern.

---

## Webpack Configuration

### Example 1: Basic Webpack Setup

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        loader: 'barrel-loader',
        options: {
          sort: true,
          removeDuplicates: true,
          verbose: false
        }
      }
    ]
  }
};
```

### Example 2: Path-Specific Configuration

Optimize only specific directories:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /index\.tsx?$/,
        include: /src\/components/,
        loader: 'barrel-loader',
        options: {
          sort: true,
          removeDuplicates: true
        }
      },
      {
        test: /index\.tsx?$/,
        include: /src\/utils/,
        loader: 'barrel-loader',
        options: {
          sort: false,  // Keep original order
          removeDuplicates: true
        }
      }
    ]
  }
};
```

### Example 3: Multi-Environment Configuration

Different settings for dev vs production:

```javascript
// webpack.config.js
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        loader: 'barrel-loader',
        options: {
          sort: isDev,                    // Sort in dev for readability
          removeDuplicates: true,         // Always remove duplicates
          verbose: isDev,                 // Log only in development
          resolveBarrelFiles: isDev       // Deep resolve in dev only
        }
      }
    ]
  }
};
```

---

## Rspack Configuration

### Example 1: Basic Rspack Setup

```javascript
// rspack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx|js|jsx)$/,
        loader: 'barrel-loader',
        options: {
          removeDuplicates: true,
          sort: true
        }
      }
    ]
  }
};
```

### Example 2: TypeScript Rspack Config

```typescript
// rspack.config.ts
import { defineConfig } from '@rspack/cli';
import type { BarrelLoaderOptions } from 'barrel-loader';

const barrelOptions: BarrelLoaderOptions = {
  sort: true,
  removeDuplicates: true,
  verbose: false,
  resolveBarrelFiles: true
};

export default defineConfig({
  module: {
    rules: [
      {
        test: /\/index\.tsx?$/,
        loader: 'barrel-loader',
        options: barrelOptions
      }
    ]
  }
});
```

### Example 3: Rspack with Monorepo

```javascript
// rspack.config.js
const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|tsx)$/,
        // Target specific packages
        include: [
          path.resolve(__dirname, 'packages/ui/src'),
          path.resolve(__dirname, 'packages/components/src'),
          path.resolve(__dirname, 'packages/hooks/src')
        ],
        loader: 'barrel-loader',
        options: {
          sort: true,
          removeDuplicates: true,
          verbose: process.env.DEBUG === 'true'
        }
      }
    ]
  }
};
```

---

## Loader Options

### `sort` (boolean, default: `false`)

Sort exports alphabetically:

```javascript
// webpack.config.js
{
  loader: 'barrel-loader',
  options: {
    sort: true
  }
}
```

**Before:**
```typescript
export { Zebra } from './zebra';
export { Apple } from './apple';
export { Mango } from './mango';
```

**After:**
```typescript
export { Apple } from './apple';
export { Mango } from './mango';
export { Zebra } from './zebra';
```

### `removeDuplicates` (boolean, default: `true`)

Remove duplicate exports:

```javascript
{
  loader: 'barrel-loader',
  options: {
    removeDuplicates: true
  }
}
```

**Before:**
```typescript
export { Button } from './button';
export { Button } from './button';
export { Input } from './input';
```

**After:**
```typescript
export { Button } from './button';
export { Input } from './input';
```

### `verbose` (boolean, default: `false`)

Enable detailed logging:

```javascript
{
  loader: 'barrel-loader',
  options: {
    verbose: true
  }
}
```

**Output:**
```
[barrel-loader] Processing: src/components/index.ts
[barrel-loader] Found 25 exports
[barrel-loader] Removed 3 duplicates
[barrel-loader] Final: 22 exports
```

### `resolveBarrelFiles` (boolean, default: `true`)

Recursively resolve nested barrel files:

```javascript
{
  loader: 'barrel-loader',
  options: {
    resolveBarrelFiles: true
  }
}
```

**Example:**

```typescript
// src/components/forms/index.ts
export { Input } from './Input';
export { Button } from './Button';

// src/components/index.ts (before)
export * from './forms';

// src/components/index.ts (after, with resolveBarrelFiles: true)
export { Input } from './forms/Input';
export { Button } from './forms/Button';
```

---

## Real-World Use Cases

### Use Case 1: Component Library

Optimize a UI component library:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.tsx?$/,
        include: /src\/components/,
        loader: 'barrel-loader',
        options: {
          sort: true,
          removeDuplicates: true,
          resolveBarrelFiles: true,
          verbose: process.env.DEBUG === 'true'
        }
      }
    ]
  }
};
```

**Project structure:**
```
src/
  components/
    Button/
      index.tsx
      Button.tsx
      Button.types.ts
    Input/
      index.tsx
      Input.tsx
    index.ts  ← Optimized by barrel-loader
```

### Use Case 2: API Route Exports

Clean up API barrel files:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\/index\.(ts|js)$/,
        include: /src\/api/,
        loader: 'barrel-loader',
        options: {
          sort: true,        // Alphabetical order
          removeDuplicates: true
        }
      }
    ]
  }
};
```

**Example transformation:**

```typescript
// src/api/index.ts (before)
export { userRoutes } from './routes/users';
export { authRoutes } from './routes/auth';
export { userRoutes } from './routes/users';  // duplicate
export { productRoutes } from './routes/products';

// src/api/index.ts (after)
export { authRoutes } from './routes/auth';
export { productRoutes } from './routes/products';
export { userRoutes } from './routes/users';
```

### Use Case 3: Utility Functions

Organize utility exports:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /index\.(ts|js)$/,
        include: /src\/utils/,
        loader: 'barrel-loader',
        options: {
          sort: false,           // Keep manual order
          removeDuplicates: true,
          resolveBarrelFiles: false  // Don't expand nested utils
        }
      }
    ]
  }
};
```

### Use Case 4: Monorepo Package Exports

Handle complex monorepo setups:

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  module: {
    rules: [
      // UI Package
      {
        test: /\/index\.tsx?$/,
        include: path.resolve(__dirname, '../../packages/ui'),
        loader: 'barrel-loader',
        options: {
          sort: true,
          removeDuplicates: true
        }
      },
      // Utils Package
      {
        test: /\/index\.(ts|js)$/,
        include: path.resolve(__dirname, '../../packages/utils'),
        loader: 'barrel-loader',
        options: {
          sort: false,
          removeDuplicates: true
        }
      },
      // Hooks Package
      {
        test: /\/index\.ts$/,
        include: path.resolve(__dirname, '../../packages/hooks'),
        loader: 'barrel-loader',
        options: {
          sort: true,
          removeDuplicates: true,
          resolveBarrelFiles: true
        }
      }
    ]
  }
};
```

---

## TypeScript Examples

### Example 1: Typed Configuration

```typescript
// webpack.config.ts
import type { Configuration } from 'webpack';
import type { BarrelLoaderOptions } from 'barrel-loader';

const barrelOptions: BarrelLoaderOptions = {
  sort: true,
  removeDuplicates: true,
  verbose: false,
  resolveBarrelFiles: true
};

const config: Configuration = {
  module: {
    rules: [
      {
        test: /\/index\.tsx?$/,
        loader: 'barrel-loader',
        options: barrelOptions
      }
    ]
  }
};

export default config;
```

## Troubleshooting

### Issue 1: Loader Not Processing Files

**Problem:** Barrel files aren't being optimized.

**Solution:** Check your test pattern:

```javascript
// ✗ Wrong - too specific
{
  test: /index\.ts$/,  // Misses .tsx, .js, .jsx
  loader: 'barrel-loader'
}

// ✓ Correct - matches all barrel files
{
  test: /\/index\.(ts|tsx|js|jsx)$/,
  loader: 'barrel-loader'
}
```

### Issue 2: Duplicates Not Removed

**Problem:** Duplicate exports still appear in output.

**Solution:** Ensure `removeDuplicates` is enabled:

```javascript
{
  loader: 'barrel-loader',
  options: {
    removeDuplicates: true  // Enable explicitly
  }
}
```

### Issue 3: Performance Issues

**Problem:** Build is slow with many barrel files.

**Solution:** Disable recursive resolution for large codebases:

```javascript
{
  loader: 'barrel-loader',
  options: {
    resolveBarrelFiles: false,  // Disable deep resolution
    verbose: false               // Disable logging
  }
}
```

### Issue 4: Unexpected Export Order

**Problem:** Exports appear in wrong order.

**Solution:** Enable sorting:

```javascript
{
  loader: 'barrel-loader',
  options: {
    sort: true  // Alphabetical order
  }
}
```

### Issue 5: TypeScript Type Exports Lost

**Problem:** Type exports disappear after optimization.

**Solution:** The loader preserves type exports automatically. Verify your source:

```typescript
// ✓ Correct - will be preserved
export type { User, UserProps } from './types';
export { fetchUser } from './api';

// ✗ Wrong - inline types not supported
export type User = { id: number };  // Not a re-export
```

### Issue 6: Monorepo Path Resolution

**Problem:** Imports break in monorepo setup.

**Solution:** Use absolute includes:

```javascript
const path = require('path');

{
  test: /\/index\.tsx?$/,
  include: [
    path.resolve(__dirname, 'packages/ui/src'),
    path.resolve(__dirname, 'packages/components/src')
  ],
  loader: 'barrel-loader',
  options: { /* ... */ }
}
```

---

## Performance Tips

### Tip 1: Selective Processing

Only process files that need optimization:

```javascript
{
  test: /\/index\.(ts|tsx)$/,
  include: /src\/(components|hooks|utils)/,  // Only these folders
  exclude: /node_modules/,
  loader: 'barrel-loader'
}
```

### Tip 2: Cache Results

Enable webpack/rspack caching:

```javascript
module.exports = {
  cache: {
    type: 'filesystem'
  },
  module: {
    rules: [
      {
        test: /\/index\.tsx?$/,
        loader: 'barrel-loader',
        options: { /* ... */ }
      }
    ]
  }
};
```

### Tip 3: Production Optimization

Different settings for dev vs prod:

```javascript
const isProd = process.env.NODE_ENV === 'production';

{
  loader: 'barrel-loader',
  options: {
    sort: isProd,                    // Only sort in production
    removeDuplicates: true,          // Always remove
    verbose: !isProd,                // Log in dev
    resolveBarrelFiles: isProd       // Deep resolve in prod
  }
}
```

---

## Integration Examples

### Next.js Integration

```javascript
// next.config.js
module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\/index\.(ts|tsx)$/,
      include: /src\/(components|hooks)/,
      loader: 'barrel-loader',
      options: {
        sort: true,
        removeDuplicates: true
      }
    });
    
    return config;
  }
};
```

### Vite Integration

Vite uses Rollup, not webpack. This loader targets webpack/rspack only.

### Rollup Integration

Rollup is not supported directly. Use webpack or rspack for barrel-loader.

---

## License

MIT

---

**Need more help?** Open an issue at [github.com/your-repo/barrel-loader](https://github.com/your-repo/barrel-loader)
