import { z } from "zod";

export const levelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "COMPETITIVE"
]);

export const matchTypeSchema = z.enum(["PRACTICE", "OFFICIAL", "TOURNAMENT"]);
export const matchResultSchema = z.enum(["WIN", "LOSE", "DRAW"]);

export const registerSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(80),
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください")
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  club: z.string().trim().max(120).optional().nullable(),
  level: levelSchema,
  playStyle: z.string().trim().max(200).optional().nullable(),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")).nullable()
});

export const equipmentSchema = z.object({
  blade: z.string().trim().min(1, "ラケット名を入力してください").max(120),
  rubberFh: z.string().trim().max(120).optional().nullable(),
  rubberBh: z.string().trim().max(120).optional().nullable(),
  isCurrent: z.boolean().default(true)
});

export const practiceSchema = z.object({
  practicedAt: z.string().datetime().or(z.string().date()),
  durationMin: z.coerce.number().int().positive().max(1440),
  location: z.string().trim().max(120).optional().nullable(),
  content: z.string().trim().max(4000).optional().nullable(),
  equipmentId: z.string().uuid().optional().nullable()
});

const scoreRowSchema = z.object({
  set: z.coerce.number().int().positive(),
  me: z.coerce.number().int().min(0).max(99),
  opp: z.coerce.number().int().min(0).max(99)
});

export const matchSchema = z.object({
  playedAt: z.string().datetime().or(z.string().date()),
  opponentName: z.string().trim().min(1, "対戦相手名を入力してください").max(120),
  matchType: matchTypeSchema.default("PRACTICE"),
  scores: z.array(scoreRowSchema).min(1).max(7),
  result: matchResultSchema,
  memo: z.string().trim().max(4000).optional().nullable()
});

export type ScoreRowInput = z.infer<typeof scoreRowSchema>;
