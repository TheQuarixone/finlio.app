import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createRecordedClient } from "./recorded";

const schema = z.object({ headline: z.string() });
const request = {
  task: "morning_brief" as const,
  systemInstruction: "policy",
  prompt: "prompt",
  schema,
};

describe("createRecordedClient", () => {
  it("replays a fixture without touching the network", async () => {
    const client = createRecordedClient([
      { task: "morning_brief", response: { headline: "Two holdings report today" } },
    ]);
    const result = await client.complete(request);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.headline).toBe("Two holdings report today");
  });

  it("reports a missing fixture as a transport failure rather than throwing", async () => {
    const result = await createRecordedClient([]).complete(request);
    expect(result).toMatchObject({ ok: false, reason: "transport" });
  });

  it("still validates the fixture, so a stale golden file fails loudly", async () => {
    const client = createRecordedClient([{ task: "morning_brief", response: { headline: 42 } }]);
    const result = await client.complete(request);
    expect(result).toMatchObject({ ok: false, reason: "schema" });
  });
});
