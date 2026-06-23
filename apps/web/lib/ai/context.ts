import { prisma } from "@table-tennis/db";
import {
  calculateDifficultOpponents,
  calculateEquipmentStats,
  calculateOpponentStats,
  calculateRecentWinRateTrend,
  getChallengeMemos
} from "@/lib/analytics";
import { calculateSetCount } from "@/lib/match-record";
import type { ScoreRow } from "@/types/app";

const AGGREGATE_MATCH_LIMIT = 200;
const RECENT_LIMIT = 10;
const MENU_LIMIT = 20;
const TEXT_LIMIT = 500;

function limitText(value: string | null | undefined, max = TEXT_LIMIT) {
  if (!value) return null;

  const redacted = value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[メールアドレス]")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "[URL]")
    .replace(/(?:\+?\d[\d\s()-]{7,}\d)/g, "[電話番号]")
    .trim();

  return redacted ? redacted.slice(0, max) : null;
}

function parsedScores(value: unknown): ScoreRow[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 7).flatMap((entry) => {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as ScoreRow).set === "number" &&
      typeof (entry as ScoreRow).me === "number" &&
      typeof (entry as ScoreRow).opp === "number"
    ) {
      const score = entry as ScoreRow;
      return [{ set: score.set, me: score.me, opp: score.opp }];
    }

    return [];
  });
}

