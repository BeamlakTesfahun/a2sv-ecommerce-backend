// src/libs/cache.ts
import { LRUCache } from "lru-cache";

export const cache = new LRUCache<string, any>({
  max: 500, // max entries
  ttl: 60_000, // 60 seconds
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

export function cacheGet<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function cacheSet<T>(key: string, value: T, ttlMs?: number): void {
  cache.set(key, value as any, { ttl: ttlMs ?? 60_000 });
}

export function cacheDelPrefix(prefix: string) {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}
