// In-memory TTL cache + in-flight request coalescing.
//
// Purpose: collapse duplicate upstream calls. If N concurrent callers ask for
// the same key, exactly one upstream request runs; the rest share its promise.
// Results are then cached for `ttlMs`.
//
// Caveat: state lives in the Node process memory. On serverless platforms
// (Vercel functions, Lambda) with many short-lived instances this still helps
// a warm instance but won't share across instances. Swap for Redis/Vercel KV
// if/when you scale horizontally.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function compositeKey(ns: string, key: string): string {
  return `${ns}::${key}`;
}

export function getCached<T>(ns: string, key: string): T | null {
  const k = compositeKey(ns, key);
  const entry = cache.get(k);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(k);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(ns: string, key: string, value: T, ttlMs: number): void {
  cache.set(compositeKey(ns, key), { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Wrap an async producer: cache its result for `ttlMs`, and coalesce concurrent
 * callers for the same key onto a single in-flight promise.
 */
export async function memoize<T>(
  ns: string,
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<T> {
  const hit = getCached<T>(ns, key);
  if (hit !== null) return hit;

  const k = compositeKey(ns, key);
  const existing = inflight.get(k) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const value = await producer();
      setCached(ns, key, value, ttlMs);
      return value;
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, promise);
  return promise;
}

/** For tests / admin — clears everything. */
export function clearCache(): void {
  cache.clear();
  inflight.clear();
}
