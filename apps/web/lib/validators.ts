import { z } from "zod";

export const levelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "COMPETITIVE",
  "PRO"
]);

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER", "NO_ANSWER"]);

export const matchTypeSchema = z.enum(["PRACTICE", "OFFICIAL"]);
export const matchResultSchema = z.enum(["WIN", "LOSE"]);

export const practiceMenuCategorySchema = z.enum([
  "SERVE",
  "RECEIVE",
  "FOREHAND",
  "BACKHAND",
  "FOOTWORK",
  "DRIVE",
  "BLOCK",
  "GAME",
  "PHYSICAL",
  "MENTAL",
  "OTHER"
]);

export const partnerPostTypeSchema = z.enum(["PRACTICE", "MATCH"]);
export const partnerPostStatusSchema = z.enum(["OPEN", "CLOSED"]);
export const partnerRequestStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);
export const reportTargetTypeSchema = z.enum(["USER", "PARTNER_POST", "PARTNER_REQUEST", "CHAT_MESSAGE"]);
export const reportStatusSchema = z.enum(["OPEN", "REVIEWED", "DISMISSED"]);
export const reportReasonSchema = z.enum([
  "SPAM",
  "HARASSMENT",
  "INAPPROPRIATE",
  "PERSONAL_INFORMATION",
  "FAKE_INFORMATION",
  "OTHER"
]);

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

export const mobileRegisterSchema = z
  .object({
    name: z.string().trim().min(1, "名前を入力してください").max(50, "名前は50文字以内で入力してください"),
    email: z.string().trim().email("メールアドレスの形式が正しくありません"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください").max(128, "パスワードは128文字以内で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(80, "名前は80文字以内で入力してください"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "ユーザー名は3〜30文字の英数字と_で入力してください")
    .optional()
    .nullable()
    .or(z.literal("")),
  club: z.string().trim().max(120, "所属クラブは120文字以内で入力してください").optional().nullable(),
  level: levelSchema,
  gender: genderSchema.optional().nullable(),
  playStyle: z.string().trim().max(200, "プレースタイルは200文字以内で入力してください").optional().nullable(),
  publicProfileEnabled: z.boolean().default(false),
  avatarUrl: z
    .string()
    .trim()
    .max(1_400_000, "画像データが大きすぎます")
    .refine(
      (value) =>
        value === "" ||
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value) ||
        /^https?:\/\//.test(value),
      "画像データの形式が正しくありません"
    )
    .optional()
    .nullable()
});

export const mobileProfileSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(50, "名前は50文字以内で入力してください"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "ユーザー名は3〜30文字の英数字と_で入力してください")
    .optional()
    .nullable()
    .or(z.literal("")),
  level: levelSchema,
  gender: genderSchema.nullable(),
  publicProfileEnabled: z.boolean().default(false)
});

export const equipmentSchema = z.object({
  blade: z.string().trim().min(1, "ラケット名を入力してください").max(120, "ラケット名は120文字以内で入力してください"),
  rubberFh: z.string().trim().max(120, "フォアラバーは120文字以内で入力してください").optional().nullable(),
  rubberFhThickness: z.string().trim().max(40, "フォアラバーの厚さは40文字以内で入力してください").optional().nullable(),
  rubberBh: z.string().trim().max(120, "バックラバーは120文字以内で入力してください").optional().nullable(),
  rubberBhThickness: z.string().trim().max(40, "バックラバーの厚さは40文字以内で入力してください").optional().nullable(),
  gripType: z.string().trim().max(80, "グリップ形状は80文字以内で入力してください").optional().nullable(),
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
  equipmentId: z.string().uuid().optional().nullable(),
  practiceMenuId: z.string().uuid("練習メニューの指定が正しくありません").optional().nullable(),
  isPublic: z.boolean().default(false)
});

