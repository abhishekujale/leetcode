import type { Context } from "hono"
import { streamSSE } from "hono/streaming"
import { Submission } from "../models/Submission.js"
import { Problem } from "../models/Problem.js"
import { Testcase } from "../models/Testcase.js"
import { submitCodeSchema, executeCodeSchema } from "../validators/schemas.js"
import { executeCode, type Language } from "../services/codeExecutor.js"
import { enqueueExecution } from "../services/executionQueue.js"

// GET /api/problems/:id/submissions
export const getSubmissionsByProblem = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const submissions = await Submission.find({ problem: id })
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
    return c.json(submissions, 200)
  } catch (error) {
    return c.json({ message: "Error fetching submissions" }, 500)
  }
}

// GET /api/submissions/:id
export const getSubmissionById = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const submission = await Submission.findById(id)
      .populate("createdBy", "username email")
      .populate("problem", "title difficulty")
    if (!submission) return c.json({ message: "Submission not found" }, 404)
    return c.json(submission, 200)
  } catch (error) {
    return c.json({ message: "Error fetching submission" }, 500)
  }
}

// GET /api/users/:id/submissions
export const getSubmissionsByUser = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const submissions = await Submission.find({ createdBy: id })
      .populate("problem", "title difficulty")
      .sort({ createdAt: -1 })
    return c.json(submissions, 200)
  } catch (error) {
    return c.json({ message: "Error fetching submissions" }, 500)
  }
}

// GET /api/users/:userId/problems/:problemId/submissions
export const getSubmissionsByUserByProblem = async (c: Context) => {
  const userId = c.req.param("userId")
  const problemId = c.req.param("problemId")
  try {
    const submissions = await Submission.find({ createdBy: userId, problem: problemId })
      .sort({ createdAt: -1 })
    return c.json(submissions, 200)
  } catch (error) {
    return c.json({ message: "Error fetching submissions" }, 500)
  }
}

// GET /api/submissions?sortBy=createdAt&order=desc
export const getAllSubmissionsBySorted = async (c: Context) => {
  const sortBy = c.req.query("sortBy") || "createdAt"
  const order = c.req.query("order") === "asc" ? 1 : -1
  try {
    const submissions = await Submission.find()
      .populate("createdBy", "username email")
      .populate("problem", "title difficulty")
      .sort({ [sortBy]: order })
    return c.json(submissions, 200)
  } catch (error) {
    return c.json({ message: "Error fetching submissions" }, 500)
  }
}

// POST /api/problems/:id/execute — "Run" against sample testcases, no submission saved
export const executeProblem = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const body = await c.req.json()
    const parsed = executeCodeSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }, 400)
    }
    const { code, language } = parsed.data

    const [problem, sampleTestcases] = await Promise.all([
      Problem.findById(id).lean(),
      Testcase.find({ problem: id }).limit(2).select("input output").lean(),
    ])
    if (!problem) return c.json({ message: "Problem not found" }, 404)

    // if (sampleTestcases.length === 0) {
    //   return c.json({ message: "No sample testcases available for this problem" }, 422)
    // }

    const driverCode = ((problem as any).driverCode as Record<string, string> | undefined)?.[language]

    const result = await executeCode(code, language as Language, sampleTestcases.map((tc) => ({ input: tc.input, output: tc.output })), driverCode)
    return c.json(result, 200)
  } catch (error) {
    console.error("executeProblem error:", error)
    return c.json({ message: "Error executing code + " + error }, 500)
  }
}

// POST /api/problems/:id/submit — Submit against all testcases, save submission
export const submitProblem = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const body = await c.req.json()
    const parsed = submitCodeSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }, 400)
    }
    const { code, language, createdBy } = parsed.data

    const problem = await Problem.findById(id)
    if (!problem) return c.json({ message: "Problem not found" }, 404)

    // Create submission with pending status
    const submission = await Submission.create({
      code,
      language,
      createdBy,
      problem: id,
      status: "pending",
      runtime: 0,
      memory: 0,
    })

    const submissionId = submission._id.toString()

    const driverCode = ((problem as any).driverCode as Record<string, string> | undefined)?.[language]

    // Try async queue first; fall back to synchronous execution
    const queued = await enqueueExecution({ submissionId, code, language, problemId: id, userId: createdBy })

    if (!queued) {
      const testcases = await Testcase.find({ problem: id }).lean()
      if (testcases.length === 0) {
        await Submission.findByIdAndUpdate(submissionId, { status: "no_testcases" })
      } else {
        const result = await executeCode(
          code,
          language as Language,
          testcases.map((tc) => ({ input: tc.input, output: tc.output })),
          driverCode
        )
        await Submission.findByIdAndUpdate(submissionId, {
          status: result.status,
          runtime: result.totalRuntime,
          memory: 0,
          testResults: result.results,
        })
      }
    }

    return c.json({ submissionId, queued }, 201)
  } catch (error) {
    console.error("submitProblem error:", error)
    return c.json({ message: "Error submitting problem" }, 500)
  }
}

// GET /api/submissions/:id/status — SSE stream for real-time verdict polling
export const pollSubmissionStatus = async (c: Context) => {
  const id = c.req.param("id")
  return streamSSE(c, async (stream) => {
    const POLL_INTERVAL_MS = 500
    const MAX_WAIT_MS = 30_000
    const start = Date.now()

    while (Date.now() - start < MAX_WAIT_MS) {
      const submission = await Submission.findById(id).select("status runtime testResults").lean()

      if (!submission) {
        await stream.writeSSE({ data: JSON.stringify({ error: "Submission not found" }), event: "error" })
        break
      }

      await stream.writeSSE({
        data: JSON.stringify({
          status: submission.status,
          runtime: submission.runtime,
          testResults: submission.testResults,
        }),
        event: "update",
      })

      if (submission.status !== "pending") break
      await stream.sleep(POLL_INTERVAL_MS)
    }

    await stream.writeSSE({ data: JSON.stringify({ done: true }), event: "done" })
  })
}
