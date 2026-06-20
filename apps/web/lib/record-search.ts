import type { Prisma } from "@table-tennis/db";
import { z } from "zod";
import { matchResultSchema, matchTypeSchema } from "./validators";

export const SEARCH_TEXT_MAX_LENGTH = 120;

export type SearchParams = Record<string, string | string[] | undefined>;

export type PracticeSearchFilters = {
  q?: string;
  location?: string;
  from?: string;
  to?: string;
};

export type MatchSearchFilters = {
  opponent?: string;
  team?: string;
  from?: string;
  to?: string;
  result?: "WIN" | "LOSE";
  type?: "PRACTICE" | "OFFICIAL";
};

const searchTextSchema = z.string().trim().min(1).max(SEARCH_TEXT_MAX_LENGTH);
const searchDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptional<T>(schema: z.ZodType<T>, value: string | string[] | undefined) {
  const rawValue = firstValue(value);
  const parsed = schema.safeParse(typeof rawValue === "string" ? rawValue.trim() : rawValue);
  return parsed.success ? parsed.data : undefined;
}

export function parsePracticeSearchParams(params: SearchParams): PracticeSearchFilters {
  return {
    q: parseOptional(searchTextSchema, params.q),
    location: parseOptional(searchTextSchema, params.location),
    from: parseOptional(searchDateSchema, params.from),
    to: parseOptional(searchDateSchema, params.to)
  };
}

export function parseMatchSearchParams(params: SearchParams): MatchSearchFilters {
  return {
    opponent: parseOptional(searchTextSchema, params.opponent),
    team: parseOptional(searchTextSchema, params.team),
    from: parseOptional(searchDateSchema, params.from),
    to: parseOptional(searchDateSchema, params.to),
    result: parseOptional(matchResultSchema, params.result),
    type: parseOptional(matchTypeSchema, params.type)
  };
}

function dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) {
    return undefined;
  }

  return {
    ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {})
  };
}

export function buildPracticeWhere(
  userId: string,
  filters: PracticeSearchFilters
): Prisma.PracticeLogWhereInput {
  const practicedAt = dateRange(filters.from, filters.to);

  return {
    userId,
    ...(practicedAt ? { practicedAt } : {}),
    ...(filters.location
      ? { location: { contains: filters.location, mode: "insensitive" } }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { content: { contains: filters.q, mode: "insensitive" } },
            { location: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

export function buildMatchWhere(
  userId: string,
  filters: MatchSearchFilters
): Prisma.MatchRecordWhereInput {
  const playedAt = dateRange(filters.from, filters.to);

  return {
    userId,
    ...(playedAt ? { playedAt } : {}),
    ...(filters.opponent
      ? { opponentName: { contains: filters.opponent, mode: "insensitive" } }
      : {}),
    ...(filters.team
      ? { opponentTeam: { contains: filters.team, mode: "insensitive" } }
      : {}),
    ...(filters.result ? { result: filters.result } : {}),
    ...(filters.type ? { matchType: filters.type } : {})
  };
}

export function hasPracticeSearchFilters(filters: PracticeSearchFilters) {
  return Object.values(filters).some(Boolean);
}

export function hasMatchSearchFilters(filters: MatchSearchFilters) {
  return Object.values(filters).some(Boolean);
}