export const practiceMenuItemSchema = z.object({
  title: z.string().trim().min(1, "項目名を入力してください").max(100, "項目名は100文字以内で入力してください"),
  description: z.string().trim().max(500, "項目の説明は500文字以内で入力してください").optional().nullable(),
  category: practiceMenuCategorySchema,
  durationMin: z.coerce
    .number({ invalid_type_error: "項目の時間は数値で入力してください" })
    .int("項目の時間は整数で入力してください")
    .min(1, "項目の時間は1分以上で入力してください")
    .max(300, "項目の時間は300分以内で入力してください")
    .optional()
    .nullable(),
  order: z.coerce.number().int("並び順は整数で入力してください").min(0, "並び順は0以上で入力してください")
});

export const practiceMenuSchema = z.object({
  title: z.string().trim().min(1, "メニュー名を入力してください").max(100, "メニュー名は100文字以内で入力してください"),
  description: z.string().trim().max(1000, "説明は1000文字以内で入力してください").optional().nullable(),
  goal: z.string().trim().max(500, "目的は500文字以内で入力してください").optional().nullable(),
  totalMinutes: z.coerce
    .number({ invalid_type_error: "合計時間は数値で入力してください" })
    .int("合計時間は整数で入力してください")
    .min(1, "合計時間は1分以上で入力してください")
    .max(600, "合計時間は600分以内で入力してください")
    .optional()
    .nullable(),
  items: z.array(practiceMenuItemSchema).min(1, "メニュー項目を1件以上追加してください")
});

export const partnerPostSchema = z.object({
  type: partnerPostTypeSchema,
  title: z.string().trim().min(1, "タイトルを入力してください").max(60, "タイトルは60文字以内で入力してください"),
  area: z.string().trim().max(100, "エリアは100文字以内で入力してください").optional().nullable(),
  preferredTime: z.string().trim().max(100, "希望日時は100文字以内で入力してください").optional().nullable(),
  level: z.string().trim().max(50, "レベルは50文字以内で入力してください").optional().nullable(),
  purpose: z.string().trim().max(120, "目的は120文字以内で入力してください").optional().nullable(),
  message: z.string().trim().max(500, "募集メッセージは500文字以内で入力してください").optional().nullable(),
  status: partnerPostStatusSchema.optional()
});

export const partnerPostUpdateSchema = partnerPostSchema.extend({
  status: partnerPostStatusSchema.default("OPEN")
});

export const partnerRequestSchema = z.object({
  message: z.string().trim().max(300, "参加希望メッセージは300文字以内で入力してください").optional().nullable()
});

export const partnerRequestUpdateSchema = z.object({
  status: partnerRequestStatusSchema
});

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1, "メッセージを入力してください").max(1000, "メッセージは1000文字以内で入力してください")
});

export const reportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetUserId: z.string().trim().min(1).optional().nullable(),
  targetPostId: z.string().trim().min(1).optional().nullable(),
  targetRequestId: z.string().trim().min(1).optional().nullable(),
  targetMessageId: z.string().trim().min(1).optional().nullable(),
  reason: reportReasonSchema,
  details: z.string().trim().max(500, "詳細は500文字以内で入力してください").optional().nullable()
});

export const blockSchema = z.object({
  blockedUserId: z.string().trim().min(1, "ブロックするユーザーを指定してください")
});

const scoreRowSchema = z.object({
  set: z.coerce.number().int("セット番号は整数で入力してください").min(1).max(7),
  me: z.coerce.number().int("得点は整数で入力してください").min(0).max(99),
  opp: z.coerce.number().int("得点は整数で入力してください").min(0).max(99)
});

export const matchSchema = z.object({
  playedAt: dateStringSchema,
  opponentName: z.string().trim().min(1, "対戦相手名を入力してください").max(120),
  opponentTeam: z.string().trim().max(120, "相手所属チームは120文字以内で入力してください").optional().nullable(),
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
  memo: z.string().trim().max(4000, "反省・メモは4000文字以内で入力してください").optional().nullable(),
  equipmentId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().default(false)
});

export type ScoreRowInput = z.infer<typeof scoreRowSchema>;
