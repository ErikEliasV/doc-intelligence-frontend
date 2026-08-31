import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    // Mirrors the `@/*` path alias in tsconfig.json. Done by hand rather than
    // with vite-tsconfig-paths so the test setup adds no second dependency.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
