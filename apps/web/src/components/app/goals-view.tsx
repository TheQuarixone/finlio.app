"use client";

import { useDocument } from "./use-document";
import { GoalsPanel } from "./goals-panel";

export function GoalsView() {
  const { doc, loading, addGoal, removeGoal } = useDocument();

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-muted/60" />;

  return (
    <div className="max-w-4xl">
      <GoalsPanel doc={doc} onAdd={addGoal} onRemove={removeGoal} />
    </div>
  );
}
