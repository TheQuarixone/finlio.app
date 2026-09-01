"use client";

import { useState } from "react";
import type { Asset } from "@finlio/schemas";
import { MINOR_UNITS_PER_MAJOR, UNITS_SCALE } from "@finlio/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Guided first-asset entry (PRD ON-3: under three minutes).
 *
 * Only the four classes a new user actually starts with are offered. The other
 * six exist in the schema and arrive behind "more types" rather than making
 * this form a wall of choices on day one.
 */
type Supported = Extract<Asset["kind"], "equity" | "mutual_fund" | "cash" | "fixed_deposit">;

const KIND_OPTIONS: { value: Supported; label: string; hint: string }[] = [
  { value: "equity", label: "Stocks", hint: "Shares held on NSE or BSE" },
  { value: "mutual_fund", label: "Mutual funds", hint: "Units and the NAV you bought at" },
  { value: "cash", label: "Cash", hint: "Savings account or deposits" },
  { value: "fixed_deposit", label: "Fixed deposit", hint: "Principal, rate and maturity" },
];

const toMinor = (major: string) => Math.round((Number.parseFloat(major) || 0) * MINOR_UNITS_PER_MAJOR);
const inr = (major: string) => ({ minor: toMinor(major), currency: "INR" as const });

export function AddAssetForm({ onAdd }: { onAdd: (asset: Asset) => void | Promise<void> }) {
  const [kind, setKind] = useState<Supported>("equity");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const base = {
      id: crypto.randomUUID(),
      label: (fields.label ?? "").trim(),
      updatedAt: new Date().toISOString(),
    };
    if (!base.label) return setError("Give this holding a name you'll recognise.");

    let asset: Asset;
    switch (kind) {
      case "equity":
        asset = {
          ...base, kind: "equity",
          ticker: (fields.ticker ?? "").trim().toUpperCase(),
          exchange: fields.exchange === "BSE" ? "BSE" : "NSE",
          qty: Number.parseInt(fields.qty ?? "0", 10) || 0,
          avgPrice: inr(fields.avgPrice ?? "0"),
        };
        break;
      case "mutual_fund":
        asset = {
          ...base, kind: "mutual_fund",
          isin: (fields.isin ?? "").trim() || "UNKNOWN",
          fund: (fields.fund ?? fields.label ?? "").trim(),
          unitsE6: Math.round((Number.parseFloat(fields.units ?? "0") || 0) * UNITS_SCALE),
          purchaseNav: inr(fields.nav ?? "0"),
        };
        break;
      case "cash":
        asset = {
          ...base, kind: "cash",
          institution: (fields.institution ?? "").trim() || "Bank",
          balance: inr(fields.balance ?? "0"),
        };
        break;
      case "fixed_deposit":
        asset = {
          ...base, kind: "fixed_deposit",
          bank: (fields.bank ?? "").trim() || "Bank",
          principal: inr(fields.principal ?? "0"),
          ratePctE4: Math.round((Number.parseFloat(fields.rate ?? "0") || 0) * 10_000),
          startDate: fields.startDate || new Date().toISOString().slice(0, 10),
          maturityDate: fields.maturityDate || new Date().toISOString().slice(0, 10),
        };
        break;
    }

    // Optional override: what it is worth today, if the user knows.
    if (fields.currentValue) asset = { ...asset, manualValue: inr(fields.currentValue) };

    await onAdd(asset);
    setFields({});
  }

  const field = (name: string, label: string, props: Record<string, unknown> = {}) => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <Input className="mt-1" value={fields[name] ?? ""} onChange={set(name)} {...props} />
    </label>
  );

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Add a holding</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Stored encrypted on this device. It never reaches our servers.
      </p>

      <fieldset className="mt-5">
        <legend className="sr-only">Type of holding</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={kind === option.value}
              title={option.hint}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                kind === option.value
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {field("label", "Name", { placeholder: "Reliance Industries", required: true })}

        {kind === "equity" && (
          <>
            {field("ticker", "Ticker", { placeholder: "RELIANCE" })}
            <label className="block">
              <span className="text-sm font-medium">Exchange</span>
              <select
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={fields.exchange ?? "NSE"}
                onChange={(e) => setFields((p) => ({ ...p, exchange: e.target.value }))}
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
              </select>
            </label>
            {field("qty", "Quantity", { type: "number", min: "0", placeholder: "20" })}
            {field("avgPrice", "Average price (₹)", { type: "number", step: "0.01", placeholder: "2850" })}
          </>
        )}

        {kind === "mutual_fund" && (
          <>
            {field("fund", "Fund name", { placeholder: "Parag Parikh Flexi Cap" })}
            {field("isin", "ISIN", { placeholder: "INF109K01Z48" })}
            {field("units", "Units", { type: "number", step: "0.0001", placeholder: "123.456" })}
            {field("nav", "Purchase NAV (₹)", { type: "number", step: "0.01", placeholder: "78.20" })}
          </>
        )}

        {kind === "cash" && (
          <>
            {field("institution", "Bank", { placeholder: "HDFC Bank" })}
            {field("balance", "Balance (₹)", { type: "number", step: "0.01", placeholder: "250000" })}
          </>
        )}

        {kind === "fixed_deposit" && (
          <>
            {field("bank", "Bank", { placeholder: "SBI" })}
            {field("principal", "Principal (₹)", { type: "number", step: "0.01", placeholder: "500000" })}
            {field("rate", "Interest rate (%)", { type: "number", step: "0.01", placeholder: "7.15" })}
            {field("maturityDate", "Maturity date", { type: "date" })}
          </>
        )}

        {field("currentValue", "Value today (₹, optional)", {
          type: "number", step: "0.01", placeholder: "Leave blank to use cost",
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-6">
        Add holding
      </Button>
    </form>
  );
}
