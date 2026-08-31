import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: "doc-intelligence/project",
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Design-system adherence. Ported from the design project's
  // `_adherence.oxlintrc.json`; see docs/adr/ADR-0003.md for which rules were
  // carried over and which were left out.
  {
    name: "doc-intelligence/design-system-adherence",
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: "Raw hex color — use a design-system color token via var().",
        },
        {
          selector:
            "Literal[value=/font-family\\s*:\\s*(?!['\\\"]?(?:Playfair Display|Archivo|IBM Plex Mono))/i]",
          message:
            "Font not provided by the design system. Available: Playfair Display, Archivo, IBM Plex Mono.",
        },
      ],
    },
  },

  // Must stay last: switches off stylistic rules Prettier already owns.
  prettier,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
