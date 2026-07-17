import type { FeedbackCategory, FeedbackPlatform, FeedbackStatus } from "@table-tennis/db";

export const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  BUG: "不具合報告",
  USABILITY: "使いにくい点",
  FEATURE_REQUEST: "機能要望",
  SAFETY: "安全性・通報に関する意見",
  OTHER: "その他"
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  OPEN: "未対応",
  REVIEWING: "確認中",
  RESOLVED: "対応済み",
  CLOSED: "対応終了"
};

export const feedbackPlatformLabels: Record<FeedbackPlatform, string> = {
  WEB: "Web",
  MOBILE: "モバイル"
};

export const feedbackCategoryOptions = Object.entries(feedbackCategoryLabels).map(([value, label]) => ({
  value: value as FeedbackCategory,
  label
}));

export const feedbackStatusOptions = Object.entries(feedbackStatusLabels).map(([value, label]) => ({
  value: value as FeedbackStatus,
  label
}));

export const feedbackPlatformOptions = Object.entries(feedbackPlatformLabels).map(([value, label]) => ({
  value: value as FeedbackPlatform,
  label
}));
