import type { LlmTask } from "../ports/llm";

/**
 * Task → model. A table, not an `if`, so changing a model is one line and the
 * cost profile of the product is readable in one place.
 *
 * Model ids are configuration, deliberately: Gemini's lineup moves faster than
 * our release cycle, and a hardcoded id becomes wrong silently. `resolveModel`
 * reads the environment and falls back to the defaults below. Verify the
 * defaults against `ai.models.list()` before a release rather than trusting
 * this comment.
 *
 * The split follows PRD §7: reasoning-heavy agents that run rarely get the
 * stronger model; the high-volume paths get the fast one. The morning brief is
 * the interesting case — it runs per user per weekday and it is the output the
 * product is judged on, so it sits on the reasoning tier until measurement says
 * otherwise.
 */

export type ModelTier = "reasoning" | "fast";

export const TASK_TIER: Record<LlmTask, ModelTier> = {
  morning_brief: "reasoning",
  monthly_report: "reasoning",
  goal_coach: "reasoning",
  health_score: "reasoning",
  expense_analysis: "fast",
};

export const DEFAULT_MODELS: Record<ModelTier, string> = {
  reasoning: "gemini-2.5-pro",
  fast: "gemini-2.5-flash",
};

export interface ModelEnv {
  GEMINI_MODEL_REASONING?: string;
  GEMINI_MODEL_FAST?: string;
}

export function resolveModel(task: LlmTask, env: ModelEnv = {}): string {
  const tier = TASK_TIER[task];
  const override = tier === "reasoning" ? env.GEMINI_MODEL_REASONING : env.GEMINI_MODEL_FAST;
  return override ?? DEFAULT_MODELS[tier];
}
