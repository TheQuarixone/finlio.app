import { AgentOutputDraft } from "@finlio/schemas";
import { inspect } from "../guardrails";

/**
 * The eval harness (AI-6).
 *
 * Agent behaviour is a regression surface like any other, and the failures that
 * matter are not crashes — they are a brief that quietly invents a number, or
 * drops the disclaimer, or starts recommending stocks. Those pass typechecking
 * and look fine in review.
 *
 * Runs against recorded fixtures, never a live model: CI must pass on a clean
 * checkout with no API key (CLAUDE.md), and an eval that calls a real model
 * measures the weather as much as the prompt.
 */

export interface EvalCase {
  name: string;
  /** The prompt version this fixture was recorded against. */
  promptVersion: string;
  /** Every figure the model was given. Anything else in the output is invented. */
  allowedFigures: string[];
  /** Ids the model may reference. */
  allowedRefs: string[];
  /** The recorded model response. */
  response: unknown;
}

export interface EvalFinding {
  rule: string;
  detail: string;
}

/** Numbers that carry meaning, ignoring formatting and small counts. */
function figuresIn(text: string): string[] {
  return [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)]
    .map((match) => match[0].replace(/,/g, ""))
    // Single- and double-digit numbers are counts and ordinals ("3 goals",
    // "2 holdings"), not claims about someone's money.
    .filter((value) => value.replace(/\D/g, "").length > 2);
}

/**
 * The core assertion: every number in the output was in the input.
 *
 * A fabricated balance is the worst thing this product can produce — worse than
 * silence, because the user will act on it (ai-policy §3.4).
 */
export function checkNoFabricatedFigures(
  draft: { headline: string; sections: { body: string; items: { text: string }[] }[] },
  allowed: readonly string[]
): EvalFinding[] {
  const permitted = new Set(allowed.map((value) => value.replace(/,/g, "")));
  const prose = [
    draft.headline,
    ...draft.sections.flatMap((section) => [section.body, ...section.items.map((i) => i.text)]),
  ].join(" ");

  return figuresIn(prose)
    .filter((figure) => !permitted.has(figure))
    .map((figure) => ({
      rule: "no fabricated figures (ai-policy §3.4)",
      detail: `"${figure}" appears in the output but was never in the input.`,
    }));
}

/** A `ref` pointing at nothing produces a dead link in the UI. */
export function checkRefsResolve(
  draft: { sections: { items: { ref?: string }[] }[] },
  allowed: readonly string[]
): EvalFinding[] {
  const permitted = new Set(allowed);
  return draft.sections
    .flatMap((section) => section.items)
    .filter((item) => item.ref && !permitted.has(item.ref))
    .map((item) => ({
      rule: "refs resolve",
      detail: `ref "${item.ref}" does not match any supplied id.`,
    }));
}

/** Run every check against one recorded case. */
export function evaluate(testCase: EvalCase): EvalFinding[] {
  const parsed = AgentOutputDraft.safeParse(testCase.response);
  if (!parsed.success) {
    return [
      {
        rule: "output validates",
        detail: parsed.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
          .join("; "),
      },
    ];
  }

  const draft = parsed.data;

  return [
    ...checkNoFabricatedFigures(draft, testCase.allowedFigures),
    ...checkRefsResolve(draft, testCase.allowedRefs),
    // Guardrails are compile-time policy; running them here catches a fixture
    // that would have been refused in production.
    ...inspect(draft).map((violation) => ({
      rule: violation.rule,
      detail: `${violation.where}: "${violation.excerpt}"`,
    })),
  ];
}
