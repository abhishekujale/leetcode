import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import connectDB from "../../src/dbconfig.js"
import { authMiddleware } from "../../src/middlewares/authMiddleware.js"
import discussionRoutes from "../../src/routes/discussionRoutes.js"

const app = new Hono()

connectDB()

app.use("*", logger())
app.use("*", secureHeaders())
app.use("*", cors({ origin: "*" }))

app.get("/health", (c) => c.json({ status: "ok", service: "discussion-service" }))

app.use("/api/*", authMiddleware)
app.route("/api", discussionRoutes)

app.notFound((c) => c.json({ message: "Not found" }, 404))
app.onError((err, c) => {
  console.error("[DiscussionService]", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
