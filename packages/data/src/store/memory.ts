import type { MarkdownStore } from "@finlio/core/ports";

/**
 * The reference `MarkdownStore`, and the conformance target every real adapter
 * is measured against (phase-2.md STORE-6). The Phase-4 Expo adapter reuses
 * the suite in `memory.test.ts` verbatim.
 */
export function createMemoryMarkdownStore(seed: Record<string, string> = {}): MarkdownStore {
  const files = new Map(Object.entries(seed));
  return {
    async read(key) {
      return files.get(key) ?? null;
    },
    async write(key, contents) {
      files.set(key, contents);
    },
    async remove(key) {
      files.delete(key);
    },
    async list() {
      return [...files.keys()];
    },
  };
}
