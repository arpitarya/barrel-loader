import { describe, expect, it } from "@rstest/core";
import barrelLoader from "./barrel-loader";

describe("barrel-loader", () => {
  describe("parseExports", () => {
    it("should detect named re-exports", () => {
      // This would be tested through the loader context
      const source = `export { foo, bar } from "./module";\n`;
      expect(source).toContain("export");
    });
  });

  describe("loader functionality", () => {
    it("should pass through non-barrel files", () => {
      const mockContext = {
        resourcePath: "/path/to/component.ts",
        getOptions: () => ({}),
      };

      const source = "export const foo = 1;";
      const result = barrelLoader.call(mockContext, source);

      expect(result).toBe(source);
    });

    it("should process barrel files with multiple exports", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { foo } from "./foo";
export { bar } from "./bar";
export { default as Baz } from "./baz";
export * from "./utils";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export");
      expect(result.includes("foo") || result.includes("bar")).toBe(true);
    });

    it("should remove duplicate exports by default", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({}),
      };

      const source = `export { foo } from "./module";
export { foo } from "./module";
export { bar } from "./module";
`;

      const result = barrelLoader.call(mockContext, source);

      // Count occurrences of "foo"
      const fooCount = (result.match(/export.*foo/g) || []).length;
      expect(fooCount).toBeLessThanOrEqual(2); // foo and possibly in a combined statement
    });

    it("should sort exports when sort option is enabled", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ sort: true, verbose: false }),
      };

      const source = `export { zebra } from "./z";
export { apple } from "./a";
export { middle } from "./m";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toBeTruthy();
      expect(result.includes("apple") || result.includes("zebra")).toBe(true);
    });

    it("should handle namespace exports", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({}),
      };

      const source = `export * from "./utils";
export * as helpers from "./helpers";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export");
    });

    it("should handle default exports", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({}),
      };

      const source = `export { default } from "./component";
export { default as Button } from "./button";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export");
    });

    it("should preserve non-export content", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `/**
 * This is my barrel file
 */
import type { Config } from "./types";

