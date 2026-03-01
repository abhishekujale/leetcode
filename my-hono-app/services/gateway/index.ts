import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import type { Context } from "hono"

const app = new Hono()

// ── Service URLs (injected via env in docker-compose) ──────────────────────
const S = {
  auth:        process.env.AUTH_SERVICE_URL        || "http://localhost:3001",
  problems:    process.env.PROBLEM_SERVICE_URL     || "http://localhost:3002",
  submissions: process.env.SUBMISSION_SERVICE_URL  || "http://localhost:3004",
  discussions: process.env.DISCUSSION_SERVICE_URL  || "http://localhost:3005",
  leaderboard: process.env.LEADERBOARD_SERVICE_URL || "http://localhost:3006",
}

// ── Proxy helper ──────────────────────────────────────────────────────────
function proxy(target: string) {
  return async (c: Context) => {
    const reqUrl = new URL(c.req.url)
    const downstream = `${target}${reqUrl.pathname}${reqUrl.search}`

    const headers = new Headers(c.req.raw.headers)
    headers.delete("host")
    headers.set("x-forwarded-host", reqUrl.host)
    headers.set("x-gateway", "leetclone")

    try {
      const upstream = await fetch(downstream, {
        method: c.req.method,
        headers,
        body: ["GET", "HEAD"].includes(c.req.method) ? null : c.req.raw.body,
        // @ts-ignore — required for Node.js streaming request bodies
        duplex: "half",
      })
      // Pass body stream through (handles both JSON and SSE)
      return new Response(upstream.body, {
        status: upstream.status,
        headers: upstream.headers,
      })
    } catch (err: any) {
      console.error(`[Gateway] ${target} unreachable:`, err.message)
      return c.json({ message: "Service unavailable", upstream: target }, 503)
    }
  }
}

// ── Global middleware ──────────────────────────────────────────────────────
app.use("*", logger())
app.use(
  "*",
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// ── Health / status ────────────────────────────────────────────────────────
app.get("/", (c) =>
  c.json({ status: "ok", service: "LeetClone API Gateway", version: "1.0.0" })
)

app.get("/health", async (c) => {
  const checks: Record<string, string> = {}
  for (const [name, url] of Object.entries(S)) {
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) })
      checks[name] = res.ok ? "up" : "degraded"
    } catch {
      checks[name] = "down"
    }
  }
  return c.json({ status: "ok", services: checks })
})

// ── Specific sub-routes (register BEFORE general wildcards) ───────────────
// Submission-service-owned routes nested under /api/problems/:id
app.post("/api/problems/:id/execute",    proxy(S.submissions))
app.post("/api/problems/:id/submit",     proxy(S.submissions))
app.get("/api/problems/:id/submissions", proxy(S.submissions))

// Discussion-service-owned routes nested under /api/problems/:id
app.get("/api/problems/:id/discussions",  proxy(S.discussions))
app.post("/api/problems/:id/discussions", proxy(S.discussions))

// User sub-routes → specific service (before general /api/users/*)
app.get("/api/users/:id/submissions",                              proxy(S.submissions))
app.get("/api/users/:userId/problems/:problemId/submissions",      proxy(S.submissions))
app.get("/api/users/:id/discussions",                              proxy(S.discussions))
app.get("/api/users/:userId/problems/:problemId/discussions",      proxy(S.discussions))

// ── General service routing (wildcards) ───────────────────────────────────
app.all("/api/auth/*",        proxy(S.auth))
app.all("/api/users/*",       proxy(S.auth))
app.all("/api/problems/*",    proxy(S.problems))
app.all("/api/testcases/*",   proxy(S.problems))
app.all("/api/submissions/*", proxy(S.submissions))
app.all("/api/discussions/*", proxy(S.discussions))
app.all("/api/leaderboard/*", proxy(S.leaderboard))

// ── Fallbacks ──────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ message: `Route not found: ${c.req.method} ${c.req.path}` }, 404)
)
app.onError((err, c) => {
  console.error("[Gateway] Unhandled error:", err)
  return c.json({ message: "Gateway error" }, 500)
})

export default app
