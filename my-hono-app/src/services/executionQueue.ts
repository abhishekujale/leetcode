import { Queue, Worker, QueueEvents } from "bullmq"
import { executeCode, type Language } from "./codeExecutor.js"
import { Submission } from "../models/Submission.js"
import { Testcase } from "../models/Testcase.js"
import { User } from "../models/User.js"
import { Problem } from "../models/Problem.js"
import { cacheDel } from "../config/redis.js"

const QUEUE_NAME = "code-execution"

function redisConnection() {
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null as null,
  }
}

export let executionQueue: Queue | null = null
export let queueEvents: QueueEvents | null = null

// initQueueClient initializes only the Queue (for producers/submission service).
// Call this when you need to enqueue jobs but NOT run a worker.
export function initQueueClient(): void {
  try {
    const conn = redisConnection()
    executionQueue = new Queue(QUEUE_NAME, { connection: conn })
    queueEvents = new QueueEvents(QUEUE_NAME, { connection: conn })
    console.log("✅ Code execution queue client initialized (no worker)")
  } catch (err: any) {
    console.warn("⚠️  BullMQ queue client unavailable:", err.message)
    executionQueue = null
    queueEvents = null
  }
}

// initQueue initializes the Queue + starts a Worker (for the execution service / monolith).
export function initQueue(): void {
  try {
    const conn = redisConnection()

    executionQueue = new Queue(QUEUE_NAME, { connection: conn })
    queueEvents = new QueueEvents(QUEUE_NAME, { connection: conn })

    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { submissionId, code, language, problemId, userId } = job.data

        await job.updateProgress(10)

        // Fetch testcases
        const testcases = await Testcase.find({ problem: problemId }).lean()
        if (testcases.length === 0) {
          await Submission.findByIdAndUpdate(submissionId, {
            status: "no_testcases",
            runtime: 0,
            memory: 0,
          })
          return { status: "no_testcases" }
        }

        await job.updateProgress(20)

        // Execute code
        const result = await executeCode(
          code,
          language as Language,
          testcases.map((tc) => ({ input: tc.input, output: tc.output }))
        )

        await job.updateProgress(90)

        // Update submission
        await Submission.findByIdAndUpdate(submissionId, {
          status: result.status,
          runtime: result.totalRuntime,
          memory: 0,
          testResults: result.results,
        })

        // If accepted, update user stats
        if (result.status === "accepted" && userId) {
          const problem = await Problem.findById(problemId).select("difficulty").lean()
          const points: Record<string, number> = { easy: 10, medium: 20, hard: 40 }
          const earned = points[(problem as any)?.difficulty ?? "easy"] ?? 10

          await User.findByIdAndUpdate(userId, {
            $addToSet: { solvedProblems: problemId },
            $inc: { coins: earned },
          })

          // Invalidate leaderboard cache
          await cacheDel("leaderboard")
        }

        await job.updateProgress(100)
        return result
      },
      { connection: conn, concurrency: 3 }
    )

    worker.on("failed", async (job, err) => {
      console.error(`Job ${job?.id} failed:`, err.message)
      if (job?.data?.submissionId) {
        await Submission.findByIdAndUpdate(job.data.submissionId, {
          status: "error",
        }).catch(() => {})
      }
    })

    worker.on("error", (err) => console.error("Worker error:", err.message))

    console.log("✅ Code execution queue initialized")
  } catch (err: any) {
    console.warn(
      "⚠️  BullMQ not available (Redis required) — falling back to synchronous execution:",
      err.message
    )
    executionQueue = null
    queueEvents = null
  }
}

export async function enqueueExecution(data: {
  submissionId: string
  code: string
  language: string
  problemId: string
  userId: string
}): Promise<boolean> {
  if (!executionQueue) return false
  try {
    await executionQueue.add("execute", data, {
      attempts: 2,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    })
    return true
  } catch {
    return false
  }
}
