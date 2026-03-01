"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createDiscussion } from "@/lib/api"

export default function NewDiscussionPage() {
  const { status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      const u = JSON.parse(stored)
      setUserId(u.id ?? "")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.")
      return
    }
    // if (!selectedProblem) {
    //   setError("Please select a problem.")
    //   return
    // }
    setError("")
    setSubmitting(true)
    try {
      const discussion = await createDiscussion({
        title: title.trim(),
        content: content.trim(),
        createdBy: userId,
      })
      router.push(`/discussions/${discussion._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discussion")
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 -ml-1 gap-1.5 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Start a Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Problem selector */}
            {/* <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Problem</label>
              <Select value={selectedProblem} onValueChange={setSelectedProblem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a problem..." />
                </SelectTrigger>
                <SelectContent>
                  {problems.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="What's your question or topic?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Describe your approach, question, or insight..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1" />
                    Posting...
                  </>
                ) : (
                  "Post Discussion"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
