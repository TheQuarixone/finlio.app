import { z } from "zod";
import { CurrencyCode, Money } from "./money";

export const RiskProfile = z.enum(["conservative", "moderate", "aggressive"]);
export type RiskProfile = z.infer<typeof RiskProfile>;

/**
 * The only user-shaped row Finlio keeps server-side. Deliberately thin: income
 * and expenses are needed by the goal planner and the health score, and nothing
 * here identifies a holding. Raw positions never leave the device (ADR-0004).
 */
export const Profile = z.object({
  userId: z.uuid(),
  baseCurrency: CurrencyCode.default("INR"),
  riskProfile: RiskProfile.default("moderate"),
  annualIncome: Money.optional(),
  monthlyExpenses: Money.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Profile = z.infer<typeof Profile>;

export const ProfileUpdate = Profile.pick({
  baseCurrency: true,
  riskProfile: true,
  annualIncome: true,
  monthlyExpenses: true,
}).partial();
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;

export const SubscriptionTier = z.enum(["free", "pro", "ultra"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;
