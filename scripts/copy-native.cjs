#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = new Set(process.argv.slice(2));
const buildType = args.has('--debug') ? 'debug' : 'release';

const rootDir = path.resolve(__dirname, '..');
const targetDir = path.join(rootDir, 'target', buildType);
const nativeDir = path.join(rootDir, 'native');
const nodeName = 'barrel_loader_rs.node';

let libName;
switch (process.platform) {
  case 'darwin':
    libName = 'libbarrel_loader.dylib';
    break;
  case 'linux':
    libName = 'libbarrel_loader.so';
    break;
  case 'win32':
    libName = 'barrel_loader.dll';
    break;
  default:
    libName = 'libbarrel_loader.so';
    break;
}

const candidates = [
  path.join(targetDir, libName),
  path.join(targetDir, libName.replace(/^lib/, '')),
];

const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));

if (!sourcePath) {
  console.error(`Native library not found in ${targetDir}. Expected ${candidates.join(' or ')}`);
  process.exit(1);
}

fs.mkdirSync(nativeDir, { recursive: true });
const destPath = path.join(nativeDir, nodeName);
fs.copyFileSync(sourcePath, destPath);
const sizeKb = Math.max(1, Math.round(fs.statSync(destPath).size / 1024));

console.log(`Copied ${path.basename(sourcePath)} -> native/${nodeName} (${sizeKb}KB)`);
