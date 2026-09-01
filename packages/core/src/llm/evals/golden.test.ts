import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REQUIRED_DISCLAIMER } from "@finlio/schemas";
import { evaluate, type EvalCase } from "./golden";
import { seal } from "../guardrails";

const dir = join(import.meta.dirname, "fixtures");
const cases: EvalCase[] = readdirSync(dir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as EvalCase);

describe("golden set", () => {
  it("has fixtures to run", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases.map((c) => [c.name, c] as const))("%s passes every check", (_name, testCase) => {
    expect(evaluate(testCase)).toEqual([]);
  });

  it.each(cases.map((c) => [c.name, c] as const))(
    "%s seals into a valid, disclaimed output",
    (_name, testCase) => {
      const result = seal(testCase.response as never, {
        kind: "morning_brief",
        provider: "google",
        modelId: "gemini-2.5-pro",
        promptVersion: testCase.promptVersion,
        now: new Date("2026-09-01T03:15:00.000Z"),
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output.disclaimer).toBe(REQUIRED_DISCLAIMER);
    }
  );
});

/**
 * The harness has to fail on bad output, or a green suite means nothing.
 * These are the regressions it exists to catch.
 */
describe("the harness catches what it is for", () => {
  const good = cases[0]!;

  it("catches a fabricated figure", () => {
    const tampered = structuredClone(good);
    (tampered.response as { headline: string }).headline =
      "Your net worth rose to 9999999 today";
    const findings = evaluate(tampered);
    expect(findings.some((f) => f.rule.includes("fabricated"))).toBe(true);
  });

  it("catches a ref pointing at nothing", () => {
    const tampered = structuredClone(good);
    const sections = (tampered.response as { sections: { items: { ref?: string }[] }[] }).sections;
    sections[0]!.items[0]!.ref = "does-not-exist";
    expect(evaluate(tampered).some((f) => f.rule === "refs resolve")).toBe(true);
  });

  it("catches a security recommendation", () => {
    const tampered = structuredClone(good);
    (tampered.response as { sections: { body: string }[] }).sections[0]!.body =
      "You should buy more of this before the open.";
    expect(evaluate(tampered).some((f) => f.rule.includes("2.2"))).toBe(true);
  });

  it("catches an assured-return claim", () => {
    const tampered = structuredClone(good);
    (tampered.response as { sections: { body: string }[] }).sections[0]!.body =
      "This offers guaranteed returns over the year.";
    expect(evaluate(tampered).some((f) => f.rule.includes("3.2"))).toBe(true);
  });

  it("catches structurally invalid output", () => {
    const tampered = structuredClone(good);
    (tampered as { response: unknown }).response = { headline: "no sections" };
    expect(evaluate(tampered)[0]?.rule).toBe("output validates");
  });

  it("does not flag small counts as fabricated figures", () => {
    // "3 goals" is a count, not a claim about money.
    const tampered = structuredClone(good);
    (tampered.response as { headline: string }).headline = "You have 3 goals and 2 holdings";
    expect(evaluate(tampered).some((f) => f.rule.includes("fabricated"))).toBe(false);
  });
});
