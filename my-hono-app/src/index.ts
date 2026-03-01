import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import connectDB from "./dbconfig.js"
import { initQueue } from "./services/executionQueue.js"
import { authMiddleware } from "./middlewares/authMiddleware.js"
import { rateLimit } from "./middlewares/rateLimitMiddleware.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import problemRoutes from "./routes/problemRoutes.js"
import testcaseRoutes from "./routes/testcaseRoutes.js"
import submissionRoutes from "./routes/submissionRoutes.js"
import discussionRoutes from "./routes/discussionRoutes.js"
import leaderboardRoutes from "./routes/leaderboardRoutes.js"

const app = new Hono()

// ── Bootstrap ──────────────────────────────────────────────────────────────
connectDB()
initQueue()

// ── Global middleware ──────────────────────────────────────────────────────
app.use("*", logger())
app.use("*", secureHeaders())
app.use(
  "*",
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// 200 requests / 15 min per IP (global)
app.use("*", rateLimit({ windowMs: 15 * 60 * 1000, max: 200, keyPrefix: "global" }))

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", service: "LeetClone API", version: "1.0.0" }))

// ── Auth routes — rate-limited & public ───────────────────────────────────
// 10 auth attempts / 15 min per IP
app.use(
  "/api/auth/*",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many auth requests. Please try again in 15 minutes.",
    keyPrefix: "auth",
  })
)
app.route("/api", authRoutes)

// ── Auth middleware for all routes below ──────────────────────────────────
app.use("/api/*", authMiddleware)

// ── Code execution rate limits (before route registration) ────────────────
// 30 runs / hour per IP
app.use(
  "/api/problems/:id/execute",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 30, message: "Too many code runs. Slow down.", keyPrefix: "execute" })
)
app.use(
  "/api/problems/:id/run",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 30, message: "Too many code runs. Slow down.", keyPrefix: "run" })
)
// 20 submissions / hour per IP
app.use(
  "/api/problems/:id/submit",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: "Too many submissions. Slow down.", keyPrefix: "submit" })
)

// ── Protected routes ───────────────────────────────────────────────────────
app.route("/api", userRoutes)
app.route("/api", problemRoutes)
app.route("/api", testcaseRoutes)
app.route("/api", submissionRoutes)
app.route("/api", discussionRoutes)
app.route("/api", leaderboardRoutes)

// ── 404 handler ────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ message: `Route ${c.req.method} ${c.req.path} not found` }, 404))

// ── Global error handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("Unhandled error:", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
