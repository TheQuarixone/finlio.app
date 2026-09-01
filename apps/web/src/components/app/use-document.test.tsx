import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset, FinlioDocument, Liability } from "@finlio/schemas";
import { emptyDocument } from "@finlio/schemas";

const saved: FinlioDocument[] = [];

vi.mock("@/lib/store/document-store", () => ({
  loadDocument: vi.fn(async () => emptyDocument("INR")),
  saveDocument: vi.fn(async (doc: FinlioDocument) => {
    saved.push(doc);
  }),
  persistenceAvailable: () => true,
}));

const { useDocument } = await import("./use-document");

const asset = (n: number): Asset => ({
  id: `3f2504e0-4f89-41d3-9a0c-0305e82c33${String(n).padStart(2, "0")}`,
  label: `Holding ${n}`,
  updatedAt: "2026-09-01T10:00:00.000Z",
  kind: "cash",
  institution: "HDFC",
  balance: { minor: n * 100_00, currency: "INR" },
});

const liability = (n: number): Liability => ({
  id: `4f2504e0-4f89-41d3-9a0c-0305e82c33${String(n).padStart(2, "0")}`,
  kind: "home_loan",
  label: `Loan ${n}`,
  lender: "SBI",
  outstanding: { minor: 1_800_000_00, currency: "INR" },
  updatedAt: "2026-09-01T10:00:00.000Z",
});

describe("useDocument", () => {
  beforeEach(() => {
    saved.length = 0;
  });

  it("persists an added holding", async () => {
    const { result } = renderHook(() => useDocument());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addAsset(asset(1));
    });

    expect(result.current.doc.assets).toHaveLength(1);
    expect(saved.at(-1)?.assets).toHaveLength(1);
  });

  /**
   * The regression that matters. Two edits dispatched before React re-renders
   * used to build on the same stale document, so the second silently
   * overwrote the first — and only a reload revealed the loss.
   */
  it("keeps every edit when several are dispatched before a re-render", async () => {
    const { result } = renderHook(() => useDocument());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { addAsset, addLiability } = result.current;

    await act(async () => {
      await Promise.all([addAsset(asset(1)), addAsset(asset(2)), addLiability(liability(3))]);
    });

    expect(result.current.doc.assets).toHaveLength(2);
    expect(result.current.doc.liabilities).toHaveLength(1);

    // What actually reached storage is what a reload will show.
    expect(saved.at(-1)?.assets).toHaveLength(2);
    expect(saved.at(-1)?.liabilities).toHaveLength(1);
  });

  it("removes without dropping unrelated entries", async () => {
    const { result } = renderHook(() => useDocument());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await Promise.all([result.current.addAsset(asset(1)), result.current.addAsset(asset(2))]);
    });
    await act(async () => {
      await result.current.removeAsset(asset(1).id);
    });

    expect(saved.at(-1)?.assets.map((a) => a.id)).toEqual([asset(2).id]);
  });
});
