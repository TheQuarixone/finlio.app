import type { ZodType } from "zod";

/** Every model call in the product is one of these. Routing is per task. */
export type LlmTask =
  | "morning_brief"
  | "monthly_report"
  | "goal_coach"
  | "expense_analysis"
  | "health_score";

export type LlmFailure =
  /** The model answered, but the answer did not match the schema. */
  | { ok: false; reason: "schema"; detail: string; raw?: string }
  /** A safety filter or the policy refused. */
  | { ok: false; reason: "refusal"; detail: string }
  /** Network, auth, quota, timeout. Retryable. */
  | { ok: false; reason: "transport"; detail: string };

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  /** Reasoning tokens where the provider reports them separately. */
  thinkingTokens?: number;
}

export type LlmResult<T> = { ok: true; value: T; usage: LlmUsage } | LlmFailure;

export interface LlmRequest<T> {
  task: LlmTask;
  /** Governance text. Built by the policy module, never hand-written per call. */
  systemInstruction: string;
  /** The prompt body. Untrusted content inside it is already delimited. */
  prompt: string;
  /** The contract the answer must satisfy before anything downstream sees it. */
  schema: ZodType<T>;
  /** Overrides the routing default. Use sparingly. */
  model?: string;
}

/**
 * The one seam between Finlio and any language model.
 *
 * `complete` never returns a raw string. Either the response parsed against the
 * caller's schema, or it is a typed failure — so no unvalidated model output
 * can reach a screen, an email, or the database. Provider adapters live in
 * `@finlio/data`; this package only knows the shape.
 */
export interface LlmClient {
  complete<T>(request: LlmRequest<T>): Promise<LlmResult<T>>;
}
