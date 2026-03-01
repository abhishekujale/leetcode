/**
 * Execution Service — pure BullMQ worker, no business-logic HTTP routes.
 *
 * Responsibilities:
 *  - Dequeue code-execution jobs from Redis
 *  - Run user code in sandboxed child processes
 *  - Write results back to MongoDB (Submission collection)
 *  - Award coins / update solvedProblems on acceptance
 *  - Invalidate leaderboard cache
 *
 * Scales horizontally: run N replicas for N × 3 concurrent executions.
 */
import { Hono } from "hono"
import { logger } from "hono/logger"
import connectDB from "../../src/dbconfig.js"
import { initQueue } from "../../src/services/executionQueue.js"

const app = new Hono()

connectDB()
initQueue() // Starts the BullMQ Worker (concurrency = 3)

app.use("*", logger())

app.get("/",       (c) => c.json({ status: "ok", service: "execution-service", workers: 3 }))
app.get("/health", (c) => c.json({ status: "ok", service: "execution-service" }))

app.notFound((c) => c.json({ message: "Not found" }, 404))
app.onError((err, c) => {
  console.error("[ExecutionService]", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
