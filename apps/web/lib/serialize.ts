import type { Equipment, MatchRecord, PracticeLog } from "@table-tennis/db";
import type { EquipmentView, MatchRecordView, PracticeLogView, ScoreRow } from "@/types/app";

type PracticeWithEquipment = PracticeLog & {
  equipment: Equipment | null;
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
    equipmentId: log.equipmentId,
    equipment: log.equipment ? serializeEquipment(log.equipment) : null
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
    memo: record.memo
  };
}

export function serializeMatchList(records: MatchWithEquipment[]) {
  return records.map(serializeMatch);
}
