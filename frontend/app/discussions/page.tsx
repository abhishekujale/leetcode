"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MessageSquare, Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { fetchDiscussionsPaginated, searchDiscussions, type Discussion } from "@/lib/api"

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

function DiscussionCard({ discussion }: { discussion: Discussion }) {
  return (
    <Link href={`/discussions/${discussion._id}`}>
      <Card className="hover:bg-accent/40 transition-colors cursor-pointer">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1">
              {discussion.title}
            </h3>
            {discussion.problem && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {discussion.problem.title}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {discussion.content}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">
              {discussion.createdBy?.username ?? "Unknown"}
            </span>
            <span>·</span>
            <span>{timeAgo(discussion.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DiscussionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (debouncedQuery.trim()) {
        const results = await searchDiscussions(debouncedQuery.trim())
        setDiscussions(results)
        setTotal(results.length)
        setTotalPages(1)
      } else {
        const data = await fetchDiscussionsPaginated(page, 15)
        setDiscussions(data.discussions)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch {
      setDiscussions([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery])

  useEffect(() => {
    load()
  }, [load])

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-orange-500" />
          <h1 className="text-2xl font-bold">Discussions</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground ml-1">
              ({total})
            </span>
          )}
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
          size="sm"
          onClick={() => {
            if (status !== "authenticated") {
              router.push("/login")
            } else {
              router.push("/discussions/new")
            }
          }}
        >
          <Plus className="size-4" />
          New Post
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search discussions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <MessageSquare className="size-10 opacity-30" />
          <p className="text-sm">
            {debouncedQuery ? "No discussions match your search." : "No discussions yet. Be the first to post!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {discussions.map((d) => (
            <DiscussionCard key={d._id} discussion={d} />
          ))}
        </div>
      )}

      {/* Pagination — only shown when not searching */}
      {!debouncedQuery && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
