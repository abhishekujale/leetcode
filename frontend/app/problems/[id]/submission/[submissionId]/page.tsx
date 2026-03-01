"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Calendar,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { fetchSubmissionById, type Submission, type TestResultItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const MONACO_LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  accepted: {
    label: "Accepted",
    color: "text-emerald-500",
    icon: <CheckCircle2 className="size-6" />,
  },
  wrong_answer: {
    label: "Wrong Answer",
    color: "text-rose-500",
    icon: <XCircle className="size-6" />,
  },
  time_limit_exceeded: {
    label: "Time Limit Exceeded",
    color: "text-amber-500",
    icon: <Clock className="size-6" />,
  },
  runtime_error: {
    label: "Runtime Error",
    color: "text-rose-500",
    icon: <XCircle className="size-6" />,
  },
  compilation_error: {
    label: "Compilation Error",
    color: "text-rose-500",
    icon: <XCircle className="size-6" />,
  },
  no_testcases: {
    label: "No Testcases",
    color: "text-muted-foreground",
    icon: <XCircle className="size-6" />,
  },
  pending: {
    label: "Pending",
    color: "text-muted-foreground",
    icon: <Clock className="size-6" />,
  },
  error: {
    label: "Error",
    color: "text-rose-500",
    icon: <XCircle className="size-6" />,
  },
}

function TestCaseCard({ tc, index }: { tc: TestResultItem; index: number }) {
  const [open, setOpen] = useState(!tc.passed)

  return (
    <div className={cn("rounded-lg border overflow-hidden", tc.passed ? "border-emerald-500/30" : "border-rose-500/30")}>
      <button
        className={cn(
          "flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
          tc.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {tc.passed ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
        <span>Case {index + 1} — {tc.passed ? "Passed" : (tc.error ?? "Wrong Answer")}</span>
        <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
          <Clock className="size-3" />
          {tc.runtime}ms
        </span>
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-3 p-3 text-xs">
          <div>
            <p className="mb-1 font-medium uppercase tracking-wide text-[10px] text-muted-foreground">Input</p>
            <pre className="rounded bg-muted px-2 py-1.5 font-mono whitespace-pre-wrap break-all">{tc.input}</pre>
          </div>
          <div>
            <p className="mb-1 font-medium uppercase tracking-wide text-[10px] text-muted-foreground">Expected</p>
            <pre className="rounded bg-muted px-2 py-1.5 font-mono whitespace-pre-wrap break-all">{tc.expectedOutput}</pre>
          </div>
          <div>
            <p className="mb-1 font-medium uppercase tracking-wide text-[10px] text-muted-foreground">Got</p>
            <pre className={cn("rounded px-2 py-1.5 font-mono whitespace-pre-wrap break-all", tc.passed ? "bg-muted" : "bg-rose-500/10")}>
              {tc.actualOutput || tc.error || "—"}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function SubmissionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSubmissionById(submissionId)
      .then(setSubmission)
      .catch(() => setError("Submission not found."))
      .finally(() => setLoading(false))
  }, [submissionId])

  const statusConfig = submission
    ? (STATUS_CONFIG[submission.status] ?? { label: submission.status, color: "text-foreground", icon: null })
    : null

  const passedCount = submission?.testResults?.filter((t) => t.passed).length ?? 0
  const totalCount = submission?.testResults?.length ?? 0

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2"
            onClick={() => router.push(`/problems/${problemId}`)}
          >
            <ArrowLeft className="size-4" />
            Back to Problem
          </Button>
          {submission?.problem?.title && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground truncate">{submission.problem.title}</span>
            </>
          )}
        </div>

        {loading ? (
          <SubmissionSkeleton />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : submission ? (
          <>
            {/* Status block */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className={cn("flex items-center gap-2 text-2xl font-bold", statusConfig?.color)}>
                  {statusConfig?.icon}
                  {statusConfig?.label}
                </div>
                {totalCount > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {passedCount}/{totalCount} testcases passed
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Code2 className="size-4" />
                  <Badge variant="outline" className="font-mono text-xs capitalize">
                    {submission.language}
                  </Badge>
                </span>
                {submission.runtime > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {submission.runtime}ms
                  </span>
                )}
                {submission.memory > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Cpu className="size-4" />
                    {submission.memory}KB
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {new Date(submission.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Test Results */}
            {submission.testResults && submission.testResults.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Test Results</h2>
                <div className="space-y-2">
                  {submission.testResults.map((tc, i) => (
                    <TestCaseCard key={i} tc={tc} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Code */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Submitted Code</h2>
              <div className="rounded-lg border overflow-hidden h-[420px]">
                <MonacoEditor
                  height="420px"
                  language={MONACO_LANG_MAP[submission.language] ?? submission.language}
                  value={submission.code}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 12 },
                    lineNumbers: "on",
                    wordWrap: "on",
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
