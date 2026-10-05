import { defineConfig } from "vitest/config";

// Unit tests for core logic live next to the code as *.test.ts (code_conventions.md §7).
export default defineConfig({
  test: {
    include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts"],
    environment: "node",
  },
});
