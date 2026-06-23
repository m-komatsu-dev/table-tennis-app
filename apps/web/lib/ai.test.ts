import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn()
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  }
}));

import {
  DEFAULT_GEMINI_MODEL,
  GeminiConfigurationError,
  GeminiResponseError,
  generateGeminiJson,
  getGeminiConfig
} from "./ai/gemini";
import { toPracticeMenuCreateData } from "./ai/practice-menu";
import { consumeAiRateLimit } from "./ai/rate-limit";
import { aiAnalysisResultSchema, aiPracticeMenuSuggestionSchema } from "./ai/schemas";

const validAnalysis = {
  summary: "レシーブ後の展開に改善余地があります。",
  strengths: ["フォアドライブが安定しています。"],
  weaknesses: ["短いサーブへの対応が不安定です。"],
  losingPatterns: ["序盤のレシーブミスで先行されています。"],
  recommendedFocus: ["短い下回転へのレシーブを反復します。"],
  nextActions: ["次の練習でレシーブ成功率を記録します。"]
};

const validSuggestion = {
  title: "レシーブ安定強化メニュー",
  description: "短いレシーブから先手を取る練習です。",
  goal: "レシーブミスを減らす",
  totalMinutes: 60,
  items: [
    {
      title: "短い下回転サーブへのツッツキ",
      category: "RECEIVE" as const,
      durationMin: 20,
      order: 0
    },
    {
      title: "レシーブから4球目まで",
      description: "コースを決めて反復する",
      category: "GAME" as const,
      durationMin: 40,
      order: 1
    }
  ]
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI analysis output schema", () => {
  test("accepts the expected JSON shape", () => {
    expect(aiAnalysisResultSchema.safeParse(validAnalysis).success).toBe(true);
  });

  test.each([
    ["missing summary", { ...validAnalysis, summary: undefined }],
    ["non-array strengths", { ...validAnalysis, strengths: "安定" }],
    ["non-array weaknesses", { ...validAnalysis, weaknesses: "不安定" }],
    ["overly long summary", { ...validAnalysis, summary: "a".repeat(1201) }],
    ["overly long list item", { ...validAnalysis, strengths: ["a".repeat(301)] }]
  ])("rejects %s", (_label, value) => {
    expect(aiAnalysisResultSchema.safeParse(value).success).toBe(false);
  });

  test("rejects empty analysis lists according to the current specification", () => {
    expect(aiAnalysisResultSchema.safeParse({ ...validAnalysis, weaknesses: [] }).success).toBe(false);
  });
});

describe("AI practice menu suggestion schema", () => {
  test("accepts a valid suggestion", () => {
    expect(aiPracticeMenuSuggestionSchema.safeParse(validSuggestion).success).toBe(true);
  });

  test.each([
    ["empty title", { ...validSuggestion, title: " " }],
    ["empty goal", { ...validSuggestion, goal: "" }],
    ["zero totalMinutes", { ...validSuggestion, totalMinutes: 0 }],
    ["excessive totalMinutes", { ...validSuggestion, totalMinutes: 601 }],
    ["empty items", { ...validSuggestion, items: [] }],
    ["unknown category", { ...validSuggestion, items: [{ ...validSuggestion.items[0], category: "SMASH" }] }],
    ["zero duration", { ...validSuggestion, items: [{ ...validSuggestion.items[0], durationMin: 0 }] }],
    ["excessive duration", { ...validSuggestion, items: [{ ...validSuggestion.items[0], durationMin: 301 }] }],
    ["negative order", { ...validSuggestion, items: [{ ...validSuggestion.items[0], order: -1 }] }],
    ["duplicate order", { ...validSuggestion, items: validSuggestion.items.map((item) => ({ ...item, order: 0 })) }]
  ])("rejects %s", (_label, value) => {
    expect(aiPracticeMenuSuggestionSchema.safeParse(value).success).toBe(false);
  });
});

test("AI suggestion is converted to an owned PracticeMenu create input", () => {
  const suggestion = aiPracticeMenuSuggestionSchema.parse(validSuggestion);
  const data = toPracticeMenuCreateData("user-1", suggestion);

  expect(data).toMatchObject({
    userId: "user-1",
    title: suggestion.title,
    isTemplate: true
  });
  expect(data.items.create).toHaveLength(2);
  expect(data.items.create[0]).toEqual({
    title: "短い下回転サーブへのツッツキ",
    description: null,
    category: "RECEIVE",
    durationMin: 20,
    order: 0
  });
});

describe("Gemini JSON generation", () => {
  test("rejects a missing API key with a clear configuration error", () => {
    expect(() => getGeminiConfig({ GEMINI_API_KEY: undefined })).toThrow(GeminiConfigurationError);
  });

  test("uses the stable default model", () => {
    expect(getGeminiConfig({ GEMINI_API_KEY: "test-key", GEMINI_MODEL: "" }).model).toBe(DEFAULT_GEMINI_MODEL);
  });

  test("rejects invalid JSON without calling the real Gemini API", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContentMock.mockResolvedValueOnce({ text: "not-json" });

    await expect(generateGeminiJson({ prompt: "test", schema: z.object({ ok: z.boolean() }), responseJsonSchema: {} }))
      .rejects.toThrow("Gemini response was not valid JSON");
  });

  test("rejects JSON that does not match the schema", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContentMock.mockResolvedValueOnce({ text: JSON.stringify({ ok: "yes" }) });

    await expect(generateGeminiJson({ prompt: "test", schema: z.object({ ok: z.boolean() }), responseJsonSchema: {} }))
      .rejects.toBeInstanceOf(GeminiResponseError);
  });

  test("returns validated JSON from the mocked Gemini client", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContentMock.mockResolvedValueOnce({ text: JSON.stringify({ ok: true }) });

    await expect(generateGeminiJson({ prompt: "test", schema: z.object({ ok: z.boolean() }), responseJsonSchema: {} }))
      .resolves.toEqual({ ok: true });
    expect(generateContentMock).toHaveBeenCalledOnce();
  });
});

test("AI rate limit rejects requests after the limit is reached", () => {
  const uniqueUser = `rate-limit-${Date.now()}-${Math.random()}`;

  expect(consumeAiRateLimit(uniqueUser, { limit: 1 }).allowed).toBe(true);
  const result = consumeAiRateLimit(uniqueUser, { limit: 1 });

  expect(result.allowed).toBe(false);
  expect(result.retryAfterSeconds).toBeGreaterThan(0);
});
