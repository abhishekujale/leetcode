"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, CheckCircle2, Circle } from "lucide-react"
import { fetchProblems, type Problem } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

const DIFFICULTY_COLORS = {
  easy: "easy" as const,
  medium: "medium" as const,
  hard: "hard" as const,
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
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchDifficulty = difficulty === "all" || p.difficulty === difficulty
      const matchTag = tagFilter === "all" || p.tags.includes(tagFilter)
      return matchSearch && matchDifficulty && matchTag
    })
  }, [problems, search, difficulty, tagFilter])

  const stats = useMemo(() => {
    const easy = problems.filter((p) => p.difficulty === "easy").length
    const medium = problems.filter((p) => p.difficulty === "medium").length
    const hard = problems.filter((p) => p.difficulty === "hard").length
    return { easy, medium, hard, total: problems.length }
  }, [problems])

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, className: "text-foreground" },
          { label: "Easy", value: stats.easy, className: "text-green-500" },
          { label: "Medium", value: stats.medium, className: "text-yellow-500" },
          { label: "Hard", value: stats.hard, className: "text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-3xl font-bold", stat.className)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-36">
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Difficulty</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))
              : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No problems found.
                    </TableCell>
                  </TableRow>
                )
              : filtered.map((problem, index) => (
                  <TableRow
                    key={problem._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/problems/${problem._id}`)}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium hover:text-primary transition-colors">
                      {problem.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={DIFFICULTY_COLORS[problem.difficulty]}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {problem.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{problem.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Showing {filtered.length} of {problems.length} problems
      </p>
    </div>
  )
}
