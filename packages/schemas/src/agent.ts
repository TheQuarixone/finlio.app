import { z } from "zod";
import { Money } from "./money";

/**
 * The agent-output envelope — the seam between the AI Core and the screens
 * (phase-2.md SCHEMA-6). Agents produce this; the UI renders it. Neither side
 * needs to know how the other works.
 *
 * Four deliberate properties:
 *
 * 1. No free-form HTML or Markdown body. The model emits data; the screen owns
 *    presentation, so a restyle is not an agent change.
 * 2. Every rupee figure is a `Money`, so the model never formats currency and
 *    can't invent "₹1.2L". `Intl.NumberFormat` does it, once.
 * 3. `ref` ties a line to the holding or goal it is about, which is what makes
 *    a brief clickable.
 * 4. `disclaimer` is a literal. A model that drops or rewords it fails
 *    validation and the output is discarded — the compliance requirement in
 *    PRD §6.9/§7 is enforced by the type system, not by a code review.
 */
export const AGENT_SCHEMA_VERSION = "finlio.agent/v1" as const;
export const REQUIRED_DISCLAIMER = "This is guidance, not investment advice." as const;

export const AgentKind = z.enum([
  "morning_brief",
  "monthly_report",
  "goal_coach",
  "expense_analysis",
  "health_score",
]);
export type AgentKind = z.infer<typeof AgentKind>;

export const AgentItem = z.object({
  /** Id of the asset/goal this line refers to, so the UI can deep-link it. */
  ref: z.string().max(64).optional(),
  text: z.string().min(1).max(200),
  amount: Money.optional(),
  direction: z.enum(["up", "down", "flat"]).optional(),
});
export type AgentItem = z.infer<typeof AgentItem>;

export const AgentSection = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(80),
  body: z.string().max(600).default(""),
  items: z.array(AgentItem).max(20).default([]),
});
export type AgentSection = z.infer<typeof AgentSection>;

export const AgentOutput = z.object({
  schema: z.literal(AGENT_SCHEMA_VERSION),
  kind: AgentKind,
  generatedAt: z.iso.datetime(),
  model: z.object({
    provider: z.string().min(1).max(40),
    id: z.string().min(1).max(80),
    promptVersion: z.string().min(1).max(40),
  }),
  headline: z.string().min(1).max(120),
  sections: z.array(AgentSection).min(1).max(8),
  disclaimer: z.literal(REQUIRED_DISCLAIMER),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});
export type AgentOutput = z.infer<typeof AgentOutput>;

/**
 * What the model is actually asked to produce.
 *
 * Everything the adapter can know for itself is omitted: `schema`, `model`,
 * `generatedAt`, and `kind` are stamped at seal time, so a model cannot
 * misreport which prompt version produced a brief. `disclaimer` is omitted for
 * a stronger reason — a field that does not exist cannot be forgotten, so the
 * compliance line is applied rather than requested.
 */
export const AgentOutputDraft = AgentOutput.omit({
  schema: true,
  kind: true,
  model: true,
  generatedAt: true,
  disclaimer: true,
});
export type AgentOutputDraft = z.infer<typeof AgentOutputDraft>;
