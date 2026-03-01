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

const TIMEOUT_MS = 5_000       // 5 s per test case
const COMPILE_TIMEOUT = 15_000 // 15 s for compilation

// ── Harness generators ────────────────────────────────────────────────────
// Convention: each argument is one JSON line in stdin.
// e.g.  twoSum([2,7,11,15], 9)  →  stdin = "[2,7,11,15]\n9\n"
//       expected stdout         =  "[0,1]"

const JS_HARNESS = `
// ── Judge harness ─────────────────────────────────────────────────────────
process.stdin.resume();
process.stdin.setEncoding("utf8");
let __inp = "";
process.stdin.on("data", d => (__inp += d));
process.stdin.on("end", () => {
  try {
    const __args = __inp.trim().split("\\n").map(l => {
      try { return JSON.parse(l); } catch { return l; }
    });
    const __res = solution(...__args);
    process.stdout.write(JSON.stringify(__res) + "\\n");
  } catch (e) {
    process.stderr.write((e instanceof Error ? e.message : String(e)) + "\\n");
    process.exit(1);
  }
});
`

const PY_HARNESS = `

# ── Judge harness ─────────────────────────────────────────────────────────
import sys as __sys
import json as __json

__lines = __sys.stdin.read().strip().split('\\n')
__args = []
for __l in __lines:
    try:
        __args.append(__json.loads(__l))
    except Exception:
        __args.append(__l)
try:
    __res = solution(*__args)
    print(__json.dumps(__res))
except Exception as __e:
    __sys.stderr.write(str(__e) + '\\n')
    __sys.exit(1)
`

function wrapWithHarness(code: string, language: Language): string {
  if (language === "javascript" || language === "typescript") {
    return code + "\n" + JS_HARNESS
  }
  if (language === "python") {
    return code + PY_HARNESS
  }
  // Java / C++ / Go — user writes the full program with their own I/O
  return code
}

// ── Output normalisation ──────────────────────────────────────────────────
// Try JSON-parse both sides so "[0,1]" == "[ 0, 1 ]"
function normalizeOutput(s: string): string {
  const t = s.trim()
  try {
    return JSON.stringify(JSON.parse(t))
  } catch {
    return t
  }
}

// ── Process runner ────────────────────────────────────────────────────────
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

// ── Compiler helper ───────────────────────────────────────────────────────
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

// ── Main executor ─────────────────────────────────────────────────────────
export async function executeCode(
  code: string,
  language: Language,
  testcases: Array<{ input: string; output: string }>,
  driverCode?: string
): Promise<ExecutionResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), "leetclone-"))

  try {
    // If the admin configured a per-problem driver code, inject user code into it.
    // Otherwise fall back to the generic harness wrapper.
    const wrapped = driverCode
      ? driverCode.replace("{{USER_CODE}}", code)
      : wrapWithHarness(code, language)
    let compilationError: string | null = null

    // Java: filename must match the public class name — detect it from the source
    let javaClassName = "Solution"

    if (language === "java") {
      const match = wrapped.match(/public\s+class\s+(\w+)/)
      if (match) javaClassName = match[1]
      const javaFile = join(tmpDir, `${javaClassName}.java`)
      writeFileSync(javaFile, wrapped)
      compilationError = await compile("javac", [javaFile])
    } else if (language === "cpp") {
      writeFileSync(join(tmpDir, "solution.cpp"), wrapped)
      compilationError = await compile("g++", [
        "-O2", "-std=c++17",
        "-o", join(tmpDir, "solution"),
        join(tmpDir, "solution.cpp"),
      ])
    } else if (language === "typescript") {
      // Write harness-wrapped TS, compile to JS, then run the JS
      writeFileSync(join(tmpDir, "solution.ts"), wrapped)
      compilationError = await compile("npx", [
        "--yes", "esbuild",
        join(tmpDir, "solution.ts"),
        "--outfile=" + join(tmpDir, "solution.js"),
        "--platform=node",
      ])
    } else if (language === "javascript") {
      writeFileSync(join(tmpDir, "solution.js"), wrapped)
    } else if (language === "python") {
      writeFileSync(join(tmpDir, "solution.py"), wrapped)
    } else if (language === "go") {
      writeFileSync(join(tmpDir, "solution.go"), wrapped)
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

    // ── Run against each test case ────────────────────────────────────────
    const results: TestResult[] = []

    for (const tc of testcases) {
      let actualOutput = ""
      let error: string | undefined
      let runtime = 0
      let passed = false

      try {
        let res: { stdout: string; stderr: string; runtime: number }

        if (language === "javascript" || language === "typescript") {
          res = await runProcess("node", [join(tmpDir, "solution.js")], tc.input)
        } else if (language === "python") {
          res = await runProcess("python3", [join(tmpDir, "solution.py")], tc.input)
        } else if (language === "java") {
          res = await runProcess("java", ["-cp", tmpDir, javaClassName], tc.input)
        } else if (language === "cpp") {
          res = await runProcess(join(tmpDir, "solution"), [], tc.input)
        } else if (language === "go") {
          res = await runProcess("go", ["run", join(tmpDir, "solution.go")], tc.input)
        } else {
          throw new Error(`Unsupported language: ${language}`)
        }

        actualOutput = res.stdout
        runtime = res.runtime

        // Warn about stderr but don't fail (some solutions print debug info)
        if (!actualOutput && res.stderr) {
          error = res.stderr
        }

        passed = normalizeOutput(actualOutput) === normalizeOutput(tc.output)
      } catch (err: any) {
        if (err.killed || err.signal === "SIGTERM" || err.code === "ETIMEDOUT") {
          error = "Time Limit Exceeded"
          runtime = TIMEOUT_MS
        } else {
          error = err.stderr?.trim() || err.message || "Runtime error"
        }
        passed = false
      }

      results.push({
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput,
        passed,
        runtime,
        ...(error ? { error } : {}),
      })

      // Stop early on TLE or runtime error
      if (error && error !== "Time Limit Exceeded" && results.length < testcases.length) {
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

    // ── Final verdict ─────────────────────────────────────────────────────
    const passedCount = results.filter((r) => r.passed).length
    const hasTLE = results.some((r) => r.error === "Time Limit Exceeded")
    const hasRTE = results.some(
      (r) => r.error && r.error !== "Time Limit Exceeded" && r.error !== "Not executed"
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
