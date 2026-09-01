"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, FinlioDocument, Liability } from "@finlio/schemas";
import { emptyDocument } from "@finlio/schemas";
import { loadDocument, saveDocument } from "@/lib/store/document-store";

/**
 * The document, as React state.
 *
 * Every mutation writes through to encrypted storage immediately. There is no
 * save button because there is no server round-trip to batch — the data is
 * already on the device, and a "you have unsaved changes" state would be an
 * invented problem.
 */
export function useDocument() {
  const [doc, setDoc] = useState<FinlioDocument>(() => emptyDocument("INR"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadDocument()
      .then((loaded) => {
        if (!cancelled) setDoc(loaded);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(async (next: FinlioDocument) => {
    setDoc(next);
    await saveDocument(next);
  }, []);

  const addAsset = useCallback(
    (asset: Asset) => commit({ ...doc, assets: [...doc.assets, asset] }),
    [doc, commit]
  );

  const removeAsset = useCallback(
    (id: string) => commit({ ...doc, assets: doc.assets.filter((a) => a.id !== id) }),
    [doc, commit]
  );

  const addLiability = useCallback(
    (liability: Liability) => commit({ ...doc, liabilities: [...doc.liabilities, liability] }),
    [doc, commit]
  );

  const removeLiability = useCallback(
    (id: string) => commit({ ...doc, liabilities: doc.liabilities.filter((l) => l.id !== id) }),
    [doc, commit]
  );

  return { doc, loading, addAsset, removeAsset, addLiability, removeLiability };
}
