"use client";

import { useDocument } from "./use-document";
import { HoldingsTable } from "./holdings-table";
import { AddAssetForm } from "./add-asset-form";
import { AddLiabilityForm } from "./add-liability-form";
import { ImportCsv } from "./import-csv";
import { BackupPanel } from "./backup-panel";

export function HoldingsView() {
  const {
    doc, loading, addAsset, removeAsset, addLiability, removeLiability,
    replaceAssets, reload,
  } = useDocument();

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-muted/60" />;

  return (
    <div className="max-w-4xl space-y-5">
      {doc.assets.length === 0 && doc.liabilities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add a holding below, or import your broker&apos;s CSV — it shows up on your
            dashboard straight away.
          </p>
        </div>
      ) : (
        <HoldingsTable
          assets={doc.assets}
          liabilities={doc.liabilities}
          onRemoveAsset={removeAsset}
          onRemoveLiability={removeLiability}
        />
      )}

      <ImportCsv existing={doc.assets} onApply={replaceAssets} />
      <AddAssetForm onAdd={addAsset} />
      <AddLiabilityForm onAdd={addLiability} />
      <BackupPanel onImported={reload} />
    </div>
  );
}
