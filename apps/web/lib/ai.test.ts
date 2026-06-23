import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_GEMINI_MODEL, GeminiConfigurationError, getGeminiConfig } from "./ai/gemini";
import { toPracticeMenuCreateData } from "./ai/practice-menu";
import { aiAnalysisResultSchema, aiPracticeMenuSuggestionSchema } from "./ai/schemas";

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

test("AI analysis schema accepts the expected output", () => {
  const result = aiAnalysisResultSchema.safeParse({
    summary: "レシーブ後の展開に改善余地があります。",
    strengths: ["フォアドライブが安定しています。"],
    weaknesses: ["短いサーブへの対応が不安定です。"],
    losingPatterns: ["序盤のレシーブミスで先行されています。"],
    recommendedFocus: ["短い下回転へのレシーブを反復します。"],
    nextActions: ["次の練習でレシーブ成功率を記録します。"]
  });

  assert.equal(result.success, true);
});

test("AI practice menu schema rejects an unknown category", () => {
  const result = aiPracticeMenuSuggestionSchema.safeParse({
    ...validSuggestion,
    items: [{ ...validSuggestion.items[0], category: "SMASH" }]
  });

  assert.equal(result.success, false);
});

test("AI practice menu schema rejects empty items", () => {
  assert.equal(aiPracticeMenuSuggestionSchema.safeParse({ ...validSuggestion, items: [] }).success, false);
});

test("AI practice menu schema enforces total and item duration ranges", () => {
  assert.equal(aiPracticeMenuSuggestionSchema.safeParse({ ...validSuggestion, totalMinutes: 601 }).success, false);
  assert.equal(
    aiPracticeMenuSuggestionSchema.safeParse({
      ...validSuggestion,
      items: [{ ...validSuggestion.items[0], durationMin: 301 }]
    }).success,
    false
  );
});

test("AI suggestion is converted to an owned PracticeMenu create input", () => {
  const suggestion = aiPracticeMenuSuggestionSchema.parse(validSuggestion);
  const data = toPracticeMenuCreateData("user-1", suggestion);

  assert.equal(data.userId, "user-1");
  assert.equal(data.title, suggestion.title);
  assert.equal(data.items.create.length, 2);
  assert.deepEqual(data.items.create[0], {
    title: "短い下回転サーブへのツッツキ",
    description: null,
    category: "RECEIVE",
    durationMin: 20,
    order: 0
  });
});

test("Gemini configuration rejects a missing API key", () => {
  assert.throws(
    () => getGeminiConfig({ GEMINI_API_KEY: undefined, GEMINI_MODEL: undefined }),
    GeminiConfigurationError
  );
});

test("Gemini configuration uses the stable default model", () => {
  assert.equal(
    getGeminiConfig({ GEMINI_API_KEY: "test-key", GEMINI_MODEL: "" }).model,
    DEFAULT_GEMINI_MODEL
  );
});
