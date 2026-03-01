"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Coins, Globe, Twitter, Linkedin, ArrowLeft, CheckCircle2 } from "lucide-react"
import { fetchUserById, fetchUserSubmissions, type User, type Submission } from "@/lib/api"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-4">
      <span className={cn("text-3xl font-bold", className)}>{value}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchUserById(id), fetchUserSubmissions(id)])
      .then(([userData, subs]) => {
        setUser(userData)
        setSubmissions(subs)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [id])

  const acceptedSubmissions = submissions.filter((s) => s.status === "accepted")
  const uniqueSolved = new Set(acceptedSubmissions.map((s) => s.problem._id)).size

  const difficultyStats = {
    easy: new Set(
      acceptedSubmissions.filter((s) => s.problem.difficulty === "easy").map((s) => s.problem._id)
    ).size,
    medium: new Set(
      acceptedSubmissions.filter((s) => s.problem.difficulty === "medium").map((s) => s.problem._id)
    ).size,
    hard: new Set(
      acceptedSubmissions.filter((s) => s.problem.difficulty === "hard").map((s) => s.problem._id)
    ).size,
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-8">
        <div className="flex gap-8">
          <div className="w-72 space-y-4">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="outline" onClick={() => router.push("/problems")}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar - User Info */}
        <aside className="md:w-72 shrink-0 space-y-4">
          <div className="flex flex-col items-center rounded-xl border bg-card p-6 gap-4">
            <Avatar
              src={user.profilePicture}
              fallback={user.username}
              size="lg"
              className="size-20 text-xl"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold">{user.name || user.username}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            {user.bio && (
              <p className="text-sm text-muted-foreground text-center border-t pt-3 w-full">
                {user.bio}
              </p>
            )}

            {/* Coins */}
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Coins className="size-4 text-yellow-500" />
              <span>{user.coins} coins</span>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 border-t pt-3 w-full justify-center">
              {user.xAccount && (
                <a
                  href={`https://x.com/${user.xAccount}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="size-4" />
                </a>
              )}
              {user.linkedInAccount && (
                <a
                  href={user.linkedInAccount}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="size-4" />
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Solved" value={uniqueSolved} className="text-primary" />
            <StatCard label="Easy" value={difficultyStats.easy} className="text-green-500" />
            <StatCard label="Medium" value={difficultyStats.medium} className="text-yellow-500" />
            <StatCard label="Hard" value={difficultyStats.hard} className="text-red-500" />
          </div>

          {/* Difficulty Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Solved by Difficulty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Easy", value: difficultyStats.easy, max: 50, className: "bg-green-500" },
                { label: "Medium", value: difficultyStats.medium, max: 100, className: "bg-yellow-500" },
                { label: "Hard", value: difficultyStats.hard, max: 50, className: "bg-red-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <Progress
                    value={item.value}
                    max={item.max}
                    indicatorClassName={item.className}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submissions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No submissions yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {submissions.slice(0, 10).map((sub) => (
                    <div key={sub._id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className={cn(
                            "size-4",
                            sub.status === "accepted" ? "text-green-500" : "text-red-500"
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">{sub.problem.title}</p>
                          <p className="text-xs text-muted-foreground">{sub.language}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={sub.status === "accepted" ? "easy" : "hard"}
                          className="text-xs"
                        >
                          {sub.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
