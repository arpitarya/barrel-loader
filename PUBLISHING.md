# Publishing Guide

This document explains how to publish packages from the Sentenel monorepo.

## Prerequisites

Before publishing, ensure:
1. All tests pass: `pnpm -r test`
2. All builds succeed: `pnpm -r build`
3. Code is formatted and linted: `pnpm -r run format && pnpm -r run lint`
4. Package version is updated in `package.json`

## Publishing to npm

### Setup (One-time)

1. Create an npm account at [npmjs.com](https://npmjs.com)
2. Generate an access token with publish permissions
3. Add the token to GitHub Secrets as `NPM_TOKEN`

### Automatic Publishing (Recommended)

The recommended way to publish is through GitHub Releases:

1. Update the version in `packages/node-utils/package.json`
2. Commit and push: `git add . && git commit -m "chore: bump version to x.y.z"`
3. Create a GitHub release with tag `v0.1.0` (matching package version)
4. The [publish workflow](.github/workflows/publish.yml) will automatically:
   - Build all packages
   - Publish to npm with the `@sentenel` scope
   - Publish to GitHub Packages

### Manual Publishing

For manual publishing without a release:

```bash
# Update version
npm version patch|minor|major

# Build packages
pnpm -r build

# Publish to npm (requires NPM_TOKEN)
pnpm -r publish --access public

# Or publish to GitHub Packages
npm config set registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
pnpm -r publish --access public
```

## Publishing to GitHub Packages

GitHub Packages allows publishing private or scoped packages.

### Setup

1. Create a GitHub Personal Access Token (PAT) with `write:packages` scope
2. Add to `~/.npmrc`:
   ```
   @sentenel:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

### Publishing via Workflow

Trigger manually:

1. Go to Actions → Publish Packages
2. Click "Run workflow"
3. Select "github" as registry
4. Workflow will build and publish to GitHub Packages

## Package Configuration

### Current Package: @sentenel/node-utils

**Location**: `packages/node-utils/`

**Package Fields** (in `package.json`):
- `name`: `@sentenel/node-utils`
- `version`: Should match release tag
- `private`: Set to `false` for publishing
- `main`: Points to CJS output from Rslib
- `exports`: Configure ESM/CJS entry points

### Before Publishing

Ensure the package is NOT private:

```json
{
  "name": "@sentenel/node-utils",
  "private": false,
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

## Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes only

## Troubleshooting

### "private": true prevents publishing
Update `packages/node-utils/package.json` to `"private": false`

### 403 Forbidden when publishing
- For npm: Check NPM_TOKEN is valid and has publish permissions
- For GitHub: Check GitHub token has `write:packages` scope

### Package already published for version X.Y.Z
Increment the version number before retrying

## CI/CD Integration

The publish workflow:
- Runs on GitHub releases (automatic)
- Can be manually triggered for testing
- Builds in Ubuntu environment with Node.js 24
- Uses pnpm for monorepo operations

## Verification

After publishing, verify the package:

```bash
# For npm
npm view @sentenel/node-utils

# For GitHub Packages
npm view @sentenel/node-utils --registry https://npm.pkg.github.com
```
