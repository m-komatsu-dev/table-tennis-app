import { apiRequest } from "@/api/client";
import type { ReportReason, ReportTargetType, UserBlock } from "@/types";

export type ReportInput = {
  targetType: ReportTargetType;
  targetUserId?: string;
  targetPostId?: string;
  targetRequestId?: string;
  reason: ReportReason;
  details?: string;
};

export async function createReport(input: ReportInput) {
  return apiRequest<{ message: string }>("/api/mobile/reports", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function blockUser(blockedUserId: string) {
  return apiRequest<{ ok: true }>("/api/mobile/blocks", {
    method: "POST",
    body: JSON.stringify({ blockedUserId })
  });
}

export async function fetchBlocks() {
  return apiRequest<{ blocks: UserBlock[] }>("/api/mobile/blocks");
}

export async function unblockUser(blockedUserId: string) {
  return apiRequest<{ ok: true }>(`/api/mobile/blocks/${blockedUserId}`, {
    method: "DELETE"
  });
}
