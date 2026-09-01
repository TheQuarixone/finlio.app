"use client";

import { useState } from "react";
import { type Liability, LiabilityKind, MINOR_UNITS_PER_MAJOR } from "@finlio/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LABELS: Record<string, string> = {
  home_loan: "Home loan",
  car_loan: "Car loan",
  personal_loan: "Personal loan",
  education_loan: "Education loan",
  credit_card: "Credit card",
  other: "Other",
};

const inr = (major: string) => ({
  minor: Math.round((Number.parseFloat(major) || 0) * MINOR_UNITS_PER_MAJOR),
  currency: "INR" as const,
});

export function AddLiabilityForm({ onAdd }: { onAdd: (l: Liability) => void | Promise<void> }) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const liability: Liability = {
      id: crypto.randomUUID(),
      kind: LiabilityKind.catch("other").parse(fields.kind ?? "home_loan"),
      label: (fields.label ?? "").trim() || "Loan",
      lender: (fields.lender ?? "").trim() || "Lender",
      outstanding: inr(fields.outstanding ?? "0"),
      updatedAt: new Date().toISOString(),
      ...(fields.emi ? { emi: inr(fields.emi) } : {}),
      ...(fields.rate ? { ratePctE4: Math.round(Number.parseFloat(fields.rate) * 10_000) } : {}),
      ...(fields.endDate ? { endDate: fields.endDate } : {}),
    };
    await onAdd(liability);
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
      <h2 className="text-lg font-semibold">Add a liability</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What you still owe — this is what comes off your net worth.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Type</span>
          <select
            className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={fields.kind ?? "home_loan"}
            onChange={(e) => setFields((p) => ({ ...p, kind: e.target.value }))}
          >
            {LiabilityKind.options.map((option) => (
              <option key={option} value={option}>
                {LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        {field("label", "Name", { placeholder: "Flat in Chennai", required: true })}
        {field("lender", "Lender", { placeholder: "SBI" })}
        {field("outstanding", "Outstanding (₹)", { type: "number", step: "0.01", placeholder: "1800000" })}
        {field("emi", "EMI (₹, optional)", { type: "number", step: "0.01", placeholder: "42000" })}
        {field("rate", "Rate (%, optional)", { type: "number", step: "0.01", placeholder: "8.75" })}
      </div>

      <Button type="submit" className="mt-6">
        Add liability
      </Button>
    </form>
  );
}
