import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import connectDB from "../../src/dbconfig.js"
import { authMiddleware } from "../../src/middlewares/authMiddleware.js"
import { rateLimit } from "../../src/middlewares/rateLimitMiddleware.js"
import { initQueueClient } from "../../src/services/executionQueue.js"
import {
  executeProblem,
  submitProblem,
  getSubmissionsByProblem,
  getSubmissionById,
  getSubmissionsByUser,
  getSubmissionsByUserByProblem,
  getAllSubmissionsBySorted,
  pollSubmissionStatus,
} from "../../src/controllers/submissionController.js"

const app = new Hono()

connectDB()
initQueueClient() // Queue producer only — execution-service runs the worker

app.use("*", logger())
app.use("*", secureHeaders())
app.use("*", cors({ origin: "*" }))

app.get("/health", (c) => c.json({ status: "ok", service: "submission-service" }))

// Auth on all API routes
app.use("/api/*", authMiddleware)

// Rate limits
app.use("/api/problems/:id/execute", rateLimit({ windowMs: 60 * 60 * 1000, max: 30, keyPrefix: "execute" }))
app.use("/api/problems/:id/submit",  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyPrefix: "submit" }))

// Submission routes
const router = new Hono()

// Execute/submit (nested under /api/problems/:id)
router.post("/problems/:id/execute",    executeProblem)
router.post("/problems/:id/submit",     submitProblem)
router.get("/problems/:id/submissions", getSubmissionsByProblem)

// Direct submission retrieval
router.get("/submissions",             getAllSubmissionsBySorted)
router.get("/submissions/:id",         getSubmissionById)
router.get("/submissions/:id/status",  pollSubmissionStatus) // SSE stream

// User-specific submission queries
router.get("/users/:id/submissions",                         getSubmissionsByUser)
router.get("/users/:userId/problems/:problemId/submissions", getSubmissionsByUserByProblem)

app.route("/api", router)

app.notFound((c) => c.json({ message: "Not found" }, 404))
app.onError((err, c) => {
  console.error("[SubmissionService]", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
