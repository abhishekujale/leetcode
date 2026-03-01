import { spawn } from "child_process"
import { writeFileSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

export type Language = "javascript" | "typescript" | "python" | "java" | "cpp" | "go"

export interface TestResult {
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  runtime: number
  error?: string
}

export interface ExecutionResult {
  status:
    | "accepted"
    | "wrong_answer"
    | "time_limit_exceeded"
    | "runtime_error"
    | "compilation_error"
  results: TestResult[]
  totalRuntime: number
  passedCount: number
  totalCount: number
  message?: string
}

const TIMEOUT_MS = 5_000       // 5 seconds per test case
const COMPILE_TIMEOUT = 15_000 // 15 seconds for compilation

function runProcess(
  command: string,
  args: string[],
  input: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string; runtime: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    let settled = false
    const settle = <T>(fn: (v: T) => void, value: T) => {
      if (!settled) { settled = true; fn(value) }
    }

    const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""

    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      settle(reject, Object.assign(new Error("Time limit exceeded"), {
        killed: true, signal: "SIGTERM", code: "ETIMEDOUT",
      }))
    }, TIMEOUT_MS)

    child.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString() })

    child.on("close", () => {
      clearTimeout(timer)
      settle(resolve, { stdout: stdout.trim(), stderr: stderr.trim(), runtime: Date.now() - start })
    })

    child.on("error", (err) => {
      clearTimeout(timer)
      settle(reject, err)
    })

    child.stdin.write(input)
    child.stdin.end()
  })
}

function compile(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    child.on("close", (code) => {
      resolve(code === 0 ? null : stderr.trim() || "Compilation failed")
    })
    child.on("error", (err) => resolve(err.message))
    setTimeout(() => { child.kill("SIGTERM"); resolve("Compilation timed out") }, COMPILE_TIMEOUT)
  })
}

export async function executeCode(
  code: string,
  language: Language,
  testcases: Array<{ input: string; output: string }>
): Promise<ExecutionResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), "leetclone-"))

  try {
    // ── Write code & optionally compile ─────────────────────────────────
    let compilationError: string | null = null

    if (language === "java") {
      writeFileSync(join(tmpDir, "Solution.java"), code)
      compilationError = await compile("javac", [join(tmpDir, "Solution.java")])
    } else if (language === "cpp") {
      writeFileSync(join(tmpDir, "solution.cpp"), code)
      compilationError = await compile("g++", [
        "-O2", "-std=c++17",
        "-o", join(tmpDir, "solution"),
        join(tmpDir, "solution.cpp"),
      ])
    } else if (language === "typescript") {
      writeFileSync(join(tmpDir, "solution.ts"), code)
      compilationError = await compile("npx", [
        "--yes", "esbuild",
        join(tmpDir, "solution.ts"),
        "--outfile=" + join(tmpDir, "solution.js"),
        "--platform=node",
      ])
    } else {
      const exts: Record<string, string> = { javascript: ".js", python: ".py", go: ".go" }
      writeFileSync(join(tmpDir, `solution${exts[language] ?? ".txt"}`), code)
    }

    if (compilationError) {
      return {
        status: "compilation_error",
        results: [],
        totalRuntime: 0,
        passedCount: 0,
        totalCount: testcases.length,
        message: compilationError,
      }
    }

    // ── Run against each test case ───────────────────────────────────────
    const results: TestResult[] = []

    for (const tc of testcases) {
      let actualOutput = ""
      let error: string | undefined
      let runtime = 0
      let passed = false

      try {
        let res: { stdout: string; stderr: string; runtime: number }

        if (language === "javascript") {
          res = await runProcess("node", [join(tmpDir, "solution.js")], tc.input)
        } else if (language === "typescript") {
          res = await runProcess("node", [join(tmpDir, "solution.js")], tc.input)
        } else if (language === "python") {
          res = await runProcess("python3", [join(tmpDir, "solution.py")], tc.input)
        } else if (language === "java") {
          res = await runProcess("java", ["-cp", tmpDir, "Solution"], tc.input)
        } else if (language === "cpp") {
          res = await runProcess(join(tmpDir, "solution"), [], tc.input)
        } else if (language === "go") {
          res = await runProcess("go", ["run", join(tmpDir, "solution.go")], tc.input)
        } else {
          throw new Error(`Unsupported language: ${language}`)
        }

        actualOutput = res.stdout
        runtime = res.runtime
        passed = actualOutput === tc.output.trim()
      } catch (err: any) {
        if (err.killed || err.signal === "SIGTERM" || err.code === "ETIMEDOUT") {
          error = "Time Limit Exceeded"
          runtime = TIMEOUT_MS
        } else {
          error = err.stderr?.trim() || err.message || "Runtime error"
        }
        passed = false
      }

      results.push({ input: tc.input, expectedOutput: tc.output, actualOutput, passed, runtime, error })

      // Stop early on TLE or runtime error
      if (error && (error.includes("Time Limit") || !error.includes("wrong"))) {
        const remaining = testcases.slice(results.length)
        for (const r of remaining) {
          results.push({
            input: r.input,
            expectedOutput: r.output,
            actualOutput: "",
            passed: false,
            runtime: 0,
            error: "Not executed",
          })
        }
        break
      }
    }

    // ── Determine final status ───────────────────────────────────────────
    const passedCount = results.filter((r) => r.passed).length
    const hasTLE = results.some((r) => r.error?.includes("Time Limit"))
    const hasRTE = results.some(
      (r) => r.error && !r.error.includes("Time Limit") && !r.error.includes("Not executed")
    )
    const allPassed = passedCount === testcases.length

    let status: ExecutionResult["status"] = "accepted"
    if (!allPassed) {
      if (hasTLE) status = "time_limit_exceeded"
      else if (hasRTE) status = "runtime_error"
      else status = "wrong_answer"
    }

    const totalRuntime = results.length
      ? Math.round(results.reduce((s, r) => s + r.runtime, 0) / results.length)
      : 0

    return { status, results, totalRuntime, passedCount, totalCount: testcases.length }
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  }
}
