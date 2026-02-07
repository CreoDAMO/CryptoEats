import { reportError } from "./monitoring";

const REDIS_URL = process.env.REDIS_URL;

let redisClient: any = null;
let useMemoryFallback = true;

const memoryCache = new Map<string, { value: string; expiresAt: number }>();
const MEMORY_CACHE_MAX_SIZE = 500;

export async function initCache(): Promise<boolean> {
  if (!REDIS_URL) {
    console.log("[Cache] No REDIS_URL configured — using in-memory cache fallback");
    useMemoryFallback = true;
    return true;
  }

  try {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      connectTimeout: 5000,
      lazyConnect: true,
    });

    await redisClient.connect();

    redisClient.on("error", (err: Error) => {
      reportError(err, { service: "cache", action: "redis_error" });
    });

    useMemoryFallback = false;
    console.log("[Cache] Redis connected successfully");
    return true;
  } catch (error: any) {
    console.log("[Cache] Redis unavailable, using in-memory fallback:", error.message);
    useMemoryFallback = true;
    return true;
  }
}

function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
    const entries = [...memoryCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = entries.slice(0, Math.floor(MEMORY_CACHE_MAX_SIZE * 0.3));
    toRemove.forEach(([key]) => memoryCache.delete(key));
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    if (useMemoryFallback) {
      const entry = memoryCache.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      return entry.value;
    }
    return await redisClient.get(key);
  } catch (error: any) {
    reportError(error, { service: "cache", action: "get", key });
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
  try {
    if (useMemoryFallback) {
      cleanMemoryCache();
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return;
    }
    await redisClient.set(key, value, "EX", ttlSeconds);
  } catch (error: any) {
    reportError(error, { service: "cache", action: "set", key });
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    if (useMemoryFallback) {
      memoryCache.delete(key);
      return;
    }
    await redisClient.del(key);
  } catch (error: any) {
    reportError(error, { service: "cache", action: "del", key });
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    if (useMemoryFallback) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) memoryCache.delete(key);
      }
      return;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error: any) {
    reportError(error, { service: "cache", action: "delPattern", pattern });
  }
}

export async function getCachedMenu(restaurantId: string, fetcher: () => Promise<any>): Promise<any> {
  const key = `menu:${restaurantId}`;
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);

  const data = await fetcher();
  await cacheSet(key, JSON.stringify(data), 1800);
  return data;
}

export async function getCachedRestaurants(fetcher: () => Promise<any>): Promise<any> {
  const key = "restaurants:all";
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);

  const data = await fetcher();
  await cacheSet(key, JSON.stringify(data), 600);
  return data;
}

export async function invalidateMenuCache(restaurantId: string): Promise<void> {
  await cacheDel(`menu:${restaurantId}`);
}

export async function invalidateRestaurantsCache(): Promise<void> {
  await cacheDel("restaurants:all");
}

export function getCacheStats(): {
  type: string;
  connected: boolean;
  memoryEntries?: number;
} {
  if (useMemoryFallback) {
    return {
      type: "memory",
      connected: true,
      memoryEntries: memoryCache.size,
    };
  }
  return {
    type: "redis",
    connected: redisClient?.status === "ready",
  };
}
