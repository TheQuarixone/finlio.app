import { z } from "zod";
import type { LlmClient, LlmRequest, LlmResult } from "@finlio/core/ports";

/**
 * A deterministic `LlmClient` that replays fixtures.
 *
 * This is what CI uses. Tests and the eval suite must run on a clean checkout
 * with no API key and no network (CLAUDE.md), and an eval that calls a live
 * model measures the weather as much as the prompt.
 *
 * Fixtures are keyed by task, so a golden set is a directory of JSON files.
 */
export interface RecordedFixture {
  task: string;
  response: unknown;
}

export function createRecordedClient(fixtures: readonly RecordedFixture[]): LlmClient {
  const byTask = new Map(fixtures.map((f) => [f.task, f.response]));

  return {
    async complete<T>(request: LlmRequest<T>): Promise<LlmResult<T>> {
      const recorded = byTask.get(request.task);
      if (recorded === undefined) {
        return { ok: false, reason: "transport", detail: `No fixture recorded for "${request.task}".` };
      }
      const validated = (request.schema as z.ZodType<T>).safeParse(recorded);
      if (!validated.success) {
        return {
          ok: false,
          reason: "schema",
          detail: validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        };
      }
      return { ok: true, value: validated.data, usage: { inputTokens: 0, outputTokens: 0 } };
    },
  };
}