export type AiCoachContext = {
  recordCounts: {
    matches: number;
    practices: number;
    isDataSparse: boolean;
    aggregateMatchLimit: number;
  };
  recentMatches: Array<{
    playedAt: string;
    opponent: string;
    result: "WIN" | "LOSE" | "DRAW";
    setCount: string;
    scores: string[];
    memo: string | null;
    equipment: string | null;
  }>;
  recentPractices: Array<{
    practicedAt: string;
    durationMin: number;
    content: string | null;
    equipment: string | null;
    menuTitle: string | null;
  }>;
  difficultOpponents: Array<{
    opponent: string;
    matches: number;
    wins: number;
    losses: number;
    winRate: number;
    latestMemo: string | null;
  }>;
  challengeMemos: Array<{
    playedAt: string;
    opponent: string;
    result: "WIN" | "LOSE" | "DRAW";
    memo: string;
  }>;
  recentWinRateTrend: Array<{
    matchNumber: number;
    result: "WIN" | "LOSE" | "DRAW";
    cumulativeWinRate: number;
  }>;
  opponentStats: Array<{
    opponent: string;
    matches: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  equipmentStats: Array<{
    equipment: string;
    matches: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  existingPracticeMenus: Array<{
    title: string;
    goal: string | null;
    totalMinutes: number | null;
    itemCategories: string[];
  }>;
};

export type AiCoachMeta = AiCoachContext["recordCounts"];

export async function buildAiCoachContext(userId: string): Promise<AiCoachContext> {
  const [matches, practices, menus, matchCount, practiceCount] = await Promise.all([
    prisma.matchRecord.findMany({
      where: { userId },
      select: {
        id: true,
        playedAt: true,
        opponentName: true,
        opponentTeam: true,
        scores: true,
        result: true,
        memo: true,
        equipmentId: true,
        equipment: { select: { id: true, blade: true } }
      },
      orderBy: { playedAt: "desc" },
      take: AGGREGATE_MATCH_LIMIT
    }),
    prisma.practiceLog.findMany({
      where: { userId },
      select: {
        practicedAt: true,
        durationMin: true,
        content: true,
        equipment: { select: { blade: true } },
        practiceMenu: { select: { title: true } }
      },
      orderBy: { practicedAt: "desc" },
      take: RECENT_LIMIT
    }),
    prisma.practiceMenu.findMany({
      where: { userId },
      select: {
        title: true,
        goal: true,
        totalMinutes: true,
        items: {
          select: { category: true },
          orderBy: { order: "asc" },
          take: 20
        }
      },
      orderBy: { updatedAt: "desc" },
      take: MENU_LIMIT
    }),
    prisma.matchRecord.count({ where: { userId } }),
    prisma.practiceLog.count({ where: { userId } })
  ]);

  const aliases = new Map<string, string>();
  const aliasFor = (name: string, team: string | null = null) => {
    const key = `${name.trim().toLocaleLowerCase()}\u0000${team?.trim().toLocaleLowerCase() ?? ""}`;
    const existing = aliases.get(key);
    if (existing) return existing;
    const alias = `相手${aliases.size + 1}`;
    aliases.set(key, alias);
    return alias;
  };
  const anonymizeMemo = (memo: string | null, name: string, team: string | null) => {
    let text = limitText(memo);
    if (!text) return null;
    text = text.split(name).join(aliasFor(name, team));
    if (team) text = text.split(team).join("[所属]");
    return text;
  };

  matches.forEach((match) => aliasFor(match.opponentName, match.opponentTeam));
  const anonymizeKnownPeople = (value: string | null | undefined, max = TEXT_LIMIT) => {
    let text = limitText(value, max);
    if (!text) return null;

    for (const match of matches) {
      text = text.split(match.opponentName).join(aliasFor(match.opponentName, match.opponentTeam));
      if (match.opponentTeam) text = text.split(match.opponentTeam).join("[所属]");
    }

    return text;
  };
  const opponentStats = calculateOpponentStats(matches);
  const difficultOpponents = calculateDifficultOpponents(opponentStats);
  const equipmentStats = calculateEquipmentStats(matches);
  const challengeMemos = getChallengeMemos(matches, RECENT_LIMIT);
  const matchById = new Map(matches.map((match) => [match.id, match]));

  return {
    recordCounts: {
      matches: matchCount,
      practices: practiceCount,
      isDataSparse: matchCount < 3 || practiceCount < 3,
      aggregateMatchLimit: AGGREGATE_MATCH_LIMIT
    },
    recentMatches: matches.slice(0, RECENT_LIMIT).map((match) => {
      const scores = parsedScores(match.scores);
      const setCount = calculateSetCount(scores);
      return {
        playedAt: match.playedAt.toISOString().slice(0, 10),
        opponent: aliasFor(match.opponentName, match.opponentTeam),
        result: match.result,
        setCount: `${setCount.me}-${setCount.opp}`,
        scores: scores.map((score) => `${score.me}-${score.opp}`),
        memo: anonymizeMemo(match.memo, match.opponentName, match.opponentTeam),
        equipment: limitText(match.equipment?.blade, 120)
      };
    }),
    recentPractices: practices.map((practice) => ({
      practicedAt: practice.practicedAt.toISOString().slice(0, 10),
      durationMin: practice.durationMin,
      content: anonymizeKnownPeople(practice.content),
      equipment: limitText(practice.equipment?.blade, 120),
      menuTitle: anonymizeKnownPeople(practice.practiceMenu?.title, 100)
    })),
    difficultOpponents: difficultOpponents.slice(0, RECENT_LIMIT).map((opponent) => ({
      opponent: aliasFor(opponent.opponentName, opponent.opponentTeam),
      matches: opponent.totalMatches,
      wins: opponent.wins,
      losses: opponent.losses,
      winRate: opponent.winRate,
      latestMemo: anonymizeMemo(opponent.latestMemo, opponent.opponentName, opponent.opponentTeam)
    })),
    challengeMemos: challengeMemos.flatMap((memo) => {
      const match = matchById.get(memo.id);
      if (!match) return [];
      return [{
        playedAt: memo.playedAt.slice(0, 10),
        opponent: aliasFor(match.opponentName, match.opponentTeam),
        result: memo.result,
        memo: anonymizeMemo(memo.memo, match.opponentName, match.opponentTeam) ?? ""
      }];
    }),
    recentWinRateTrend: calculateRecentWinRateTrend(matches, RECENT_LIMIT).map((point) => ({
      matchNumber: point.matchNumber,
      result: point.result,
      cumulativeWinRate: point.cumulativeWinRate
    })),
    opponentStats: opponentStats.slice(0, RECENT_LIMIT).map((opponent) => ({
      opponent: aliasFor(opponent.opponentName, opponent.opponentTeam),
      matches: opponent.totalMatches,
      wins: opponent.wins,
      losses: opponent.losses,
      winRate: opponent.winRate
    })),
    equipmentStats: equipmentStats.slice(0, RECENT_LIMIT).map((equipment) => ({
      equipment: limitText(equipment.equipmentName, 120) ?? "名称未設定",
      matches: equipment.totalMatches,
      wins: equipment.wins,
      losses: equipment.losses,
      winRate: equipment.winRate
    })),
    existingPracticeMenus: menus.map((menu) => ({
      title: anonymizeKnownPeople(menu.title, 100) ?? "名称未設定",
      goal: anonymizeKnownPeople(menu.goal, 300),
      totalMinutes: menu.totalMinutes,
      itemCategories: menu.items.map((item) => item.category)
    }))
  };
}
