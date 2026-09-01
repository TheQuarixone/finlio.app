import { describe, expect, it } from "vitest";
import { AgentOutput, REQUIRED_DISCLAIMER } from "./agent";

const valid = {
  schema: "finlio.agent/v1",
  kind: "morning_brief",
  generatedAt: "2026-09-01T03:15:00.000Z",
  model: { provider: "anthropic", id: "claude-opus-5", promptVersion: "morning-brief@1" },
  headline: "Two of your holdings report today",
  sections: [
    {
      id: "holdings",
      title: "Your holdings",
      body: "",
      items: [
        {
          ref: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
          text: "Reliance reports Q2 results after close.",
          direction: "flat",
        },
      ],
    },
  ],
  disclaimer: REQUIRED_DISCLAIMER,
};

describe("AgentOutput", () => {
  it("parses a well-formed brief", () => {
    expect(AgentOutput.parse(valid).kind).toBe("morning_brief");
  });

  it("rejects output whose disclaimer was reworded", () => {
    const result = AgentOutput.safeParse({
      ...valid,
      disclaimer: "This is not financial advice.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects output with the disclaimer dropped entirely", () => {
    const { disclaimer: _dropped, ...withoutDisclaimer } = valid;
    expect(AgentOutput.safeParse(withoutDisclaimer).success).toBe(false);
  });

  it("rejects a brief with no sections", () => {
    expect(AgentOutput.safeParse({ ...valid, sections: [] }).success).toBe(false);
  });

  it("requires amounts to be Money, so the model cannot format currency itself", () => {
    const result = AgentOutput.safeParse({
      ...valid,
      sections: [
        { ...valid.sections[0], items: [{ text: "Up a bit", amount: "₹1.2L" }] },
      ],
    });
    expect(result.success).toBe(false);
  });
});
