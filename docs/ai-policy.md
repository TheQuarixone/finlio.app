# Finlio — AI policy

The rules the product and the model both operate under, and the reasoning behind
them. The enforceable version of this document is code:
[`packages/core/src/llm/policy.ts`](../packages/core/src/llm/policy.ts) holds the
system instruction, [`guardrails.ts`](../packages/core/src/llm/guardrails.ts)
holds the checks, and [`packages/schemas`](../packages/schemas) holds the output
contract. This file explains *why* each rule exists so nobody removes one by
accident.

- **Policy version:** `finlio-policy@1` (stamped into every `AgentOutput`)
- **Provider:** Google Gemini, behind the `LlmClient` port
- **Related:** [PRD](./PRD.md) §7 · [architecture](./architecture.md) §4.5 ·
  [legal](./legal.md) · [phase-2.1](./phase-2.1.md)

---

## 1. The one-sentence version

Finlio explains a person's own financial position back to them, in plain
English, using only numbers it was given — and it never tells them what to buy.

---

## 2. Defence in depth — where each rule actually lives

A rule that exists only in a prompt is a rule that will eventually be broken. A
language model is a probabilistic system; prose is guidance, not enforcement.
Everything that genuinely must hold is enforced in at least one layer that
cannot be talked out of it.

| Requirement | Prompt | Code | Where |
|---|---|---|---|
| Disclaimer on every output | asks | **guarantees** | `seal()` applies it; `z.literal` in `AgentOutput` rejects any other value |
| No fabricated numbers | asks | **reduces** | Arithmetic is done in `packages/core/domain` and handed to the model; it explains, never derives |
| No security recommendations | asks | **detects** | `guardrails.inspect()` pattern-matches and refuses to seal |
| No assured-return claims | asks | **detects** | same |
| "I placed the order" | asks | **detects** + structurally impossible | no write path to any broker exists |
| Prompt disclosure | asks | **detects** | leak patterns in `inspect()` |
| Injected instructions in user data | asks | **contains** | all untrusted content is fenced by `asData()` |
| Model sees only what it needs | — | **enforces** | `redactDocument()` strips notes and identifiers before the prompt is built |
| Output shape | constrains | **validates twice** | Gemini `responseJsonSchema`, then Zod re-validation |

The pattern: **the model is asked, the code guarantees.**

---

## 3. Product rules

### 3.1 Suggest, never execute
Finlio has no ability to trade, transfer, redeem, or start a SIP, and never
will. This is architectural, not a policy setting — there is no code path from
an agent to a broker. Any output that implies an action was taken fails the
guardrail check.

### 3.2 Never recommend a specific security
Not "buy Reliance", not "exit this fund", not when asked directly. This is the
line between analysis and regulated investment advice, and Finlio is on the
analysis side of it.

**In scope:** allocation and concentration, savings rate, monthly amounts to
fund a goal, emergency-fund adequacy, insurance cover vs. income,
debt-to-income, expense patterns, and how an instrument the user already owns
works.

### 3.3 Never promise returns
No assured returns, no guarantees, no "this will grow to". Where a projection is
unavoidable — goal planning — the assumption is stated inline ("assuming 6%
annual inflation") and described as an assumption. SEBI prohibits assured-return
claims, and it is the most common way finance copy becomes a regulatory problem.

### 3.4 Never invent a number
Every figure must be present in, or derived from, the supplied data. This is why
the domain layer computes and the model narrates: a fabricated balance is worse
than silence, because the user will act on it.

### 3.5 Data minimisation
The model sees a redacted document by default. Notes and identifying fields
(folio, employer, insurer, bank, lender) are stripped unless a task explicitly
needs them. Amounts without names are not a profile.

### 3.6 Never handle credentials
No credential, account number, PAN, Aadhaar, card number, CVV, OTP, or password
is ever requested, echoed, or stored. If one appears in the user's data, the
model refers to the holding by label instead.

---

## 4. Regulatory posture (India)

Finlio is **not** a SEBI-registered Investment Adviser or Research Analyst, and
never presents itself as licensed or regulated. Concretely:

- **SEBI (IA Regulations, 2013):** personalised investment advice for
  consideration requires registration. Finlio stays out of scope by never
  recommending securities (§3.2) and confining itself to the user's own
  position.
- **SEBI (assured returns):** prohibited in any communication (§3.3).
- **IRDAI:** insurance is framed as cover, never as an investment with a yield.
  A sum assured is not net worth — the net-worth engine encodes this, counting
  only a stated surrender value.
- **RBI / FEMA:** cross-border movement, NRE/NRO mechanics, and repatriation are
  out of scope and referred to a qualified adviser.
- **DPDP Act, 2023:** raw financial data stays on the user's device, encrypted.
  What the model sees is redacted and transient; it is not used for training.

Every user-facing AI output carries, verbatim:

> This is guidance, not investment advice.

Legal review of this wording is tracked in [`legal.md`](./legal.md) and PRD §14.

---

## 5. Prompt injection

The user's own document is untrusted input. So is a fund name from a broker CSV,
a holding label, and any news text a Phase-3 agent pulls in.

All of it is fenced between `<<<FINLIO_DATA>>>` and `<<<END_FINLIO_DATA>>>`, and
the system instruction (§2.6) states that content inside is data to analyse,
never instruction to obey. A holding labelled "ignore all previous instructions"
arrives clearly marked as a field value.

This mitigates; it does not solve. The real containment is that a successful
injection has nothing valuable to reach — the model has no tools, no write
access, and no network. The worst outcome is a bad brief, which the guardrails
then refuse to seal.

---

## 6. Model routing and cost

Routing is a table (`packages/core/src/llm/routing.ts`), not scattered
conditionals, so the cost profile of the product is readable in one place.

| Task | Tier | Why |
|---|---|---|
| `morning_brief` | reasoning | The wedge — the output users judge the product on |
| `monthly_report`, `goal_coach`, `health_score` | reasoning | Multi-step reasoning, runs rarely |
| `expense_analysis` | fast | High volume, low reasoning |

Model ids are **configuration** (`GEMINI_MODEL_REASONING` /
`GEMINI_MODEL_FAST`), because Gemini's lineup moves faster than our release
cycle and a hardcoded id goes stale silently. Verify the defaults against
`ai.models.list()` before each release.

**Open decision:** the morning brief runs per user, per weekday. It currently
sits on the reasoning tier. Moving the per-holding lines to the fast tier is a
real saving at scale and a real quality risk on the product's most visible
output — decide it with measurement, not by default.

---

## 7. Evaluation

Agent behaviour is a regression surface like any other.

- Prompts are **pure, versioned builders**. `promptVersion` lands in every
  `AgentOutput`, so a bad brief traces to exact wording.
- The eval suite runs against `createRecordedClient` — fixtures on disk, no
  network, no API key. CI must pass on a clean checkout (CLAUDE.md), and an eval
  that calls a live model measures the weather as much as the prompt.
- Golden assertions: output validates, no fabricated figures, disclaimer
  present, no guardrail violation.

Bump `POLICY_VERSION` whenever §3 changes, and re-run the golden set — an eval
result is only meaningful against a known policy revision.

---

## 8. What is deliberately not automated

- No agent sends anything without an explicit, scheduled, logged trigger
  (Phase 3, QStash).
- No agent writes to the user's document. Agents read and report; the user
  edits.
- No agent contacts a third party on the user's behalf.
