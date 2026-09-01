import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { LlmClient, LlmRequest, LlmResult, LlmUsage } from "@finlio/core/ports";
import { resolveModel, type ModelEnv } from "@finlio/core/llm";

/**
 * Gemini adapter for the `LlmClient` port.
 *
 * Two things this does that a thin SDK wrapper would not:
 *
 * 1. **Structured output is enforced at the provider.** The caller's Zod schema
 *    is converted to JSON Schema and passed as `responseJsonSchema`, so the
 *    model is constrained during decoding rather than asked politely in prose.
 *    The response is then re-validated with Zod anyway, because a provider-side
 *    constraint is a strong prior, not a guarantee.
 *
 * 2. **No exception escapes as a raw error.** Every failure comes back as a
 *    typed `LlmResult`, so calling code cannot forget to handle a model that
 *    was rate-limited, filtered, or returned prose where JSON was required.
 */

export interface GeminiConfig {
  apiKey: string;
  env?: ModelEnv;
  /** Lower is steadier. Financial explanation wants consistency, not flair. */
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Gemini rejects some JSON Schema keywords that Zod emits. Strip them rather
 * than hand-writing schemas twice and letting the two drift.
 */
function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: "output" }) as Record<string, unknown>;
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        if (key === "$schema" || key === "additionalProperties") continue;
        out[key] = strip(value);
      }
      return out;
    }
    return node;
  };
  return strip(json) as Record<string, unknown>;
}

/** Models sometimes wrap JSON in a fence despite being told not to. */
function stripFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/);
  return (fenced?.[1] ?? trimmed).trim();
}

export function createGeminiClient(config: GeminiConfig): LlmClient {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  return {
    async complete<T>(request: LlmRequest<T>): Promise<LlmResult<T>> {
      const model = request.model ?? resolveModel(request.task, config.env);

      let raw: string | undefined;
      let usage: LlmUsage = { inputTokens: 0, outputTokens: 0 };

      try {
        const response = await ai.models.generateContent({
          model,
          contents: request.prompt,
          config: {
            systemInstruction: request.systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: toGeminiSchema(request.schema as z.ZodType),
            temperature: config.temperature ?? 0.2,
            maxOutputTokens: config.maxOutputTokens ?? 8192,
          },
        });

        raw = response.text;
        const meta = response.usageMetadata;
        usage = {
          inputTokens: meta?.promptTokenCount ?? 0,
          outputTokens: meta?.candidatesTokenCount ?? 0,
          ...(meta?.thoughtsTokenCount ? { thinkingTokens: meta.thoughtsTokenCount } : {}),
        };

        if (!raw) {
          // An empty body with no error is how a safety filter usually shows up.
          return {
            ok: false,
            reason: "refusal",
            detail: `Model returned no content (finish reason: ${
              response.candidates?.[0]?.finishReason ?? "unknown"
            }).`,
          };
        }
      } catch (error) {
        return {
          ok: false,
          reason: "transport",
          detail: error instanceof Error ? error.message : String(error),
        };
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(stripFence(raw));
      } catch {
        return { ok: false, reason: "schema", detail: "Response was not valid JSON.", raw };
      }

      const validated = request.schema.safeParse(parsedJson);
      if (!validated.success) {
        return {
          ok: false,
          reason: "schema",
          detail: validated.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; "),
          raw,
        };
      }

      return { ok: true, value: validated.data, usage };
    },
  };
}
