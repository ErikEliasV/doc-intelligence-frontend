import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Stays `node`. The component tests here render to an HTML string with
    // `react-dom/server`, which needs no DOM — so no jsdom, and no Testing
    // Library. See docs/adr/ADR-0013.md.
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    // Mirrors the `@/*` path alias in tsconfig.json. Done by hand rather than
    // with vite-tsconfig-paths so the test setup adds no second dependency.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
