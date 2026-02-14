import { defineConfig } from "@rstest/core";

export default defineConfig({
  include: ["packages/**/*.test.ts", "packages/**/*.spec.ts"],
  exclude: ["node_modules", "dist"],
});
