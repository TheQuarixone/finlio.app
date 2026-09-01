// @ts-check
import { defineConfig } from "eslint/config";
import base from "./base.mjs";

/**
 * For `packages/core` — the purity guard (see docs/phase-2.1.md D1).
 *
 * `core` is the bottom layer: pure domain logic, port *interfaces*, and services
 * that take those ports injected. It must not reach for a framework, a renderer,
 * or an adapter, because React Native consumes it verbatim in Phase 4 and its
 * tests must pass on a clean checkout with nothing running.
 */
export default defineConfig([
  ...base,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*"],
              message: "packages/core is framework-agnostic (ADR-0002). Keep Next in apps/web.",
            },
            {
              group: ["react", "react-dom", "react/*", "react-dom/*"],
              message: "packages/core is renderer-agnostic (ADR-0002). Keep React in the apps.",
            },
            {
              group: ["@finlio/data", "@finlio/api"],
              message:
                "core is the bottom layer — depend on a port in core/ports, and let @finlio/data implement it.",
            },
            {
              group: ["drizzle-orm", "drizzle-orm/*", "postgres", "@supabase/*"],
              message: "Adapters live in @finlio/data. core talks to ports, not drivers.",
            },
          ],
        },
      ],
    },
  },
]);
