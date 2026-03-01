"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Calendar, User, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchDiscussionById, fetchProblemDiscussions, type Discussion } from "@/lib/api"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function RelatedDiscussionCard({ discussion }: { discussion: Discussion }) {
  return (
    <Link href={`/discussions/${discussion._id}`}>
      <div className="rounded-md px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
        <p className="text-sm font-medium line-clamp-2 mb-1">{discussion.title}</p>
        <p className="text-xs text-muted-foreground">
          {discussion.createdBy?.username ?? "Unknown"} · {timeAgo(discussion.createdAt)}
        </p>
      </div>
    </Link>
  )
}

export default function DiscussionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [related, setRelated] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchDiscussionById(id)
      .then((data) => {
        setDiscussion(data)
        // Load related discussions for the same problem
        if (data.problem) {
          fetchProblemDiscussions(data.problem._id)
            .then((all) => setRelated(all.filter((d) => d._id !== id).slice(0, 5)))
            .catch(() => {})
        }
      })
      .catch(() => setError("Discussion not found."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="w-64 hidden lg:flex flex-col gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !discussion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">{error || "Discussion not found."}</p>
        <Button variant="outline" onClick={() => router.push("/discussions")}>
          Back to Discussions
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 -ml-1 gap-1.5 text-muted-foreground"
        onClick={() => router.push("/discussions")}
      >
        <ArrowLeft className="size-4" />
        All Discussions
      </Button>

      <div className="flex gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-3 pt-5 px-6">
              {/* Problem badge */}
              {discussion.problem && (
                <div className="mb-2">
                  <Link href={`/problems/${discussion.problem._id}`}>
                    <Badge
                      variant="secondary"
                      className="gap-1 hover:bg-accent cursor-pointer"
                    >
                      {discussion.problem.title}
                      <ExternalLink className="size-3" />
                    </Badge>
                  </Link>
                </div>
              )}

              {/* Title */}
              <h1 className="text-xl font-bold leading-snug">{discussion.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="size-3.5" />
                  <span className="font-medium text-foreground/80">
                    {discussion.createdBy?.username ?? "Unknown"}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatDate(discussion.createdAt)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <div className="border-t pt-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {discussion.content}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: related discussions */}
        {related.length > 0 && (
          <aside className="w-64 hidden lg:block shrink-0">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-orange-500" />
                  More from this problem
                </h2>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <div className="flex flex-col">
                  {related.map((d) => (
                    <RelatedDiscussionCard key={d._id} discussion={d} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>
    </div>
  )
}
