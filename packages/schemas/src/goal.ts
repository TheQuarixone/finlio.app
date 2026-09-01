import { z } from "zod";
import { Money } from "./money";

export const Goal = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  target: Money,
  deadline: z.iso.date(),
  /** Ids of assets earmarked for this goal (PRD GO-3, Pro — empty on Free). */
  linkedAssetIds: z.array(z.uuid()).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Goal = z.infer<typeof Goal>;

/** Free tier caps goals at 3 (PRD GO-1). Enforced server-side, not in the form. */
export const FREE_TIER_GOAL_LIMIT = 3;
