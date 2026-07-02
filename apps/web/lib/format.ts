export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function toDateInputValue(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export function percentage(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}
