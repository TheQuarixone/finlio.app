import { describe, expect, it } from "vitest";
import { AgentOutput, type AgentOutputDraft } from "@finlio/schemas";
import { inspect, seal } from "./guardrails";

const draft = (overrides: Partial<AgentOutputDraft> = {}): AgentOutputDraft => ({
  headline: "Two holdings report today",
  sections: [{ id: "holdings", title: "Your holdings", body: "", items: [] }],
  ...overrides,
});

const opts = {
  kind: "morning_brief" as const,
  provider: "google",
  modelId: "gemini-2.5-pro",
  promptVersion: "morning-brief@1",
  now: new Date("2026-09-01T03:15:00.000Z"),
};

describe("guardrails.inspect", () => {
  it("passes a clean draft", () => {
    expect(inspect(draft())).toEqual([]);
  });

  it("catches an assured-return claim", () => {
    const found = inspect(
      draft({ sections: [{ id: "s", title: "T", body: "This offers guaranteed returns of 12%.", items: [] }] })
    );
    expect(found[0]?.rule).toMatch(/§3.2/);
  });

  it("catches a buy recommendation", () => {
    const found = inspect(
      draft({ sections: [{ id: "s", title: "T", body: "You should buy more of this fund.", items: [] }] })
    );
    expect(found[0]?.rule).toMatch(/§2.2/);
  });

  it("catches the model claiming it acted", () => {
    const found = inspect(draft({ headline: "I have placed the order for you" }));
    expect(found[0]?.rule).toMatch(/§2.1/);
  });

  it("catches prompt disclosure", () => {
    const found = inspect(
      draft({ sections: [{ id: "s", title: "T", body: "My instructions are to never do that.", items: [] }] })
    );
    expect(found[0]?.rule).toMatch(/§2.5/);
  });

  it("checks item text, not just section bodies", () => {
    const found = inspect(
      draft({
        sections: [
          { id: "s", title: "T", body: "", items: [{ text: "Risk-free return of 9% here." }] },
        ],
      })
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.where).toMatch(/items\[0\]/);
  });
});

describe("guardrails.seal", () => {
  it("stamps provenance and the disclaimer, producing a valid AgentOutput", () => {
    const result = seal(draft(), opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(() => AgentOutput.parse(result.output)).not.toThrow();
    expect(result.output.disclaimer).toBe("This is guidance, not investment advice.");
    expect(result.output.model).toEqual({
      provider: "google", id: "gemini-2.5-pro", promptVersion: "morning-brief@1",
    });
    expect(result.output.generatedAt).toBe("2026-09-01T03:15:00.000Z");
  });

  it("applies the disclaimer rather than trusting the model to include it", () => {
    // The draft schema has no disclaimer field at all — it cannot be forgotten.
    const result = seal(draft(), opts);
    expect(result.ok && result.output.disclaimer).toBeTruthy();
  });

  it("refuses to seal a draft that violates policy", () => {
    const result = seal(draft({ headline: "Guaranteed returns this month" }), opts);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations).toHaveLength(1);
  });
});
