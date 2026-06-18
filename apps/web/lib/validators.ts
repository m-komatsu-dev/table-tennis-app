import { z } from "zod";

export const levelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "COMPETITIVE"
]);

export const matchTypeSchema = z.enum(["PRACTICE", "OFFICIAL", "TOURNAMENT"]);
export const matchResultSchema = z.enum(["WIN", "LOSE", "DRAW"]);

const dateStringSchema = z
  .string({ required_error: "日付を入力してください" })
  .trim()
  .min(1, "日付を入力してください")
  .refine((value) => !Number.isNaN(Date.parse(value)), "日付形式が正しくありません");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(80, "名前は80文字以内で入力してください"),
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(128, "パスワードは128文字以内で入力してください")
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(80, "名前は80文字以内で入力してください"),
  club: z.string().trim().max(120, "所属クラブは120文字以内で入力してください").optional().nullable(),
  level: levelSchema,
  playStyle: z.string().trim().max(200, "プレースタイルは200文字以内で入力してください").optional().nullable(),
  avatarUrl: z.string().trim().url("URL形式で入力してください").optional().or(z.literal("")).nullable()
});

export const equipmentSchema = z.object({
  blade: z.string().trim().min(1, "ラケット名を入力してください").max(120, "ラケット名は120文字以内で入力してください"),
  rubberFh: z.string().trim().max(120, "フォアラバーは120文字以内で入力してください").optional().nullable(),
  rubberBh: z.string().trim().max(120, "バックラバーは120文字以内で入力してください").optional().nullable(),
  isCurrent: z.boolean().default(true)
});

export const practiceSchema = z.object({
  practicedAt: dateStringSchema,
  durationMin: z.coerce
    .number({ invalid_type_error: "練習時間は数値で入力してください" })
    .int("練習時間は整数で入力してください")
    .min(1, "練習時間は1分以上で入力してください")
    .max(1440, "練習時間は1440分以内で入力してください"),
  location: z.string().trim().max(120, "場所は120文字以内で入力してください").optional().nullable(),
  content: z.string().trim().max(4000, "練習内容メモは4000文字以内で入力してください").optional().nullable(),
  equipmentId: z.string().uuid().optional().nullable()
});

const scoreRowSchema = z.object({
  set: z.coerce.number().int("セット番号は整数で入力してください").min(1).max(7),
  me: z.coerce.number().int("得点は整数で入力してください").min(0).max(99),
  opp: z.coerce.number().int("得点は整数で入力してください").min(0).max(99)
});

export const matchSchema = z.object({
  playedAt: dateStringSchema,
  opponentName: z.string().trim().min(1, "対戦相手名を入力してください").max(120),
  matchType: matchTypeSchema.default("PRACTICE"),
  scores: z
    .array(scoreRowSchema, { required_error: "セット別スコアを入力してください" })
    .min(1, "セット別スコアを1件以上入力してください")
    .max(7, "セット別スコアは7件以内で入力してください")
    .superRefine((scores, context) => {
      const setNumbers = new Set<number>();

      for (const [index, score] of scores.entries()) {
        if (setNumbers.has(score.set)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "セット番号が重複しています",
            path: [index, "set"]
          });
        }
        setNumbers.add(score.set);
      }
    }),
  result: matchResultSchema,
  memo: z.string().trim().max(4000, "反省・メモは4000文字以内で入力してください").optional().nullable()
});

export type ScoreRowInput = z.infer<typeof scoreRowSchema>;
