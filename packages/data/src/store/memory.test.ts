import { beforeEach, describe, expect, it } from "vitest";
import type { MarkdownStore } from "@finlio/core/ports";
import { createMemoryMarkdownStore } from "./memory";

/**
 * The MarkdownStore conformance suite.
 *
 * Exported so every adapter runs the same assertions — the web OPFS adapter and
 * the Phase-4 native one included. If an adapter passes this, code above the
 * port cannot tell which one it has.
 */
export function describeMarkdownStore(name: string, make: () => MarkdownStore) {
  describe(`${name} (MarkdownStore conformance)`, () => {
    let store: MarkdownStore;
    beforeEach(() => {
      store = make();
    });

    it("returns null for a key that was never written", async () => {
      expect(await store.read("missing.md")).toBeNull();
    });

    it("reads back exactly what was written", async () => {
      await store.write("a.md", "# Hello\n");
      expect(await store.read("a.md")).toBe("# Hello\n");
    });

    it("overwrites rather than appending", async () => {
      await store.write("a.md", "first");
      await store.write("a.md", "second");
      expect(await store.read("a.md")).toBe("second");
    });

    it("round-trips unicode and pipes intact", async () => {
      const content = "₹1,23,456 | ✓ | नमस्ते";
      await store.write("a.md", content);
      expect(await store.read("a.md")).toBe(content);
    });

    it("lists what it holds", async () => {
      await store.write("a.md", "1");
      await store.write("b.md", "2");
      expect((await store.list()).sort()).toEqual(["a.md", "b.md"]);
    });

    it("removes a key, and removing a missing key is not an error", async () => {
      await store.write("a.md", "1");
      await store.remove("a.md");
      expect(await store.read("a.md")).toBeNull();
      await expect(store.remove("a.md")).resolves.toBeUndefined();
    });
  });
}

describeMarkdownStore("memory", () => createMemoryMarkdownStore());
