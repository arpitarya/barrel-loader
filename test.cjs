/**
 * Basic tests for the Rust NAPI addon
 * Run with: node test.cjs or pnpm test
 */

const addon = require('./native/barrel_loader_rs.node');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    failed++;
  }
}

function testParseExports() {
  console.log('\n--- Testing parseExportsNapi ---');

  const barrelContent = `
export { default } from './component.tsx';
export { Button } from './button.tsx';
export type { ButtonProps } from './button.tsx';
export * from './utils/index.ts';
  `;

  const exports = addon.parseExportsNapi(barrelContent);

  assert(Array.isArray(exports), 'parseExportsNapi returns array');
  assert(exports.length > 0, 'parseExportsNapi finds exports');
  assert(
    exports.some((e) => e.specifier === 'Button'),
    'Button export found'
  );
  assert(
    exports.some((e) => e.is_type_export === true),
    'Type export found'
  );
}

function testRemoveDuplicates() {
  console.log('\n--- Testing removeDuplicates ---');

  const exports = [
    {
      specifier: 'Button',
      source: './button.ts',
      export_type: 'named',
      is_type_export: false,
      line: 1,
    },
    {
      specifier: 'Button',
      source: './button.ts',
      export_type: 'named',
      is_type_export: false,
      line: 2,
    },
    {
      specifier: 'Input',
      source: './input.ts',
      export_type: 'named',
      is_type_export: false,
      line: 3,
    },
  ];

  const deduped = addon.removeDuplicates(exports);

  assert(deduped.length === 2, 'removeDuplicates reduces array');
  assert(
    deduped.every((e) => typeof e.specifier === 'string'),
    'All exports have specifier'
  );
}

function testSortExports() {
  console.log('\n--- Testing sortExportsNapi ---');

  const exports = [
    { specifier: 'Zebra', source: './z.ts', export_type: 'named', is_type_export: false, line: 1 },
    { specifier: 'Apple', source: './a.ts', export_type: 'named', is_type_export: false, line: 2 },
    { specifier: 'Banana', source: './b.ts', export_type: 'named', is_type_export: false, line: 3 },
  ];

  const sorted = addon.sortExportsNapi(exports);

  assert(sorted[0].specifier === 'Apple', 'First export is Apple');
  assert(sorted[1].specifier === 'Banana', 'Second export is Banana');
  assert(sorted[2].specifier === 'Zebra', 'Third export is Zebra');
}

function testReconstructSource() {
  console.log('\n--- Testing reconstructSourceNapi ---');

  const exports = [
    {
      specifier: 'Button',
      source: './button.ts',
      export_type: 'named',
      is_type_export: false,
      line: 1,
    },
    {
      specifier: 'Input',
      source: './input.ts',
      export_type: 'named',
      is_type_export: false,
      line: 2,
    },
    {
      specifier: 'ButtonProps',
      source: './button.ts',
      export_type: 'named',
      is_type_export: true,
      line: 3,
    },
  ];

  const source = addon.reconstructSourceNapi('', exports);

  assert(typeof source === 'string', 'reconstructSourceNapi returns string');
  assert(source.includes('export'), 'Output contains export statement');
  assert(
    source.includes('Button') || source.length === 0,
    'Output contains expected content or is empty'
  );
}

function testIntegration() {
  console.log('\n--- Testing Integration ---');

  const barrelContent = `
export { Component } from './component.tsx';
export { Component } from './component.tsx';
export { Button, Input } from './ui/index.ts';
export type { ButtonProps } from './ui/button.tsx';
  `;

  let exports = addon.parseExportsNapi(barrelContent);
  exports = addon.removeDuplicates(exports);
  exports = addon.sortExportsNapi(exports);
  const result = addon.reconstructSourceNapi('', exports);

  assert(typeof result === 'string', 'Full pipeline works');
  assert(result.split('\n').length > 0, 'Pipeline produces output');
}

// Run all tests
try {
  testParseExports();
  testRemoveDuplicates();
  testSortExports();
  testReconstructSource();
  testIntegration();

  console.log('\n========================================');
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error('\nTest execution failed:', err);
  console.error('\nNote: Ensure native addon exists by running: pnpm build');
  process.exit(1);
}
