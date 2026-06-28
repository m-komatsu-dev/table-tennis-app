import type {
  Equipment,
  MatchRecord,
  PracticeLog,
  PracticeMenu,
  PracticeMenuItem
} from "@table-tennis/db";
import type {
  EquipmentView,
  MatchRecordView,
  PracticeLogView,
  PracticeMenuView,
  ScoreRow
} from "@/types/app";

type PracticeWithEquipment = PracticeLog & {
  equipment: Equipment | null;
  practiceMenu: Pick<PracticeMenu, "id" | "title"> | null;
};

type MatchWithEquipment = MatchRecord & {
  equipment: Equipment | null;
};

function serializeEquipment(equipment: Equipment): EquipmentView {
  return {
    id: equipment.id,
    blade: equipment.blade,
    rubberFh: equipment.rubberFh,
    rubberFhThickness: equipment.rubberFhThickness,
    rubberBh: equipment.rubberBh,
    rubberBhThickness: equipment.rubberBhThickness,
    gripType: equipment.gripType,
    isCurrent: equipment.isCurrent,
    createdAt: equipment.createdAt.toISOString(),
    updatedAt: equipment.updatedAt.toISOString()
  };
}

export function serializeEquipmentList(equipment: Equipment[]) {
  return equipment.map(serializeEquipment);
}

export function serializePractice(log: PracticeWithEquipment): PracticeLogView {
  return {
    id: log.id,
    practicedAt: log.practicedAt.toISOString(),
    durationMin: log.durationMin,
    location: log.location,
    content: log.content,
    isPublic: log.isPublic,
    equipmentId: log.equipmentId,
    equipment: log.equipment ? serializeEquipment(log.equipment) : null,
    practiceMenuId: log.practiceMenuId,
    practiceMenu: log.practiceMenu ? { id: log.practiceMenu.id, title: log.practiceMenu.title } : null
  };
}

export function serializePracticeMenu(
  menu: PracticeMenu & { items: PracticeMenuItem[] }
): PracticeMenuView {
  return {
    id: menu.id,
    title: menu.title,
    description: menu.description,
    goal: menu.goal,
    totalMinutes: menu.totalMinutes,
    isTemplate: menu.isTemplate,
    items: menu.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      durationMin: item.durationMin,
      order: item.order
    })),
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString()
  };
}

export function serializePracticeList(logs: PracticeWithEquipment[]) {
  return logs.map(serializePractice);
}

export function serializeMatch(record: MatchWithEquipment): MatchRecordView {
  return {
    id: record.id,
    playedAt: record.playedAt.toISOString(),
    equipmentId: record.equipmentId,
    equipment: record.equipment ? serializeEquipment(record.equipment) : null,
    opponentName: record.opponentName,
    opponentTeam: record.opponentTeam,
    matchType: record.matchType,
    scores: Array.isArray(record.scores) ? (record.scores as ScoreRow[]) : [],
    result: record.result,
    memo: record.memo,
    isPublic: record.isPublic
  };
}

export function serializeMatchList(records: MatchWithEquipment[]) {
  return records.map(serializeMatch);
}
