"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { fetchProblemById, fetchUserSubmissions, type Problem, type Submission } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProblemEditor } from "@/components/problem-editor"
import { cn } from "@/lib/utils"

const DIFFICULTY_VARIANT = {
  easy: "easy" as const,
  medium: "medium" as const,
  hard: "hard" as const,
}

function ProblemSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export default function ProblemPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProblemById(id)
      .then(setProblem)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))

    const user = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") ?? "null")
      : null
    if (user?.id) {
      fetchUserSubmissions(user.id)
        .then((subs) => setSubmissions(subs.filter((s) => s.problem._id === id)))
        .catch(() => {})
    }
  }, [id])

  if (error) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push("/problems")}>
          <ArrowLeft className="size-4" />
          Back to Problems
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Panel - Problem Info */}
      <div className="w-[45%] flex flex-col border-r overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-2 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/problems")}>
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Problems</span>
        </div>

        <Tabs defaultValue="description" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-4 mt-3 w-fit shrink-0">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="submissions">
              Submissions {submissions.length > 0 && `(${submissions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {isLoading ? (
              <ProblemSkeleton />
            ) : problem ? (
              <div className="space-y-5">
                {/* Title & Difficulty */}
                <div>
                  <h1 className="text-xl font-bold">{problem.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </Badge>
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {problem.description}
                  </p>
                </div>

                {/* Sample Test Cases */}
                {problem.sampleTestcases && problem.sampleTestcases.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Examples</h3>
                    {problem.sampleTestcases.map((tc, i) => (
                      <div key={tc._id} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Example {i + 1}
                          {tc.description && ` — ${tc.description}`}
                        </p>
                        <div>
                          <span className="text-xs font-medium">Input: </span>
                          <code className="text-xs bg-muted rounded px-1.5 py-0.5">{tc.input}</code>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Output: </span>
                          <code className="text-xs bg-muted rounded px-1.5 py-0.5">{tc.output}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraits && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Constraints</h3>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {problem.constraits}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="submissions" className="flex-1 overflow-y-auto px-4 py-3 mt-0">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No submissions yet. Try submitting a solution!
              </p>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div key={sub._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <p
                        className={cn(
                          "text-sm font-medium capitalize",
                          sub.status === "accepted" ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {sub.status}
                      </p>
                      <p className="text-xs text-muted-foreground">{sub.language}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      {sub.runtime > 0 && (
                        <p className="text-xs text-muted-foreground">{sub.runtime}ms</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading editor...</div>
          </div>
        ) : problem ? (
          <ProblemEditor problem={problem} />
        ) : null}
      </div>
    </div>
  )
}
