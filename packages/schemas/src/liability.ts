import { z } from "zod";
import { Money } from "./money";

export const LiabilityKind = z.enum([
  "home_loan",
  "car_loan",
  "personal_loan",
  "education_loan",
  "credit_card",
  "other",
]);
export type LiabilityKind = z.infer<typeof LiabilityKind>;

export const Liability = z.object({
  id: z.uuid(),
  kind: LiabilityKind,
  label: z.string().min(1).max(80),
  lender: z.string().min(1).max(80),
  /** What is still owed — this is what subtracts from net worth. */
  outstanding: Money,
  emi: Money.optional(),
  /** Annual rate × 1e4 — see RATE_SCALE. */
  ratePctE4: z.number().int().nonnegative().optional(),
  endDate: z.iso.date().optional(),
  updatedAt: z.iso.datetime(),
});
export type Liability = z.infer<typeof Liability>;
