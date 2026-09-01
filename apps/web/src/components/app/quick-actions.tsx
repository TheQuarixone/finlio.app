"use client";

import { ArrowDownToLine, Flag, Minus, Plus } from "lucide-react";

/**
 * The four things a person actually does here.
 *
 * Note what is absent: no transfer, no pay, no trade. Finlio suggests and never
 * executes (PRD §3), so an action row that implied money movement would be
 * dishonest about what the product is — every action below edits the user's own
 * record of their finances.
 */
const ACTIONS = [
  { id: "add-asset", label: "Add holding", icon: Plus, primary: true },
  { id: "add-liability", label: "Add liability", icon: Minus },
  { id: "import", label: "Import CSV", icon: ArrowDownToLine },
  { id: "goals", label: "Set a goal", icon: Flag },
] as const;

export function QuickActions({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ACTIONS.map(({ id, label, icon: Icon, ...rest }) => {
        const primary = "primary" in rest && rest.primary;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${
              primary
                ? "border-transparent bg-[var(--chart-1)] text-white hover:brightness-95"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <span
              aria-hidden
              className={`grid size-9 shrink-0 place-items-center rounded-full ${
                primary ? "bg-white/20 text-white" : "bg-[#232322] text-white"
              }`}
            >
              <Icon className="size-4" strokeWidth={2} />
            </span>
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
