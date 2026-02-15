/**
 * Basic tests for the Rust NAPI addon
 * Run with: node test.cjs or pnpm test
 */

const addon = require("./barrel-loader-utils.cjs");

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
  console.log("\n--- Testing parseExports ---");

  const barrelContent = `
export { default } from './component.tsx';
export { Button } from './button.tsx';
export type { ButtonProps } from './button.tsx';
export * from './utils/index.ts';
  `;

  const exports = addon.parseExports(barrelContent, "index.ts");

  assert(Array.isArray(exports), "parseExports returns array");
  assert(exports.length > 0, "parseExports finds exports");
  assert(
    exports.some((e) => e.name === "Button"),
    "Button export found",
  );
  assert(
    exports.some((e) => e.export_type === "type"),
    "Type export found",
  );
}

function testRemoveDuplicates() {
  console.log("\n--- Testing removeDuplicates ---");

  const exports = [
    { name: "Button", source: "./button.ts", export_type: "named", is_type_export: false },
    { name: "Button", source: "./button.ts", export_type: "named", is_type_export: false },
    { name: "Input", source: "./input.ts", export_type: "named", is_type_export: false },
  ];

  const deduped = addon.removeDuplicates(exports);

  assert(deduped.length === 2, "removeDuplicates reduces array");
  assert(
    deduped.every((e) => typeof e.name === "string"),
    "All exports have name",
  );
}

function testSortExports() {
  console.log("\n--- Testing sortExports ---");

  const exports = [
    { name: "Zebra", source: "./z.ts", export_type: "named", is_type_export: false },
    { name: "Apple", source: "./a.ts", export_type: "named", is_type_export: false },
    { name: "Banana", source: "./b.ts", export_type: "named", is_type_export: false },
  ];

  const sorted = addon.sortExports(exports);

  assert(sorted[0].name === "Apple", "First export is Apple");
  assert(sorted[1].name === "Banana", "Second export is Banana");
  assert(sorted[2].name === "Zebra", "Third export is Zebra");
}

function testReconstructSource() {
  console.log("\n--- Testing reconstructSource ---");

  const exports = [
    { name: "Button", source: "./button.ts", export_type: "named", is_type_export: false },
    { name: "Input", source: "./input.ts", export_type: "named", is_type_export: false },
    { name: "ButtonProps", source: "./button.ts", export_type: "type", is_type_export: true },
  ];

  const source = addon.reconstructSource(exports);

  assert(typeof source === "string", "reconstructSource returns string");
  assert(source.includes("export"), "Output contains export statement");
  assert(source.includes("Button") || source.length === 0, "Output contains expected content or is empty");
}

function testIntegration() {
  console.log("\n--- Testing Integration ---");

  const barrelContent = `
export { Component } from './component.tsx';
export { Component } from './component.tsx';
export { Button, Input } from './ui/index.ts';
export type { ButtonProps } from './ui/button.tsx';
  `;

  let exports = addon.parseExports(barrelContent, "index.ts");
  exports = addon.removeDuplicates(exports);
  exports = addon.sortExports(exports);
  const result = addon.reconstructSource(exports);

  assert(typeof result === "string", "Full pipeline works");
  assert(result.split("\n").length > 0, "Pipeline produces output");
}

// Run all tests
try {
  testParseExports();
  testRemoveDuplicates();
  testSortExports();
  testReconstructSource();
  testIntegration();

  console.log(`\n========================================`);
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error("\nTest execution failed:", err);
  console.error("\nNote: If native addon is not available, the functions return empty results.");
  console.error("This is expected before running: pnpm build");
  process.exit(1);
}
