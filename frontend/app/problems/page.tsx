"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { fetchProblems, type Problem } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Difficulty = "easy" | "medium" | "hard"

const DIFF_VARIANT: Record<Difficulty, "easy" | "medium" | "hard"> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
}

const DIFF_DOT: Record<Difficulty, string> = {
  easy: "bg-green-500",
  medium: "bg-yellow-500",
  hard: "bg-red-500",
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-xl", accent)} />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground pl-3">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight pl-3">{value}</p>
    </div>
  )
}

function TableSkeleton() {
  return Array.from({ length: 8 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-72" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </TableCell>
    </TableRow>
  ))
}

export default function ProblemsPage() {
  const router = useRouter()
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")

  useEffect(() => {
    fetchProblems()
      .then(setProblems)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    problems.forEach((p) => p.tags.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [problems])

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      const matchDiff = difficulty === "all" || p.difficulty === difficulty
      const matchTag = tagFilter === "all" || p.tags.includes(tagFilter)
      return matchSearch && matchDiff && matchTag
    })
  }, [problems, search, difficulty, tagFilter])

  const stats = useMemo(() => {
    const count = (d: Difficulty) => problems.filter((p) => p.difficulty === d).length
    return {
      total: problems.length,
      easy: count("easy"),
      medium: count("medium"),
      hard: count("hard"),
    }
  }, [problems])

  const hasFilters = search || difficulty !== "all" || tagFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setDifficulty("all")
    setTagFilter("all")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Problems</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice coding challenges to level up your skills
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} accent="bg-primary/50" />
        <StatCard label="Easy" value={stats.easy} accent="bg-green-500" />
        <StatCard label="Medium" value={stats.medium} accent="bg-yellow-500" />
        <StatCard label="Hard" value={stats.hard} accent="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-14 font-semibold">#</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="w-32 font-semibold">Difficulty</TableHead>
              <TableHead className="font-semibold">Topics</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Search className="size-8 opacity-30" />
                    <p className="text-sm">No problems match your filters.</p>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs underline underline-offset-4 hover:text-foreground transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((problem, index) => (
                <TableRow
                  key={problem._id}
                  className="cursor-pointer group"
                  onClick={() => router.push(`/problems/${problem._id}`)}
                >
                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium group-hover:text-orange-500 transition-colors">
                      {problem.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          DIFF_DOT[problem.difficulty]
                        )}
                      />
                      <Badge
                        variant={DIFF_VARIANT[problem.difficulty]}
                        className="font-medium"
                      >
                        {problem.difficulty.charAt(0).toUpperCase() +
                          problem.difficulty.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{problem.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <p className="text-center text-xs text-muted-foreground">
          {filtered.length === problems.length
            ? `${problems.length} problems total`
            : `Showing ${filtered.length} of ${problems.length} problems`}
        </p>
      )}
    </div>
  )
}
