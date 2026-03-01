import type { Context, Next } from "hono"

interface RateLimitEntry {
  count: number
  resetTime: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const store of stores.values()) {
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  windowMs: number
  max: number
  message?: string
  keyPrefix?: string
}

export function rateLimit(options: RateLimitOptions) {
  const storeKey = options.keyPrefix ?? "default"
  if (!stores.has(storeKey)) stores.set(storeKey, new Map())
  const store = stores.get(storeKey)!

  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "unknown"

    const now = Date.now()
    const entry = store.get(ip)

    if (!entry || now > entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + options.windowMs })
      c.header("X-RateLimit-Limit", String(options.max))
      c.header("X-RateLimit-Remaining", String(options.max - 1))
      return next()
    }

    if (entry.count >= options.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      c.header("X-RateLimit-Limit", String(options.max))
      c.header("X-RateLimit-Remaining", "0")
      c.header("Retry-After", String(retryAfter))
      return c.json(
        { message: options.message ?? "Too many requests. Please try again later." },
        429
      )
    }

    entry.count++
    c.header("X-RateLimit-Limit", String(options.max))
    c.header("X-RateLimit-Remaining", String(options.max - entry.count))
    return next()
  }
}
