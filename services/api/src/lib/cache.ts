import { getRedis } from "./redis.js";

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = await getRedis();
  if (redis) {
    try {
      const existing = await redis.get(key);
      if (existing) return JSON.parse(existing) as T;
    } catch {
      // Redis read failed — proceed to fetcher
    }
  }
  const data = await fetcher();
  if (redis) {
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch {
      // Redis write failed — data still returned to caller
    }
  }
  return data;
}
