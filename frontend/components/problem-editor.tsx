"use client"
import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Play, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { type Problem, executeCode, submitCode } from "@/lib/api"
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

const LANGUAGE_STARTERS: Record<string, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function solution(nums) {
  // Write your solution here

}`,
  typescript: `function solution(nums: number[]): number {
  // Write your solution here

}`,
  python: `class Solution:
    def solution(self, nums: list[int]) -> int:
        # Write your solution here
        pass`,
  java: `class Solution {
    public int solution(int[] nums) {
        // Write your solution here
        return 0;
    }
}`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};`,
  go: `func solution(nums []int) int {
    // Write your solution here
    return 0
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

interface TestResult {
  type: "run" | "submit"
  status: "success" | "error" | "pending"
  message: string
  details?: string
}

interface ProblemEditorProps {
  problem: Problem
}

export function ProblemEditor({ problem }: ProblemEditorProps) {
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(LANGUAGE_STARTERS.javascript)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTestPanel, setShowTestPanel] = useState(true)

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang)
    setCode(LANGUAGE_STARTERS[lang] ?? "")
    setTestResult(null)
  }, [])

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setTestResult({ type: "run", status: "pending", message: "Running against sample test cases..." })
    setShowTestPanel(true)
    try {
      const result = await executeCode(problem._id, code, language)
      setTestResult({
        type: "run",
        status: "success",
        message: result.message || "Code executed successfully",
        details: result.results ? JSON.stringify(result.results, null, 2) : undefined,
      })
    } catch (err) {
      setTestResult({
        type: "run",
        status: "error",
        message: err instanceof Error ? err.message : "Execution failed",
      })
    } finally {
      setIsRunning(false)
    }
  }, [problem._id, code, language])

  const handleSubmit = useCallback(async () => {
    const userId = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") ?? "null")?.id
      : null

    if (!userId) {
      setTestResult({ type: "submit", status: "error", message: "Please log in to submit." })
      setShowTestPanel(true)
      return
    }

    setIsSubmitting(true)
    setTestResult({ type: "submit", status: "pending", message: "Submitting solution..." })
    setShowTestPanel(true)
    try {
      const result = await submitCode(problem._id, code, language, userId)
      setTestResult({
        type: "submit",
        status: result.status === "accepted" ? "success" : "error",
        message: `Status: ${result.status}`,
        details: result.runtime ? `Runtime: ${result.runtime}ms | Memory: ${result.memory}B` : undefined,
      })
    } catch (err) {
      setTestResult({
        type: "submit",
        status: "error",
        message: err instanceof Error ? err.message : "Submission failed",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [problem._id, code, language])

  return (
    <div className="flex h-full flex-col">
      {/* Editor Toolbar */}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
          >
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

      {/* Test Results Panel */}
      <div
        className={cn(
          "border-t shrink-0 transition-all duration-200",
          showTestPanel ? "h-48" : "h-10"
        )}
      >
        <button
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          onClick={() => setShowTestPanel(!showTestPanel)}
        >
          <span className="flex items-center gap-2">
            Test Results
            {testResult && (
              <Badge
                variant={
                  testResult.status === "success"
                    ? "easy"
                    : testResult.status === "error"
                    ? "hard"
                    : "secondary"
                }
                className="text-xs"
              >
                {testResult.status === "pending"
                  ? "Running..."
                  : testResult.status === "success"
                  ? "Passed"
                  : "Failed"}
              </Badge>
            )}
          </span>
          {showTestPanel ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>

        {showTestPanel && (
          <div className="overflow-y-auto h-[calc(100%-2.5rem)] px-4 py-3">
            {!testResult ? (
              <p className="text-sm text-muted-foreground">
                Run your code to see results here.
              </p>
            ) : testResult.status === "pending" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {testResult.message}
              </div>
            ) : (
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    testResult.status === "success" ? "text-green-500" : "text-red-500"
                  )}
                >
                  {testResult.message}
                </p>
                {testResult.details && (
                  <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-auto">
                    {testResult.details}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
