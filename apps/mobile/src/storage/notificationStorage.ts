import * as SecureStore from "expo-secure-store";
import {
  defaultNotificationSettings,
  type InAppNotificationId,
  type NotificationSettings
} from "@/utils/notifications";

const notificationStateKey = "table-tennis-mobile-notification-state";
const notificationSettingsKey = "table-tennis-mobile-notification-settings";

export type NotificationState = {
  readIds: InAppNotificationId[];
  hiddenIds: InAppNotificationId[];
};

const emptyState: NotificationState = {
  readIds: [],
  hiddenIds: []
};

export async function getNotificationState(): Promise<NotificationState> {
  const stored = await SecureStore.getItemAsync(notificationStateKey);

  if (!stored) {
    return emptyState;
  }

  try {
    return normalizeState(JSON.parse(stored));
  } catch {
    return emptyState;
  }
}

export async function markNotificationAsRead(id: InAppNotificationId): Promise<NotificationState> {
  const state = await getNotificationState();
  const nextState = {
    ...state,
    readIds: uniqueIds([...state.readIds, id])
  };

  await saveNotificationState(nextState);

  return nextState;
}

export async function hideNotification(id: InAppNotificationId): Promise<NotificationState> {
  const state = await getNotificationState();
  const nextState = {
    ...state,
    hiddenIds: uniqueIds([...state.hiddenIds, id]),
    readIds: uniqueIds([...state.readIds, id])
  };

  await saveNotificationState(nextState);

  return nextState;
}

export async function markAllNotificationsAsRead(ids: InAppNotificationId[]): Promise<NotificationState> {
  const state = await getNotificationState();
  const nextState = {
    ...state,
    readIds: uniqueIds([...state.readIds, ...ids])
  };

  await saveNotificationState(nextState);

  return nextState;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const stored = await SecureStore.getItemAsync(notificationSettingsKey);

  if (!stored) {
    return defaultNotificationSettings;
  }

  try {
    return normalizeSettings(JSON.parse(stored));
  } catch {
    return defaultNotificationSettings;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await SecureStore.setItemAsync(notificationSettingsKey, JSON.stringify(settings));
}

async function saveNotificationState(state: NotificationState) {
  await SecureStore.setItemAsync(notificationStateKey, JSON.stringify(normalizeState(state)));
}

function normalizeState(value: unknown): NotificationState {
  if (!isObject(value)) {
    return emptyState;
  }

  return {
    readIds: normalizeIds(value.readIds),
    hiddenIds: normalizeIds(value.hiddenIds)
  };
}

function normalizeSettings(value: unknown): NotificationSettings {
  if (!isObject(value)) {
    return defaultNotificationSettings;
  }

  return {
    showPracticeReminder: typeof value.showPracticeReminder === "boolean" ? value.showPracticeReminder : true,
    showWeeklySummary: typeof value.showWeeklySummary === "boolean" ? value.showWeeklySummary : true,
    showAiCoachSuggestion: typeof value.showAiCoachSuggestion === "boolean" ? value.showAiCoachSuggestion : true
  };
}

function normalizeIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueIds(value.filter(isNotificationId));
}

function uniqueIds(ids: InAppNotificationId[]) {
  return [...new Set(ids)];
}

function isNotificationId(value: unknown): value is InAppNotificationId {
  return (
    value === "no-practice-3-days" ||
    value === "weekly-practice-summary" ||
    value === "recent-match-review" ||
    value === "ai-coach-suggestion" ||
    value === "create-practice-menu"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
