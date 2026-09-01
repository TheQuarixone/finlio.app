"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Asset, FinlioDocument, Goal, Liability } from "@finlio/schemas";
import { emptyDocument } from "@finlio/schemas";
import { loadDocument, saveDocument } from "@/lib/store/document-store";

/**
 * The document, as React state.
 *
 * Every mutation writes through to encrypted storage immediately. There is no
 * save button because there is no server round-trip to batch — the data is
 * already on the device, and a "you have unsaved changes" state would be an
 * invented problem.
 *
 * **Why the ref.** An earlier version derived each mutation from the `doc` in
 * the closure, which loses data: two edits dispatched before React re-renders
 * both build on the same stale base, and the second write overwrites the first.
 * That is invisible in the UI — state looks right until a reload reads back
 * what was actually persisted. `latest` is the authoritative document, updated
 * synchronously, so a mutation always extends the newest version rather than
 * whichever one its closure captured.
 */
export function useDocument() {
  const [doc, setDoc] = useState<FinlioDocument>(() => emptyDocument("INR"));
  const [loading, setLoading] = useState(true);
  const latest = useRef<FinlioDocument>(emptyDocument("INR"));

  useEffect(() => {
    let cancelled = false;
    loadDocument()
      .then((loaded) => {
        if (cancelled) return;
        latest.current = loaded;
        setDoc(loaded);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(async (update: (prev: FinlioDocument) => FinlioDocument) => {
    const next = update(latest.current);
    latest.current = next;
    setDoc(next);
    await saveDocument(next);
  }, []);

  const addAsset = useCallback(
    (asset: Asset) => commit((prev) => ({ ...prev, assets: [...prev.assets, asset] })),
    [commit]
  );

  const removeAsset = useCallback(
    (id: string) =>
      commit((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== id) })),
    [commit]
  );

  const addLiability = useCallback(
    (liability: Liability) =>
      commit((prev) => ({ ...prev, liabilities: [...prev.liabilities, liability] })),
    [commit]
  );

  const removeLiability = useCallback(
    (id: string) =>
      commit((prev) => ({
        ...prev,
        liabilities: prev.liabilities.filter((l) => l.id !== id),
      })),
    [commit]
  );

  const addGoal = useCallback(
    (goal: Goal) => commit((prev) => ({ ...prev, goals: [...prev.goals, goal] })),
    [commit]
  );

  const removeGoal = useCallback(
    (id: string) => commit((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) })),
    [commit]
  );

  return {
    doc, loading,
    addAsset, removeAsset,
    addLiability, removeLiability,
    addGoal, removeGoal,
  };
}
