import { AgentOutputDraft, type AgentOutput, AGENT_SCHEMA_VERSION, REQUIRED_DISCLAIMER } from "@finlio/schemas";
import type { AgentKind } from "@finlio/schemas";
import { UNTRUSTED_CLOSE, UNTRUSTED_OPEN } from "./policy";

/**
 * Guardrails that do not depend on the model behaving.
 *
 * Policy prose (policy.ts) tells the model what to do. This module assumes it
 * sometimes won't. Anything that must be true of an output is checked here,
 * after generation, before anything renders it.
 */

/** Phrases that would make an output regulated advice or a prohibited claim. */
const PROHIBITED_PATTERNS: ReadonlyArray<{ pattern: RegExp; rule: string }> = [
  { pattern: /\b(guaranteed|assured)\s+(returns?|profits?|income)\b/i, rule: "policy §3.2 — no assured-return claims" },
  { pattern: /\brisk[- ]free\s+return/i, rule: "policy §3.2 — no assured-return claims" },
  { pattern: /\bI (?:have|'ve)\s+(?:placed|executed|bought|sold|redeemed|transferred)\b/i, rule: "policy §2.1 — suggest, never execute" },
  { pattern: /\b(?:you should|I recommend(?: that you)?|I'd recommend)\s+(?:buy|sell|exit|book profits)\b/i, rule: "policy §2.2 — no security recommendations" },
  { pattern: /\bthis (?:stock|fund|share) will\b/i, rule: "policy §2.3 — no stated predictions" },
];

/** Signals the model started narrating its own configuration. */
const LEAK_PATTERNS: ReadonlyArray<RegExp> = [
  /\bsystem (?:prompt|instruction)\b/i,
  /\bmy instructions (?:are|say)\b/i,
  new RegExp(UNTRUSTED_OPEN.replace(/[<>]/g, "\\$&"), "i"),
  new RegExp(UNTRUSTED_CLOSE.replace(/[<>]/g, "\\$&"), "i"),
];

export type GuardrailViolation = { rule: string; where: string; excerpt: string };

/** Every piece of prose the user would actually read. */
function proseOf(draft: AgentOutputDraft): { where: string; text: string }[] {
  const out = [{ where: "headline", text: draft.headline }];
  draft.sections.forEach((s, i) => {
    out.push({ where: `sections[${i}].title`, text: s.title });
    out.push({ where: `sections[${i}].body`, text: s.body });
    s.items.forEach((item, j) => out.push({ where: `sections[${i}].items[${j}]`, text: item.text }));
  });
  return out;
}

export function inspect(draft: AgentOutputDraft): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  for (const { where, text } of proseOf(draft)) {
    for (const { pattern, rule } of PROHIBITED_PATTERNS) {
      const match = text.match(pattern);
      if (match) violations.push({ rule, where, excerpt: match[0] });
    }
    for (const pattern of LEAK_PATTERNS) {
      const match = text.match(pattern);
      if (match) violations.push({ rule: "policy §2.5 — no prompt disclosure", where, excerpt: match[0] });
    }
  }
  return violations;
}

export interface SealOptions {
  kind: AgentKind;
  provider: string;
  modelId: string;
  promptVersion: string;
  /** Injected — the clock is a dependency (ports/clock.ts). */
  now: Date;
}

export type SealResult =
  | { ok: true; output: AgentOutput }
  | { ok: false; violations: GuardrailViolation[] };

/**
 * Turn a model draft into a sealed, renderable `AgentOutput`.
 *
 * The provenance fields are stamped here rather than asked of the model, so an
 * output cannot misreport which prompt version or model produced it. The
 * disclaimer is likewise applied, not requested — policy §3.1 asks the model
 * for it, and this guarantees it, which is why `AgentOutput.disclaimer` can be
 * a literal in the schema.
 */
export function seal(draft: AgentOutputDraft, opts: SealOptions): SealResult {
  const violations = inspect(draft);
  if (violations.length > 0) return { ok: false, violations };

  return {
    ok: true,
    output: {
      ...draft,
      schema: AGENT_SCHEMA_VERSION,
      kind: opts.kind,
      generatedAt: opts.now.toISOString(),
      model: { provider: opts.provider, id: opts.modelId, promptVersion: opts.promptVersion },
      disclaimer: REQUIRED_DISCLAIMER,
    },
  };
}
