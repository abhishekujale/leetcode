import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import connectDB from "../../src/dbconfig.js"
import { authMiddleware } from "../../src/middlewares/authMiddleware.js"
import { rateLimit } from "../../src/middlewares/rateLimitMiddleware.js"
import {
  getAllProblems,
  getProblemById,
  getProblemsByDifficulty,
  getProblemsByTags,
  createProblem,
  updateProblem,
  deleteProblem,
  runProblem,
} from "../../src/controllers/problemController.js"
import testcaseRoutes from "../../src/routes/testcaseRoutes.js"

const app = new Hono()

connectDB()

app.use("*", logger())
app.use("*", secureHeaders())
app.use("*", cors({ origin: "*" }))

app.get("/health", (c) => c.json({ status: "ok", service: "problem-service" }))

// Auth on all API routes
app.use("/api/*", authMiddleware)

// Rate-limit code runs: 30 / hour per IP
app.use(
  "/api/problems/:id/run",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 30, keyPrefix: "run" })
)

// Problem routes — excludes execute/submit (those belong to submission-service)
const router = new Hono()
router.get("/problems/filter/difficulty", getProblemsByDifficulty)
router.get("/problems/filter/tags",       getProblemsByTags)
router.get("/problems",                   getAllProblems)
router.get("/problems/:id",               getProblemById)
router.post("/problems",                  createProblem)
router.put("/problems/:id",               updateProblem)
router.delete("/problems/:id",            deleteProblem)
router.post("/problems/:id/run",          runProblem)

app.route("/api", router)
app.route("/api", testcaseRoutes)

app.notFound((c) => c.json({ message: "Not found" }, 404))
app.onError((err, c) => {
  console.error("[ProblemService]", err)
  return c.json({ message: "Internal server error" }, 500)
})

export default app
