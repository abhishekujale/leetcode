import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import connectDB from "../../src/dbconfig.js"
import { authMiddleware } from "../../src/middlewares/authMiddleware.js"
import { rateLimit } from "../../src/middlewares/rateLimitMiddleware.js"
import authRoutes from "../../src/routes/authRoutes.js"
import userRoutes from "../../src/routes/userRoutes.js"

const app = new Hono()

connectDB()

app.use("*", logger())
app.use("*", secureHeaders())
app.use("*", cors({ origin: "*" })) // Gateway enforces CORS; service trusts gateway

// Strict rate-limit on auth endpoints
app.use(
  "/api/auth/*",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth", message: "Too many auth attempts" })
)

app.get("/health", (c) => c.json({ status: "ok", service: "auth-service" }))

// Public auth routes (register / login)
app.route("/api", authRoutes)

// Protected user CRUD routes
app.use("/api/users/*", authMiddleware)
app.route("/api", userRoutes)

app.notFound((c) => c.json({ message: "Not found" }, 404))
app.onError((err, c) => {
  console.error("[AuthService]", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
