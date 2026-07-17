import { apiRequest } from "@/api/client";
import type { AppNotification } from "@/types";

export async function fetchNotifications() {
  return apiRequest<{ notifications: AppNotification[]; unreadCount: number }>("/api/mobile/notifications");
}

export async function markNotificationRead(id: string) {
  return apiRequest<{ notification: AppNotification }>(`/api/mobile/notifications/${id}/read`, {
    method: "POST"
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ ok: true }>("/api/mobile/notifications/read-all", {
    method: "POST"
  });
}
