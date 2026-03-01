"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MessageSquare, Plus, Loader2, Clock } from "lucide-react"
import {
  fetchProblemById, fetchUserSubmissions, fetchProblemDiscussions, createDiscussionForProblem,
  type Problem, type Submission, type Discussion,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [discLoading, setDiscLoading] = useState(false)
  const [showDiscForm, setShowDiscForm] = useState(false)
  const [discTitle, setDiscTitle] = useState("")
  const [discContent, setDiscContent] = useState("")
  const [discPosting, setDiscPosting] = useState(false)
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

    setDiscLoading(true)
    fetchProblemDiscussions(id)
      .then(setDiscussions)
      .catch(() => {})
      .finally(() => setDiscLoading(false))
  }, [id])

  const handlePostDiscussion = async () => {
    if (!discTitle.trim() || !discContent.trim()) return
    const user = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") ?? "null")
      : null
    if (!user?.id) { router.push("/login"); return }
    setDiscPosting(true)
    try {
      const disc = await createDiscussionForProblem(id, {
        title: discTitle.trim(),
        content: discContent.trim(),
        createdBy: user.id,
      })
      setDiscussions((prev) => [disc, ...prev])
      setDiscTitle("")
      setDiscContent("")
      setShowDiscForm(false)
    } catch {}
    finally { setDiscPosting(false) }
  }

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
            <TabsTrigger value="discussion">
              Discussion {discussions.length > 0 && `(${discussions.length})`}
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
                      <div key={tc._id} className="rounded-lg border bg-muted/30 overflow-hidden">
                        <div className="px-4 py-2 border-b bg-muted/50">
                          <span className="text-xs font-semibold">Example {i + 1}</span>
                          {tc.description && (
                            <span className="text-xs text-muted-foreground ml-2">— {tc.description}</span>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input</p>
                            <pre className="text-xs bg-background border rounded-md px-3 py-2 font-mono whitespace-pre-wrap break-all">
                              {tc.input}
                            </pre>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output</p>
                            <pre className="text-xs bg-background border rounded-md px-3 py-2 font-mono whitespace-pre-wrap break-all">
                              {tc.output}
                            </pre>
                          </div>
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
                  <button
                    key={sub._id}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/problems/${id}/submission/${sub._id}`)}
                  >
                    <div className="space-y-0.5">
                      <p
                        className={cn(
                          "text-sm font-medium capitalize",
                          sub.status === "accepted" ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        {sub.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{sub.language}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      {sub.runtime > 0 && (
                        <p className="text-xs text-muted-foreground">{sub.runtime}ms</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Discussion tab ─────────────────────────────────────── */}
          <TabsContent value="discussion" className="flex-1 overflow-y-auto px-4 py-3 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {discussions.length} discussion{discussions.length !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setShowDiscForm((v) => !v)}
              >
                <Plus className="size-3" />
                New
              </Button>
            </div>

            {/* Inline post form */}
            {showDiscForm && (
              <div className="mb-4 rounded-lg border p-3 space-y-2 bg-muted/30">
                <Input
                  placeholder="Title"
                  value={discTitle}
                  onChange={(e) => setDiscTitle(e.target.value)}
                  className="h-8 text-sm"
                />
                <Textarea
                  placeholder="Share your approach, question, or insight..."
                  value={discContent}
                  onChange={(e) => setDiscContent(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowDiscForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handlePostDiscussion}
                    disabled={discPosting || !discTitle.trim() || !discContent.trim()}
                  >
                    {discPosting ? <Loader2 className="size-3 animate-spin" /> : "Post"}
                  </Button>
                </div>
              </div>
            )}

            {discLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : discussions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <MessageSquare className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No discussions yet.</p>
                <p className="text-xs text-muted-foreground">Be the first to share an approach!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {discussions.map((disc) => (
                  <button
                    key={disc._id}
                    className="flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => router.push(`/discussions/${disc._id}`)}
                  >
                    <p className="text-sm font-medium line-clamp-1">{disc.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{disc.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span>{disc.createdBy?.username ?? "Unknown"}</span>
                      <span>·</span>
                      <Clock className="size-3" />
                      <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
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
