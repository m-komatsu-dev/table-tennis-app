import { z } from "zod";
import { practiceMenuCategorySchema } from "../validators";

const shortText = (label: string, max: number) =>
  z.string().trim().min(1, `${label}を入力してください`).max(max, `${label}は${max}文字以内にしてください`);

const analysisList = (label: string) =>
  z.array(shortText(label, 300)).min(1, `${label}を1件以上含めてください`).max(8, `${label}は8件以内にしてください`);

export const aiAnalysisResultSchema = z
  .object({
    summary: shortText("総評", 1200),
    strengths: analysisList("強み"),
    weaknesses: analysisList("課題"),
    losingPatterns: analysisList("負け試合の傾向"),
    recommendedFocus: analysisList("重点練習"),
    nextActions: analysisList("次の行動")
  })
  .strict();

export const aiPracticeMenuSuggestionSchema = z
  .object({
    title: shortText("メニュー名", 100),
    description: z.string().trim().max(1000, "説明は1000文字以内にしてください").optional(),
    goal: shortText("目的", 500),
    totalMinutes: z.number().int().min(1).max(600),
    items: z
      .array(
        z
          .object({
            title: shortText("項目名", 100),
            description: z.string().trim().max(500, "項目の説明は500文字以内にしてください").optional(),
            category: practiceMenuCategorySchema,
            durationMin: z.number().int().min(1).max(300),
            order: z.number().int().min(0).max(99)
          })
          .strict()
      )
      .min(1, "メニュー項目を1件以上含めてください")
      .max(20, "メニュー項目は20件以内にしてください")
  })
  .strict()
  .superRefine((suggestion, context) => {
    const orders = new Set<number>();

    suggestion.items.forEach((item, index) => {
      if (orders.has(item.order)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "メニュー項目の並び順が重複しています",
          path: ["items", index, "order"]
        });
      }
      orders.add(item.order);
    });
  });

export type AiAnalysisResult = z.infer<typeof aiAnalysisResultSchema>;
export type AiPracticeMenuSuggestion = z.infer<typeof aiPracticeMenuSuggestionSchema>;

export const aiAnalysisResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "weaknesses", "losingPatterns", "recommendedFocus", "nextActions"],
  properties: {
    summary: { type: "string", description: "日本語の総評。1200文字以内。" },
    strengths: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    weaknesses: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    losingPatterns: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    recommendedFocus: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    nextActions: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } }
  }
} as const;

export const aiPracticeMenuResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "goal", "totalMinutes", "items"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    goal: { type: "string" },
    totalMinutes: { type: "integer", minimum: 1, maximum: 600 },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "durationMin", "order"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string", enum: practiceMenuCategorySchema.options },
          durationMin: { type: "integer", minimum: 1, maximum: 300 },
          order: { type: "integer", minimum: 0, maximum: 99 }
        }
      }
    }
  }
} as const;
