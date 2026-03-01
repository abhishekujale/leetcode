"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Trophy, Coins, Medal } from "lucide-react"
import { type User } from "@/lib/api"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("token")
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="size-5 text-yellow-400" />
  if (rank === 2) return <Medal className="size-5 text-zinc-400" />
  if (rank === 3) return <Medal className="size-5 text-amber-600" />
  return <span className="text-sm font-medium text-muted-foreground">{rank}</span>
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/users`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const ranked = useMemo(() => {
    return [...users].sort((a, b) => {
      const diff = (b.solvedProblems?.length ?? 0) - (a.solvedProblems?.length ?? 0)
      if (diff !== 0) return diff
      return (b.coins ?? 0) - (a.coins ?? 0)
    })
  }, [users])

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="size-7 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Top coders ranked by problems solved
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {!isLoading && ranked.length >= 3 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[ranked[1], ranked[0], ranked[2]].map((user, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3
            const heights = ["h-24", "h-32", "h-20"]
            return (
              <div
                key={user._id}
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => router.push(`/profile/${user._id}`)}
              >
                <Avatar fallback={user.username} size="lg" />
                <p className="text-sm font-medium truncate max-w-full">{user.username}</p>
                <div
                  className={`${heights[i]} w-full rounded-t-lg flex flex-col items-center justify-center gap-1 ${
                    actualRank === 1
                      ? "bg-yellow-500/20 border-2 border-yellow-500/30"
                      : actualRank === 2
                      ? "bg-zinc-500/20 border-2 border-zinc-500/30"
                      : "bg-amber-600/20 border-2 border-amber-600/30"
                  }`}
                >
                  <RankBadge rank={actualRank} />
                  <p className="text-xs font-medium">{user.solvedProblems?.length ?? 0} solved</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right w-28">Solved</TableHead>
              <TableHead className="text-right w-24">Coins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              : ranked.map((user, index) => (
                  <TableRow
                    key={user._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/profile/${user._id}`)}
                  >
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <RankBadge rank={index + 1} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.profilePicture}
                          fallback={user.username}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          {user.name && (
                            <p className="text-xs text-muted-foreground">{user.name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">
                        {user.solvedProblems?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Coins className="size-3.5 text-yellow-500" />
                        <span className="text-sm">{user.coins ?? 0}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {ranked.length} users total
        </p>
      )}
    </div>
  )
}
