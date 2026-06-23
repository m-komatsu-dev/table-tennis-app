type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function removeExpiredEntries(now: number) {
  if (store.size < 1000) return;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function consumeAiRateLimit(
  key: string,
  { limit = 3, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
) {
  const now = Date.now();
  removeExpiredEntries(now);
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
