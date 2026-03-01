"use client"
import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Play, Send, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import {
  type Problem,
  type ExecutionResult,
  type TestResultItem,
  type Submission,
  executeCode,
  submitCode,
  fetchSubmissionById,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

// JS / TS / Python  → write only the function named "solution".
// The judge harness reads JSON args from stdin (one per line), calls solution(...args),
// and prints JSON result to stdout.
//
// Java / C++ / Go → write a full program that reads from stdin and prints to stdout.
// Input format matches what the admin configured for the testcases.

const LANGUAGE_STARTERS: Record<string, string> = {
  javascript: `// Each argument arrives as one JSON line via stdin.
// Example testcase input:
//   [2,7,11,15]
//   9
// Return value is printed as JSON automatically.

function solution(nums, target) {
  // Write your solution here

}`,

  typescript: `// Each argument arrives as one JSON line via stdin.
// Example testcase input:
//   [2,7,11,15]
//   9

function solution(nums: number[], target: number): number[] {
  // Write your solution here
  return [];
}`,

  python: `# Each argument arrives as one JSON line via stdin.
# Example testcase input:
#   [2,7,11,15]
#   9
# Return value is printed as JSON automatically.

def solution(nums, target):
    # Write your solution here
    pass`,

  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input from stdin, print result to stdout.
        // Example: int n = sc.nextInt();
        //          System.out.println(n * 2);
    }
}`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Read from stdin, print to stdout.
    // Example: int n; cin >> n; cout << n * 2 << endl;
    return 0;
}`,

  go: `package main

import "fmt"

func main() {
    // Read from stdin, print to stdout.
    // Example: var n int; fmt.Scan(&n); fmt.Println(n * 2)
}`,
}

const MONACO_LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
}

const STATUS_LABEL: Record<string, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  time_limit_exceeded: "Time Limit Exceeded",
  runtime_error: "Runtime Error",
  compilation_error: "Compilation Error",
  no_testcases: "No Testcases",
  pending: "Judging...",
  error: "Error",
}

type PanelState =
  | { mode: "idle" }
  | { mode: "pending"; label: string }
  | { mode: "run"; result: ExecutionResult }
  | { mode: "submit"; submission: Submission }

interface ProblemEditorProps {
  problem: Problem
}

