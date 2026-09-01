// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/** Baseline for every workspace package. */
export default defineConfig([
  globalIgnores(["**/dist/**", "**/.next/**", "**/coverage/**", "**/node_modules/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
