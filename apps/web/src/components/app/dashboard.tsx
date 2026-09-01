"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { computeNetWorth } from "@finlio/core/domain";
import { useDocument } from "./use-document";
import { NetWorthHero } from "./net-worth-hero";
import { QuickActions } from "./quick-actions";
import { HoldingsTable } from "./holdings-table";
import { AddAssetForm } from "./add-asset-form";
import { AddLiabilityForm } from "./add-liability-form";
import { AllocationDonut, AllocationLegend, toDonutData } from "./allocation-donut";
import { persistenceAvailable } from "@/lib/store/document-store";
import { EVENTS, track } from "@/lib/analytics";

/** Support never changes within a session, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

export function Dashboard() {
  const { doc, loading, addAsset, removeAsset, addLiability, removeLiability } = useDocument();

  // Feature detection reads browser globals the server does not have, so
  // calling it during render would make the first client paint disagree with
  // the server's HTML. `useSyncExternalStore` exists for exactly this.
  const canPersist = useSyncExternalStore(subscribeNever, persistenceAvailable, () => true);

  const [panel, setPanel] = useState<"asset" | "liability" | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const netWorth = useMemo(
    () =>
      computeNetWorth({
        assets: doc.assets,
        liabilities: doc.liabilities,
        baseCurrency: doc.meta.baseCurrency,
      }),
    [doc]
  );

  const donut = useMemo(() => toDonutData(netWorth.allocation), [netWorth.allocation]);
  const empty = doc.assets.length === 0 && doc.liabilities.length === 0;

  // Funnel step one. The callback route cannot capture this itself — PostHog
  // is consent-gated and only initialised in the browser — so it hands over a
  // `?welcome=1` flag and the client fires it once, then cleans the URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "1") return;
    track(EVENTS.signupCompleted);
    url.searchParams.delete("welcome");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // The funnel's last step: a signed-in person looking at a real number.
  // Once per mount, and only with something to look at — firing on the empty
  // dashboard would make the step meaningless.
  const reported = useRef(false);
  useEffect(() => {
    if (loading || empty || reported.current) return;
    reported.current = true;
    track(EVENTS.networthViewed, {
      holdings: doc.assets.length,
      liabilities: doc.liabilities.length,
      classes: netWorth.allocation.length,
    });
  }, [loading, empty, doc.assets.length, doc.liabilities.length, netWorth.allocation.length]);

  const lastUpdated = useMemo(() => {
    const stamps = [...doc.assets, ...doc.liabilities].map((entry) => entry.updatedAt).sort();
    const latest = stamps.at(-1);
    return latest
      ? new Date(latest).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      : undefined;
  }, [doc]);

  function openPanel(id: string) {
    if (id === "add-asset" || id === "import") setPanel("asset");
    else if (id === "add-liability") setPanel("liability");
    else setPanel("asset");
    // Opening a form the user cannot see is the same as doing nothing.
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading your holdings">
        <div className="h-52 animate-pulse rounded-3xl bg-muted/60" />
        <div className="h-20 animate-pulse rounded-3xl bg-muted/60" />
        <div className="h-64 animate-pulse rounded-3xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_336px]">
      <div className="min-w-0 space-y-5">
        {!canPersist && (
          <p
            role="status"
            className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground"
          >
            This browser can&apos;t store files privately, so anything you add will be lost
            when you close the tab. Chrome, Edge, or Safari 17+ will remember it.
          </p>
        )}

        <NetWorthHero netWorth={netWorth} updatedAt={lastUpdated} />
        <QuickActions onSelect={openPanel} />

        {empty ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first holding and your net worth appears straight away. It takes
              under a minute.
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

        <div ref={formRef} className="space-y-5 scroll-mt-6">
          {(panel === "asset" || empty) && <AddAssetForm onAdd={addAsset} />}
          {(panel === "liability" || empty) && <AddLiabilityForm onAdd={addLiability} />}
        </div>
      </div>

      <aside className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Allocation</h2>
            <span className="text-xs text-muted-foreground">
              {netWorth.assetCount} {netWorth.assetCount === 1 ? "holding" : "holdings"}
            </span>
          </div>

          {donut.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Your split across asset classes shows here once you add a holding.
            </p>
          ) : (
            <>
              <div className="mt-5">
                <AllocationDonut data={donut} total={netWorth.totalAssets} />
              </div>
              <AllocationLegend data={donut} />
            </>
          )}
        </section>

        <section className="rounded-3xl bg-[#232322] p-5 text-white sm:p-6">
          <h2 className="text-base font-semibold">Your morning brief</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Before the market opens, one short note on why the things you own may move
            today. Arriving in a later release.
          </p>
          <p className="mt-4 text-xs text-white/40">
            Finlio suggests, it never executes. This is guidance, not investment advice.
          </p>
        </section>
      </aside>
    </div>
  );
}
