import type { Context } from "hono"
import { Problem } from "../models/Problem.js"
import { Testcase } from "../models/Testcase.js"
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../config/redis.js"
import { createProblemSchema, updateProblemSchema, executeCodeSchema } from "../validators/schemas.js"
import { executeCode, type Language } from "../services/codeExecutor.js"

// GET /api/problems
export const getAllProblems = async (c: Context) => {
  const difficulty = c.req.query("difficulty")
  const tags = c.req.query("tags")
  const page = Math.max(1, parseInt(c.req.query("page") || "1"))
  const limit = Math.min(100, parseInt(c.req.query("limit") || "50"))

  try {
    const cacheKey = `problems:d=${difficulty ?? ""}:t=${tags ?? ""}:p=${page}:l=${limit}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      c.header("X-Cache", "HIT")
      return c.json(JSON.parse(cached), 200)
    }

    const filter: Record<string, unknown> = {}
    if (difficulty) filter.difficulty = difficulty
    if (tags) filter.tags = { $in: tags.split(",") }

    const skip = (page - 1) * limit
    const [problems, total] = await Promise.all([
      Problem.find(filter).select("-__v").skip(skip).limit(limit).sort({ createdAt: -1 }),
      Problem.countDocuments(filter),
    ])

    const result = { problems, total, page, totalPages: Math.ceil(total / limit) }
    await cacheSet(cacheKey, JSON.stringify(result), 120) // 2 min TTL
    c.header("X-Cache", "MISS")
    return c.json(result, 200)
  } catch (error) {
    console.error("getAllProblems error:", error)
    return c.json({ message: "Unable to fetch problems" }, 500)
  }
}

// GET /api/problems/:id
export const getProblemById = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const cacheKey = `problem:${id}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      c.header("X-Cache", "HIT")
      return c.json(JSON.parse(cached), 200)
    }

    const [problem, sampleTestcases] = await Promise.all([
      Problem.findById(id).lean(),
      Testcase.find({ problem: id }).limit(2).select("input output description").lean(),
    ])
    if (!problem) return c.json({ message: "Problem not found" }, 404)

    const result = { ...problem, sampleTestcases }
    await cacheSet(cacheKey, JSON.stringify(result), 300) // 5 min TTL
    c.header("X-Cache", "MISS")
    return c.json(result, 200)
  } catch (error) {
    return c.json({ message: "Unable to fetch problem" }, 500)
  }
}

// POST /api/problems
export const createProblem = async (c: Context) => {
  try {
    const body = await c.req.json()
    const parsed = createProblemSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }, 400)
    }
    const problem = await Problem.create(parsed.data)
    await cacheDelPattern("problems:*")
    return c.json(problem, 201)
  } catch (error) {
    console.error("createProblem error:", error)
    return c.json({ message: "Error creating problem" }, 500)
  }
}

// PUT /api/problems/:id
export const updateProblem = async (c: Context) => {
  const id = c.req.param("id")
  // console.log("Updating problem with ID:", id) // Debug log to check ID
  try {
    const body = await c.req.json()
    console.log("Updating problem with ID: 1", id) // Debug log to check ID

    const parsed = updateProblemSchema.safeParse(body)
    console.log("Updating problem with ID: 2", id) // Debug log to check ID

    if (!parsed.success) {
      return c.json({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }, 400)
    }
    console.log("Proble updating");
    const problem = await Problem.findByIdAndUpdate(id, parsed.data, { new: true })
    if (!problem) return c.json({ message: "Problem not found" }, 404)
    await Promise.all([cacheDel(`problem:${id}`), cacheDelPattern("problems:*")])
    return c.json(problem, 200)
  } catch (error) {
    return c.json({ message: "Error updating problem" }, 500)
  }
}

// DELETE /api/problems/:id
export const deleteProblem = async (c: Context) => {
  const id = c.req.param("id")
  try {
    const problem = await Problem.findByIdAndDelete(id)
    if (!problem) return c.json({ message: "Problem not found" }, 404)
    await Promise.all([cacheDel(`problem:${id}`), cacheDelPattern("problems:*")])
    return c.json({ message: "Problem deleted successfully" }, 200)
  } catch (error) {
    return c.json({ message: "Error deleting problem" }, 500)
  }
}

// POST /api/problems/:id/run — run against sample testcases (no submission saved)
export const runProblem = async (c: Context) => {
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

    if (sampleTestcases.length === 0) {
      return c.json({ message: "No sample testcases available for this problem" }, 422)
    }

    const driverCode = ((problem as any).driverCode as Record<string, string> | undefined)?.[language]

    const result = await executeCode(code, language as Language, sampleTestcases.map((tc) => ({ input: tc.input, output: tc.output })), driverCode)
    return c.json(result, 200)
  } catch (error) {
    console.error("runProblem error:", error)
    return c.json({ message: "Error running code" }, 500)
  }
}

// Legacy filter endpoints — kept for backward compatibility
export const getProblemsByDifficulty = async (c: Context) => {
  const difficulty = c.req.query("difficulty")
  try {
    const problems = await Problem.find({ difficulty })
    return c.json(problems, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
}

export const getProblemsByTags = async (c: Context) => {
  const tagsParam = c.req.query("tags")
  try {
    const tags = tagsParam ? tagsParam.split(",") : []
    const problems = await Problem.find({ tags: { $in: tags } })
    return c.json(problems, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
}
