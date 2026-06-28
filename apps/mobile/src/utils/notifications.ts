import type { MatchRecord, PracticeLog, PracticeMenu } from "@/types";

export type InAppNotificationId =
  | "no-practice-3-days"
  | "weekly-practice-summary"
  | "recent-match-review"
  | "ai-coach-suggestion"
  | "create-practice-menu";

export type NotificationActionTarget = "new-practice" | "analytics" | "matches" | "ai-coach" | "new-practice-menu";

export type InAppNotification = {
  id: InAppNotificationId;
  title: string;
  description: string;
  meta: string;
  actionLabel: string;
  actionTarget: NotificationActionTarget;
};

export type NotificationSettings = {
  showPracticeReminder: boolean;
  showWeeklySummary: boolean;
  showAiCoachSuggestion: boolean;
};

export const defaultNotificationSettings: NotificationSettings = {
  showPracticeReminder: true,
  showWeeklySummary: true,
  showAiCoachSuggestion: true
};

const dayMs = 24 * 60 * 60 * 1000;

export function generateInAppNotifications({
  practiceLogs,
  matchRecords,
  practiceMenus,
  settings = defaultNotificationSettings,
  now = new Date()
}: {
  practiceLogs: PracticeLog[];
  matchRecords: MatchRecord[];
  practiceMenus: PracticeMenu[];
  settings?: NotificationSettings;
  now?: Date;
}): InAppNotification[] {
  const notifications: InAppNotification[] = [];
  const threeDaysAgo = new Date(now.getTime() - 3 * dayMs);
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);
  const weekStart = startOfWeek(now);
  const recentPractices = practiceLogs.filter((practice) => parseDate(practice.practicedAt) >= threeDaysAgo);
  const weeklyPractices = practiceLogs.filter((practice) => parseDate(practice.practicedAt) >= weekStart);
  const recentMatches = matchRecords.filter((match) => parseDate(match.playedAt) >= sevenDaysAgo);

  if (settings.showPracticeReminder && recentPractices.length === 0) {
    notifications.push({
      id: "no-practice-3-days",
      title: "最近練習記録がありません",
      description: "3日以上、練習記録がありません。短時間でもよいので、今日の練習を記録してみましょう。",
      meta: "練習リマインダー",
      actionLabel: "練習を記録する",
      actionTarget: "new-practice"
    });
  }

  if (settings.showWeeklySummary && weeklyPractices.length > 0) {
    const totalMinutes = weeklyPractices.reduce((sum, practice) => sum + practice.durationMin, 0);

    notifications.push({
      id: "weekly-practice-summary",
      title: "今週の練習まとめ",
      description: `今週は合計${totalMinutes}分、${weeklyPractices.length}回練習しています。分析画面で詳しく振り返ってみましょう。`,
      meta: "今週のまとめ",
      actionLabel: "分析を見る",
      actionTarget: "analytics"
    });
  }

  if (recentMatches.length > 0) {
    notifications.push({
      id: "recent-match-review",
      title: "試合を振り返りましょう",
      description: "最近の試合記録があります。良かった点と課題をメモして、次の練習につなげましょう。",
      meta: "直近7日以内",
      actionLabel: "試合記録を見る",
      actionTarget: "matches"
    });
  }

  if (settings.showAiCoachSuggestion && practiceLogs.length + matchRecords.length > 0) {
    notifications.push({
      id: "ai-coach-suggestion",
      title: "AIコーチで振り返りできます",
      description: "最近の練習・試合をもとに、AIコーチが次の練習案を提案できます。",
      meta: "AIコーチ案内",
      actionLabel: "AIコーチを開く",
      actionTarget: "ai-coach"
    });
  }

  if (settings.showPracticeReminder && practiceMenus.length === 0) {
    notifications.push({
      id: "create-practice-menu",
      title: "練習メニューを作ってみましょう",
      description: "よく行う練習を登録しておくと、練習記録がつけやすくなります。",
      meta: "メニュー作成案内",
      actionLabel: "メニューを作成する",
      actionTarget: "new-practice-menu"
    });
  }

  return notifications;
}

export function getUnreadNotificationCount(
  notifications: InAppNotification[],
  readIds: InAppNotificationId[],
  hiddenIds: InAppNotificationId[]
) {
  return notifications.filter((notification) => !readIds.includes(notification.id) && !hiddenIds.includes(notification.id)).length;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function parseDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }

  return date;
}