function TestCaseResult({ tc, index }: { tc: TestResultItem; index: number }) {
  return (
    <div className={cn("rounded-md border text-xs overflow-hidden", tc.passed ? "border-emerald-500/30" : "border-rose-500/30")}>
      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 font-medium", tc.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
        {tc.passed
          ? <CheckCircle2 className="size-3.5" />
          : <XCircle className="size-3.5" />}
        Case {index + 1} — {tc.passed ? "Passed" : tc.error ?? "Wrong Answer"}
        <span className="ml-auto text-muted-foreground font-normal flex items-center gap-1">
          <Clock className="size-3" />{tc.runtime}ms
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-2">
        <div>
          <p className="text-muted-foreground mb-1 font-medium uppercase text-[10px] tracking-wide">Input</p>
          <pre className="bg-muted rounded px-2 py-1 whitespace-pre-wrap break-all font-mono">{tc.input}</pre>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 font-medium uppercase text-[10px] tracking-wide">Expected</p>
          <pre className="bg-muted rounded px-2 py-1 whitespace-pre-wrap break-all font-mono">{tc.expectedOutput}</pre>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 font-medium uppercase text-[10px] tracking-wide">Got</p>
          <pre className={cn("rounded px-2 py-1 whitespace-pre-wrap break-all font-mono", tc.passed ? "bg-muted" : "bg-rose-500/10")}>
            {tc.actualOutput || tc.error || "—"}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function ProblemEditor({ problem }: ProblemEditorProps) {
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(
    problem.boilerplate?.javascript ?? LANGUAGE_STARTERS.javascript
  )
  const [panel, setPanel] = useState<PanelState>({ mode: "idle" })
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTestPanel, setShowTestPanel] = useState(true)

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang)
    // Prefer problem-specific boilerplate; fall back to generic starter
    setCode(problem.boilerplate?.[lang] ?? LANGUAGE_STARTERS[lang] ?? "")
    setPanel({ mode: "idle" })
  }, [problem.boilerplate])

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setPanel({ mode: "pending", label: "Running against sample testcases..." })
    setShowTestPanel(true)
    try {
      const result = await executeCode(problem._id, code, language)
      setPanel({ mode: "run", result })
    } catch (err) {
      setPanel({
        mode: "run",
        result: {
          status: "runtime_error",
          results: [],
          totalRuntime: 0,
          passedCount: 0,
          totalCount: 0,
          message: err instanceof Error ? err.message : "Execution failed",
        },
      })
    } finally {
      setIsRunning(false)
    }
  }, [problem._id, code, language])

  const handleSubmit = useCallback(async () => {
    const userId =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") ?? "null")?.id
        : null

    if (!userId) {
      setPanel({
        mode: "submit",
        submission: { _id: "", code, language, status: "error", runtime: 0, memory: 0, createdAt: "", problem: { _id: problem._id, title: problem.title, difficulty: problem.difficulty } },
      })
      setShowTestPanel(true)
      return
    }

    setIsSubmitting(true)
    setPanel({ mode: "pending", label: "Submitting solution..." })
    setShowTestPanel(true)

    try {
      const { submissionId } = await submitCode(problem._id, code, language, userId)

      // Poll until verdict (max 30s)
      let polls = 0
      const poll = async (): Promise<void> => {
        const sub = await fetchSubmissionById(submissionId)
        if (sub.status !== "pending" || polls >= 30) {
          setPanel({ mode: "submit", submission: sub })
          setIsSubmitting(false)
          return
        }
        polls++
        await new Promise((r) => setTimeout(r, 1000))
        return poll()
      }
      await poll()
    } catch (err) {
      setPanel({
        mode: "submit",
        submission: { _id: "", code, language, status: "error", runtime: 0, memory: 0, createdAt: "", problem: { _id: problem._id, title: problem.title, difficulty: problem.difficulty } },
      })
      setIsSubmitting(false)
    }
  }, [problem._id, problem.title, problem.difficulty, code, language])

  // Derive badge for the header
  const badgeInfo = (() => {
    if (panel.mode === "idle") return null
    if (panel.mode === "pending") return { label: "Judging...", variant: "secondary" as const }
    if (panel.mode === "run") {
      const accepted = panel.result.status === "accepted"
      return {
        label: `${panel.result.passedCount}/${panel.result.totalCount} Passed`,
        variant: accepted ? ("easy" as const) : ("hard" as const),
      }
    }
    if (panel.mode === "submit") {
      const accepted = panel.submission.status === "accepted"
      return {
        label: STATUS_LABEL[panel.submission.status] ?? panel.submission.status,
        variant: accepted ? ("easy" as const) : ("hard" as const),
      }
    }
    return null
  })()

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
            <SelectItem value="go">Go</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning || isSubmitting}>
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isRunning || isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={MONACO_LANG_MAP[language]}
          value={code}
          onChange={(val) => setCode(val ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: "on",
            tabSize: 2,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Results Panel */}
      <div className={cn("border-t shrink-0 transition-all duration-200", showTestPanel ? "h-56" : "h-10")}>
        {/* Panel header toggle */}
        <button
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          onClick={() => setShowTestPanel((v) => !v)}
        >
          <span className="flex items-center gap-2">
            Test Results
            {badgeInfo && (
              <Badge variant={badgeInfo.variant} className="text-xs">
                {badgeInfo.label}
              </Badge>
            )}
          </span>
          {showTestPanel ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>

        {showTestPanel && (
          <div className="overflow-y-auto h-[calc(100%-2.5rem)] px-4 py-3 space-y-3">
            {/* idle */}
            {panel.mode === "idle" && (
              <p className="text-sm text-muted-foreground">Run your code to see results here.</p>
            )}

            {/* pending */}
            {panel.mode === "pending" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {panel.label}
              </div>
            )}

            {/* run result */}
            {panel.mode === "run" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn("font-semibold", panel.result.status === "accepted" ? "text-emerald-500" : "text-rose-500")}>
                    {STATUS_LABEL[panel.result.status] ?? panel.result.status}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {panel.result.passedCount}/{panel.result.totalCount} testcases passed · {panel.result.totalRuntime}ms
                  </span>
                </div>
                {panel.result.message && (
                  <pre className="text-xs text-rose-500 bg-rose-500/10 rounded p-2 whitespace-pre-wrap">
                    {panel.result.message}
                  </pre>
                )}
                {panel.result.results.map((tc, i) => (
                  <TestCaseResult key={i} tc={tc} index={i} />
                ))}
              </div>
            )}

            {/* submit result */}
            {panel.mode === "submit" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn("font-semibold", panel.submission.status === "accepted" ? "text-emerald-500" : "text-rose-500")}>
                    {STATUS_LABEL[panel.submission.status] ?? panel.submission.status}
                  </span>
                  {panel.submission.runtime > 0 && (
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="size-3" />{panel.submission.runtime}ms
                    </span>
                  )}
                </div>
                {panel.submission.testResults && panel.submission.testResults.length > 0 && (
                  panel.submission.testResults.map((tc, i) => (
                    <TestCaseResult key={i} tc={tc} index={i} />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
