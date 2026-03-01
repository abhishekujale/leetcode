import { Redis } from "ioredis"

let redis: Redis | null = null
let connectionFailed = false

export function getRedis(): Redis | null {
  if (connectionFailed) return null
  if (redis) return redis

  try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 2) {
          connectionFailed = true
          console.warn("⚠️  Redis unavailable — caching and job queue disabled")
          return null
        }
        return Math.min(times * 300, 1000)
      },
    })

    redis.on("connect", () => console.log("✅ Connected to Redis"))
    redis.on("error", () => {
      connectionFailed = true
      redis = null
    })

    return redis
  } catch {
    connectionFailed = true
    return null
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis()
  if (!r) return null
  try {
    return await r.get(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.setex(key, ttlSeconds, value)
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.del(key)
  } catch {}
}

// Delete all keys matching a glob pattern (e.g. "problems:*")
export async function cacheDelPattern(pattern: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    const keys: string[] = []
    let cursor = "0"
    do {
      const [next, batch] = await r.scan(cursor, "MATCH", pattern, "COUNT", 100)
      cursor = next
      keys.push(...batch)
    } while (cursor !== "0")
    if (keys.length > 0) await r.del(...keys)
  } catch {}
}
