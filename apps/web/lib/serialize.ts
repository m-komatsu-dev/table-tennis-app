import type { Equipment, MatchRecord, PracticeLog } from "@table-tennis/db";
import type { EquipmentView, MatchRecordView, PracticeLogView, ScoreRow } from "@/types/app";

type PracticeWithEquipment = PracticeLog & {
  equipment: Equipment | null;
};

function serializeEquipment(equipment: Equipment): EquipmentView {
  return {
    id: equipment.id,
    blade: equipment.blade,
    rubberFh: equipment.rubberFh,
    rubberBh: equipment.rubberBh,
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

export function serializeMatch(record: MatchRecord): MatchRecordView {
  return {
    id: record.id,
    playedAt: record.playedAt.toISOString(),
    opponentName: record.opponentName,
    opponentTeam: record.opponentTeam,
    matchType: record.matchType,
    scores: Array.isArray(record.scores) ? (record.scores as ScoreRow[]) : [],
    result: record.result,
    memo: record.memo
  };
}

export function serializeMatchList(records: MatchRecord[]) {
  return records.map(serializeMatch);
}
