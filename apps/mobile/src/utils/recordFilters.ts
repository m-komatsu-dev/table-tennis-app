import type { MatchRecord, PracticeLog } from "@/types";

export type DatePreset = "all" | "today" | "last7days" | "last30days" | "thisMonth";
export type PracticeMenuFilter = "all" | "none" | string;
export type LocationFilter = "all" | string;
export type MatchResultFilter = "all" | MatchRecord["result"];
export type MatchTypeFilter = "all" | MatchRecord["matchType"];

export const datePresetOptions: { label: string; value: DatePreset }[] = [
  { label: "全期間", value: "all" },
  { label: "今日", value: "today" },
  { label: "直近7日", value: "last7days" },
  { label: "直近30日", value: "last30days" },
  { label: "今月", value: "thisMonth" }
];

export function normalizeSearchText(value?: string | number | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function getDatePresetRange(preset: DatePreset, now = new Date()) {
  if (preset === "all") {
    return null;
  }

  const end = endOfDay(now);
  const start = startOfDay(now);

  if (preset === "last7days") {
    start.setDate(start.getDate() - 6);
  }

  if (preset === "last30days") {
    start.setDate(start.getDate() - 29);
  }

  if (preset === "thisMonth") {
    start.setDate(1);
  }

  return { start, end };
}

export function matchesDatePreset(value: string, preset: DatePreset, now = new Date()) {
  const range = getDatePresetRange(preset, now);

  if (!range) {
    return true;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date >= range.start && date <= range.end;
}

export function filterPracticeRecords(
  records: PracticeLog[],
  filters: {
    keyword: string;
    datePreset: DatePreset;
    practiceMenu: PracticeMenuFilter;
    location: LocationFilter;
  }
) {
  const keyword = normalizeSearchText(filters.keyword);

  return records.filter((record) => {
    if (!matchesDatePreset(record.practicedAt, filters.datePreset)) {
      return false;
    }

    if (filters.practiceMenu === "none" && record.practiceMenu) {
      return false;
    }

    if (filters.practiceMenu !== "all" && filters.practiceMenu !== "none" && record.practiceMenu?.title !== filters.practiceMenu) {
      return false;
    }

    if (filters.location !== "all" && record.location !== filters.location) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [record.content, record.memo, record.location, record.practiceMenu?.title]
      .map(normalizeSearchText)
      .some((value) => value.includes(keyword));
  });
}

export function filterMatchRecords(
  records: MatchRecord[],
  filters: {
    keyword: string;
    datePreset: DatePreset;
    result: MatchResultFilter;
    matchType: MatchTypeFilter;
    matchTypeLabels: Record<MatchRecord["matchType"], string>;
  }
) {
  const keyword = normalizeSearchText(filters.keyword);

  return records.filter((record) => {
    if (!matchesDatePreset(record.playedAt, filters.datePreset)) {
      return false;
    }

    if (filters.result !== "all" && record.result !== filters.result) {
      return false;
    }

    if (filters.matchType !== "all" && record.matchType !== filters.matchType) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return [record.opponentName, record.opponentTeam, record.memo, record.matchType, filters.matchTypeLabels[record.matchType]]
      .map(normalizeSearchText)
      .some((value) => value.includes(keyword));
  });
}

export function getPracticeMenuOptions(records: PracticeLog[]): { label: string; value: PracticeMenuFilter }[] {
  const names = records
    .map((record) => record.practiceMenu?.title)
    .filter((title): title is string => Boolean(title))
    .filter(unique)
    .sort((a, b) => a.localeCompare(b, "ja"));

  const hasNoMenu = records.some((record) => !record.practiceMenu);

  return [
    { label: "すべて", value: "all" },
    ...(hasNoMenu ? [{ label: "指定なし", value: "none" }] : []),
    ...names.map((name) => ({ label: name, value: name }))
  ];
}

export function getLocationOptions(records: PracticeLog[]): { label: string; value: LocationFilter }[] {
  const locations = records
    .map((record) => record.location?.trim())
    .filter((location): location is string => Boolean(location))
    .filter(unique)
    .sort((a, b) => a.localeCompare(b, "ja"));

  return [{ label: "すべて", value: "all" }, ...locations.map((location) => ({ label: location, value: location }))];
}

export function getMatchTypeOptions(
  records: MatchRecord[],
  labels: Record<MatchRecord["matchType"], string>
): { label: string; value: MatchTypeFilter }[] {
  const types = records
    .map((record) => record.matchType)
    .filter(unique)
    .sort((a, b) => labels[a].localeCompare(labels[b], "ja"));

  return [{ label: "すべて", value: "all" }, ...types.map((type) => ({ label: labels[type], value: type }))];
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function unique<T>(value: T, index: number, values: T[]) {
  return values.indexOf(value) === index;
}
