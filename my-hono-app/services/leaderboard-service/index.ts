import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import connectDB from "../../src/dbconfig.js"
import { authMiddleware } from "../../src/middlewares/authMiddleware.js"
import leaderboardRoutes from "../../src/routes/leaderboardRoutes.js"

const app = new Hono()

connectDB()

app.use("*", logger())
app.use("*", secureHeaders())
app.use("*", cors({ origin: "*" }))

app.get("/health", (c) => c.json({ status: "ok", service: "leaderboard-service" }))

app.use("/api/*", authMiddleware)
app.route("/api", leaderboardRoutes)

app.notFound((c) => c.json({ message: "Not found" }, 404))
app.onError((err, c) => {
  console.error("[LeaderboardService]", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