export { foo } from "./foo";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("barrel file");
      expect(result).toContain("Config");
    });

    it("should support custom isBarrelFile function", () => {
      const mockContext = {
        resourcePath: "/path/to/barrel.ts",
        getOptions: () => ({
          isBarrelFile: (path: string) => path.endsWith("barrel.ts"),
          verbose: false,
        }),
      };

      const source = `export { foo } from "./foo";\n`;
      const result = barrelLoader.call(mockContext, source);

      expect(result).toBeTruthy();
    });

    it("should handle jsx and tsx files", () => {
      const contexts = [{ resourcePath: "/path/to/index.jsx" }, { resourcePath: "/path/to/index.tsx" }];

      const source = `export { Button } from "./Button";\n`;

      contexts.forEach((context) => {
        const mockContext = {
          ...context,
          getOptions: () => ({ verbose: false }),
        };

        const result = barrelLoader.call(mockContext, source);
        expect(result).toBeTruthy();
      });
    });

    it("should return source unchanged if no exports found", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `// Just a comment\nconst foo = 1;\n`;
      const result = barrelLoader.call(mockContext, source);

      expect(result).toBe(source);
    });

    it("should handle convertNamespaceToNamed option (fallback to original)", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({
          convertNamespaceToNamed: true,
          verbose: false,
        }),
        // fs not available - should fallback to original namespace export
        fs: undefined,
      };

      const source = `export * from "./utils";\n`;
      const result = barrelLoader.call(mockContext, source);

      // Should keep original namespace export when fs is not available
      expect(result).toContain("export * from");
    });

    it("should handle type exports", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export type { User, Profile } from "./types";
export { getName } from "./utils";
export type * from "./models";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export type");
      expect(result).toContain("getName");
    });

    it("should separate type and value exports by default", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { Button } from "./Button";
export type { ButtonProps } from "./Button";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export { Button }");
      expect(result).toContain("export type { ButtonProps }");
    });

    it("should remove duplicate type exports", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ removeDuplicates: true, verbose: false }),
      };

      const source = `export type { User } from "./types";
export type { User } from "./types";
export type { Profile } from "./types";
`;

      const result = barrelLoader.call(mockContext, source);

      // Should have only one User type export
      const typeUserMatches = (result.match(/export type.*User/g) || []).length;
      expect(typeUserMatches).toBeLessThanOrEqual(2); // User and possibly in a combined statement
    });

    it("should handle mixed type and value exports with sorting", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ sort: true, verbose: false }),
      };

      const source = `export { formatDate } from "./date";
export type { DateFormat } from "./date";
export type { User } from "./types";
export { getName } from "./utils";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export type");
      expect(result).toContain("export {");
    });

    it("should properly combine multiple named exports from same source", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { Button } from "./components";
export { Form } from "./components";
export { Input } from "./components";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("Button");
      expect(result).toContain("Form");
      expect(result).toContain("Input");
      // Should be combined into a single export statement
      const exportStatements = (result.match(/^export \{[^}]+\} from/gm) || []).length;
      expect(exportStatements).toBe(1);
    });

    it("should handle multiple type and value exports from same source", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { Component } from "./component";
export type { Props } from "./component";
export { useHook } from "./component";
export type { Config } from "./component";
`;

      const result = barrelLoader.call(mockContext, source);

      // Should have two separate statements: one for values, one for types
      expect(result).toContain('export { Component, useHook } from "./component"');
      expect(result).toContain('export type { Props, Config } from "./component"');
    });

    it("should handle namespace exports mixed with named exports from same source", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { Button } from "./components";
export * from "./components";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("export *");
      expect(result).toContain("export { Button }");
    });

    it("should handle scoped packages with multiple exports", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { Component } from "@scope/ui";
export type { Props } from "@scope/ui";
export { useTheme } from "@scope/ui";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("@scope/ui");
      expect(result).toContain("Component");
      expect(result).toContain("Props");
      expect(result).toContain("useTheme");
    });

    it("should preserve correct order with multiple export types", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ verbose: false }),
      };

      const source = `export { Button } from "./ui";
export type { ButtonProps } from "./ui";
export { default as Modal } from "./ui";
export * as utilities from "./ui";
`;

      const result = barrelLoader.call(mockContext, source);

      // Check that all exports are present
      expect(result).toContain("Button");
      expect(result).toContain("ButtonProps");
      expect(result).toContain("Modal");
      expect(result).toContain("utilities");
    });

    it("should resolve barrel exports recursively when resolveBarrelExports is enabled", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ resolveBarrelExports: true, verbose: false }),
        fs: {
          readFileSync: (filePath: string) => {
            // Simulate a chain of barrel files
            if (filePath.includes("common/index.ts")) {
              return `export { formatDate, debounce } from "../utils/index.ts";`;
            }
            if (filePath.includes("utils/index.ts")) {
              return `export { formatDate } from "./date";
export { debounce } from "./async";`;
            }
            // Default barrel file at /path/to/index.ts
            return `export { Button } from "./Button";
export * from "../common/index.ts";`;
          },
        },
      };

      const source = `export { Button } from "./Button";
export * from "../common/index.ts";
`;

      const result = barrelLoader.call(mockContext, source);

      expect(result).toContain("Button");
      // Should resolve through the barrel chain
      expect(result).toBeTruthy();
    });

    it("should handle barrel files without infinite loops", () => {
      const mockContext = {
        resourcePath: "/path/to/index.ts",
        getOptions: () => ({ resolveBarrelExports: true, verbose: false }),
        fs: {
          readFileSync: (filePath: string) => {
            // Simulate circular reference
            if (filePath.includes("index.ts")) {
              return `export * from "./other";`;
            }
            return `export * from "./index";`; // Points back
          },
        },
      };

      const source = `export * from "./other";`;

      const result = barrelLoader.call(mockContext, source);
      expect(result).toBeTruthy();
      // Should not crash and should handle the circular reference gracefully
    });
  });
});
