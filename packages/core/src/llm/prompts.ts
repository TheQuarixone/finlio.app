import type { FinlioDocument, Money } from "@finlio/schemas";
import type { LlmTask } from "../ports/llm";
import type { Quote } from "../ports/market-data";
import { formatMoney } from "../domain/format";
import { DEFAULT_INFLATION_PCT, type GoalPlan } from "../domain/goal-planner";
import { buildDocumentContext, buildPositionSummary } from "./context";
import { SYSTEM_INSTRUCTION, asData } from "./policy";

/**
 * Prompt builders.
 *
 * Pure functions of typed input: no I/O, no SDK import, no `new Date()`. That
 * makes every prompt snapshot-testable and lets the eval suite pin a prompt
 * revision to an eval result.
 *
 * Each carries a `version`, stamped into `AgentOutput.model.promptVersion`, so
 * a regression can be traced to the exact wording that caused it. Bump the
 * version whenever the text changes in a way that could move outputs.
 *
 * The arithmetic is done *before* the prompt. Language models are unreliable
 * calculators and this is somebody's money — `packages/core/domain` computes
 * every figure, and the model's job is to explain numbers it was handed, never
 * to derive them. Policy §2.4 states the rule; this is how it is made easy to
 * follow.
 */

export interface BuiltPrompt {
  task: LlmTask;
  systemInstruction: string;
  prompt: string;
  version: string;
}

const section = (title: string, body: string) => `## ${title}\n${body}`;

export interface MorningBriefInput {
  document: FinlioDocument;
  /** Pre-fetched quotes for the user's holdings, keyed by asset id. */
  quotes: ReadonlyMap<string, Quote>;
  /** Market-wide context: index levels, gold, USD-INR. Already delimited data. */
  marketContext?: string;
  /** IST date the brief is for, as YYYY-MM-DD. Injected, never derived. */
  forDate: string;
}

/** PRD §6.7 MB-1/MB-2 — the wedge. */
export function buildMorningBrief(input: MorningBriefInput): BuiltPrompt {
  const holdings = [...input.quotes.entries()]
    .map(([assetId, q]) => {
      const asset = input.document.assets.find((a) => a.id === assetId);
      const move =
        q.changePctE4 === undefined ? "no prior close" : `${(q.changePctE4 / 10_000).toFixed(2)}% on the day`;
      return `- id=${assetId} | ${asset?.label ?? "unknown"} | ${q.symbol} | ${formatMoney(q.price)} | ${move}`;
    })
    .join("\n");

  return {
    task: "morning_brief",
    systemInstruction: SYSTEM_INSTRUCTION,
    version: "morning-brief@1",
    prompt: [
      `Write the pre-open brief for ${input.forDate} (IST).`,
      "",
      section(
        "Your job",
        [
          "For each holding below that has something worth saying, write ONE sentence explaining",
          "why it may move today. Ground every sentence in the supplied data — a price move, a",
          "reported event, an index level. If a holding has nothing notable, omit it entirely;",
          "a short brief is better than a padded one.",
          "",
          "Then write a headline of at most 12 words summarising the day for this portfolio.",
          "",
          "Set `ref` on each item to the `id=` value of the holding it describes.",
          "Do not tell the user to buy, sell, or hold anything (policy §2.2).",
        ].join("\n")
      ),
      "",
      section("Holdings and their latest prices", asData("QUOTES", holdings || "(none)")),
      input.marketContext ? `\n${section("Market context", input.marketContext)}` : "",
      "",
      buildPositionSummary(input.document),
    ].join("\n"),
  };
}

export interface GoalCoachInput {
  document: FinlioDocument;
  /** Computed by the domain planner. The model explains these, never recomputes. */
  plans: readonly GoalPlan[];
  monthlySurplus: Money;
}

/** PRD §6.5 / Appendix B. */
export function buildGoalCoach(input: GoalCoachInput): BuiltPrompt {
  const plans = input.plans
    .map((p) =>
      [
        `- id=${p.goalId} | ${p.name}`,
        `  target (inflation-adjusted): ${formatMoney(p.inflatedTarget)}`,
        `  saved: ${formatMoney(p.saved)} (${(p.progressE4 / 10_000).toFixed(1)}%)`,
        `  months left: ${p.monthsRemaining}`,
        `  required per month: ${formatMoney(p.monthlyRequired)}`,
        p.unreachable ? "  UNREACHABLE: the deadline has passed and the goal is unmet" : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");

  return {
    task: "goal_coach",
    systemInstruction: SYSTEM_INSTRUCTION,
    version: "goal-coach@1",
    prompt: [
      "Review this person's goals against what they can actually save each month.",
      "",
      section(
        "Your job",
        [
          `Every figure below is already computed, using ${DEFAULT_INFLATION_PCT}% annual inflation.`,
          "Do not recalculate them; explain them.",
          "",
          "1. Compare the total required per month against the monthly surplus.",
          "2. Name the two or three adjustments that would close the largest gap —",
          "   reallocating between goals, extending a deadline, or a specific monthly amount.",
          "3. If a goal is marked UNREACHABLE, say so plainly and give the two levers that",
          "   exist: more per month, or more time. Do not soften it (policy §4.5).",
          "",
          "Reallocation of savings only. Never name a security (policy §2.2).",
          "Set `ref` on each item to the `id=` of the goal it concerns.",
        ].join("\n")
      ),
      "",
      section("Goals", asData("GOAL_PLANS", plans || "(none set)")),
      "",
      section("Capacity", `Monthly surplus available: ${formatMoney(input.monthlySurplus)}`),
      "",
      buildPositionSummary(input.document),
    ].join("\n"),
  };
}

export interface MonthlyReportInput {
  document: FinlioDocument;
  /** YYYY-MM the report covers. */
  month: string;
  netWorthDelta: Money;
  netWorthDeltaPctE4: number;
  marketContext?: string;
}

/** PRD §6.8. */
export function buildMonthlyReport(input: MonthlyReportInput): BuiltPrompt {
  return {
    task: "monthly_report",
    systemInstruction: SYSTEM_INSTRUCTION,
    version: "monthly-report@1",
    prompt: [
      `Write the monthly intelligence report for ${input.month}.`,
      "",
      section(
        "Your job",
        [
          "Produce these sections, in order, omitting any the data cannot support:",
          "  1. `networth`   — what changed this month and the single largest driver.",
          "  2. `allocation` — any concentration worth the user knowing about.",
          "  3. `goals`      — progress, and whether the current pace reaches them.",
          "  4. `actions`    — at most three concrete, non-security actions.",
          "",
          "Each section body is at most three sentences.",
        ].join("\n")
      ),
      "",
      section(
        "Movement",
        `Net worth change this month: ${formatMoney(input.netWorthDelta)} ` +
          `(${(input.netWorthDeltaPctE4 / 10_000).toFixed(2)}%)`
      ),
      input.marketContext ? `\n${section("Market context", input.marketContext)}` : "",
      "",
      buildDocumentContext(input.document),
    ].join("\n"),
  };
}
