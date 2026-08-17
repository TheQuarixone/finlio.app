import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest 4. Two projects so server code and UI each run in the right
 * environment without paying for the other's setup:
 *
 * - `unit` (node)  — lib/db/server logic. Fast, no DOM.
 * - `dom`  (jsdom) — React components via Testing Library.
 *
 * Tests are colocated with the code they cover (`*.test.ts` / `*.test.tsx`).
 * `resolve.tsconfigPaths` is Vite's native replacement for the
 * vite-tsconfig-paths plugin, and gives us the `@/*` aliases from tsconfig.
 *
 * Note: Vitest can't render *async* Server Components — cover those with E2E
 * (Playwright) instead. See the Next.js testing guide.
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/{lib,db,app}/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Vitest 4 requires an explicit include; `coverage.all` was removed.
      include: ["src/lib/**/*.ts", "src/db/**/*.ts", "src/app/actions.ts"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
      reporter: ["text", "html"],
    },
  },
});
