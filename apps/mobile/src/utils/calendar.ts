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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      key: "unknown",
      title: "日付未設定",
      sortTime: -1
    };
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return {
    key: `${year}-${month}-${day}`,
    title: `${year}/${month}/${day}`,
    sortTime: date.getTime()
  };
}
