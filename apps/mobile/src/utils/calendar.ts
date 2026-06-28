import type { MatchRecord, PracticeLog } from "@/types";

export type CalendarPracticeItem = {
  kind: "practice";
  record: PracticeLog;
  sortTime: number;
};

export type CalendarMatchItem = {
  kind: "match";
  record: MatchRecord;
  sortTime: number;
};

export type CalendarItem = CalendarPracticeItem | CalendarMatchItem;

export type CalendarSection = {
  key: string;
  title: string;
  sortTime: number;
  items: CalendarItem[];
};

export type MonthCell = {
  key: string;
  dateKey: string | null;
  day: number | null;
};

export type RecordsByDate = Record<string, CalendarItem[]>;

export function buildCalendarSections(practiceLogs: PracticeLog[], matchRecords: MatchRecord[]): CalendarSection[] {
  const sections = new Map<string, CalendarSection>();

  practiceLogs.forEach((record) => {
    const info = dateInfo(record.practicedAt);
    const section = getSection(sections, info);
    section.items.push({ kind: "practice", record, sortTime: info.sortTime });
  });

  matchRecords.forEach((record) => {
    const info = dateInfo(record.playedAt);
    const section = getSection(sections, info);
    section.items.push({ kind: "match", record, sortTime: info.sortTime });
  });

  return Array.from(sections.values())
    .map((section) => ({
      ...section,
      items: section.items.sort((a, b) => b.sortTime - a.sortTime)
    }))
    .sort((a, b) => b.sortTime - a.sortTime);
}

export function groupRecordsByDate(practiceLogs: PracticeLog[], matchRecords: MatchRecord[]): RecordsByDate {
  const records: RecordsByDate = {};

  practiceLogs.forEach((record) => {
    const key = formatDateKey(record.practicedAt);

    if (!key) {
      return;
    }

    records[key] = records[key] ?? [];
    records[key].push({ kind: "practice", record, sortTime: dateSortTime(record.practicedAt) });
  });

  matchRecords.forEach((record) => {
    const key = formatDateKey(record.playedAt);

    if (!key) {
      return;
    }

    records[key] = records[key] ?? [];
    records[key].push({ kind: "match", record, sortTime: dateSortTime(record.playedAt) });
  });

  Object.keys(records).forEach((key) => {
    records[key] = records[key].sort((a, b) => b.sortTime - a.sortTime);
  });

  return records;
}

export function getRecordsForDate(recordsByDate: RecordsByDate, dateKey: string) {
  return recordsByDate[dateKey] ?? [];
}

export function getMonthDays(year: number, month: number): MonthCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const cells: MonthCell[] = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push({
      key: `blank-${year}-${month}-${index}`,
      dateKey: null,
      day: null
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = buildDateKey(year, month, day);
    cells.push({
      key: dateKey,
      dateKey,
      day
    });
  }

  return cells;
}

export function getCurrentMonth() {
  const now = toJstDateParts(new Date());

  return {
    year: now.year,
    month: now.monthIndex
  };
}

export function getTodayKey() {
  const now = toJstDateParts(new Date());

  return buildDateKey(now.year, now.monthIndex, now.day);
}

export function buildDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = toJstDateParts(date);
  return buildDateKey(parts.year, parts.monthIndex, parts.day);
}

export function formatDateKeyLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${year}/${month}/${day}`;
}

export function moveMonth(year: number, month: number, amount: number) {
  const next = new Date(year, month + amount, 1);

  return {
    year: next.getFullYear(),
    month: next.getMonth()
  };
}

export function clampDateKeyToMonth(dateKey: string, year: number, month: number) {
  const selectedDay = Number(dateKey.split("-")[2]);
  const day = Number.isFinite(selectedDay) && selectedDay > 0 ? selectedDay : 1;

  return buildDateKey(year, month, Math.min(day, getDaysInMonth(year, month)));
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getSection(sections: Map<string, CalendarSection>, info: DateInfo) {
  const existing = sections.get(info.key);

  if (existing) {
    return existing;
  }

  const section = {
    key: info.key,
    title: info.title,
    sortTime: info.sortTime,
    items: []
  };

  sections.set(info.key, section);
  return section;
}

type DateInfo = {
  key: string;
  title: string;
  sortTime: number;
};

function dateInfo(value: string): DateInfo {
  const dateKey = formatDateKey(value);
  const sortTime = dateSortTime(value);

  if (!dateKey || sortTime < 0) {
    return {
      key: "unknown",
      title: "日付未設定",
      sortTime: -1
    };
  }

  return {
    key: dateKey,
    title: formatDateKeyLabel(dateKey),
    sortTime
  };
}

function dateSortTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return -1;
  }

  return date.getTime();
}

function toJstDateParts(date: Date) {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  return {
    year: jstDate.getUTCFullYear(),
    monthIndex: jstDate.getUTCMonth(),
    day: jstDate.getUTCDate()
  };
}
