import { defineConfig } from "@rstest/core";

export default defineConfig({
  include: ["src/**/*.test.ts", "src/**/*.spec.ts", "packages/**/*.test.ts", "packages/**/*.spec.ts"],
  exclude: ["node_modules", "dist"],
});
