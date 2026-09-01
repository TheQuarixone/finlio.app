"use client";

import { useMemo, useSyncExternalStore } from "react";
import { computeNetWorth } from "@finlio/core/domain";
import { useDocument } from "./use-document";
import { NetWorthSummary } from "./net-worth-summary";
import { AddAssetForm } from "./add-asset-form";
import { AddLiabilityForm } from "./add-liability-form";
import { HoldingsList } from "./holdings-list";
import { persistenceAvailable } from "@/lib/store/document-store";

/** Support never changes within a session, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

export function Dashboard() {
  const { doc, loading, addAsset, removeAsset, addLiability, removeLiability } = useDocument();

  // Feature detection reads browser globals the server does not have, so
  // calling it during render would make the first client paint disagree with
  // the server's HTML. `useSyncExternalStore` exists for exactly this: a
  // separate server snapshot, and a client value read after hydration.
  const canPersist = useSyncExternalStore(subscribeNever, persistenceAvailable, () => true);

  const netWorth = useMemo(
    () =>
      computeNetWorth({
        assets: doc.assets,
        liabilities: doc.liabilities,
        baseCurrency: doc.meta.baseCurrency,
      }),
    [doc]
  );

  const empty = doc.assets.length === 0 && doc.liabilities.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your net worth</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything you own, minus everything you owe — kept encrypted on this device.
        </p>
      </header>

      {!canPersist && (
        <p
          role="status"
          className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground"
        >
          This browser can&apos;t store files privately, so anything you add here will be lost when
          you close the tab. Chrome, Edge, or Safari 17+ will remember it.
        </p>
      )}

      <div className="mt-8 space-y-6">
        {loading ? (
          <div
            className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40"
            aria-label="Loading your holdings"
          />
        ) : (
          <>
            <NetWorthSummary netWorth={netWorth} />

            {empty && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing here yet. Add your first holding below — it takes under a minute.
              </p>
            )}

            <HoldingsList
              assets={doc.assets}
              liabilities={doc.liabilities}
              onRemoveAsset={removeAsset}
              onRemoveLiability={removeLiability}
            />

            <AddAssetForm onAdd={addAsset} />
            <AddLiabilityForm onAdd={addLiability} />
          </>
        )}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Finlio suggests, it never executes. This is guidance, not investment advice.
      </p>
    </div>
  );
}
