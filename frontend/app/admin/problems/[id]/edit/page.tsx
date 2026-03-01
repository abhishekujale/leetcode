"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchProblemById, adminUpdateProblem } from "@/lib/api"

const LANGUAGES = ["javascript", "typescript", "python", "java", "cpp", "go"] as const
type Lang = (typeof LANGUAGES)[number]

const LANG_LABELS: Record<Lang, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  go: "Go",
}

export default function EditProblemPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [constraits, setConstraits] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const [boilerplate, setBoilerplate] = useState<Record<string, string>>({})
  const [driverCode, setDriverCode] = useState<Record<string, string>>({})
  const [activeLang, setActiveLang] = useState<Lang>("javascript")
  const [codeTab, setCodeTab] = useState<"boilerplate" | "driver">("boilerplate")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProblemById(id)
      .then((p) => {
        setTitle(p.title)
        setDescription(p.description)
        setDifficulty(p.difficulty)
        setConstraits(p.constraits ?? "")
        setTags(p.tags ?? [])
        setBoilerplate(p.boilerplate ?? {})
        setDriverCode(p.driverCode ?? {})
      })
      .catch(() => setError("Failed to load problem."))
      .finally(() => setLoading(false))
  }, [id])

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput("")
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await adminUpdateProblem(id, {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        tags,
        constraits: constraits.trim() || undefined,
        boilerplate,
        driverCode,
      })
      router.push("/admin/problems")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update problem")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 -ml-1 gap-1.5 text-muted-foreground"
        onClick={() => router.push("/admin/problems")}
      >
        <ArrowLeft className="size-4" />
        Back to Problems
      </Button>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Edit Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Constraints (optional)</label>
              <Textarea
                value={constraits}
                onChange={(e) => setConstraits(e.target.value)}
                rows={3}
                className="resize-none font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 pr-1">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}><X className="size-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* ── Code templates ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Code Templates</label>
              <p className="text-xs text-muted-foreground">
                <strong>Boilerplate</strong>: what the user sees in the editor.{" "}
                <strong>Driver Code</strong>: the hidden harness — use{" "}
                <code className="bg-muted px-1 rounded">{"{{USER_CODE}}"}</code> where the user&apos;s code should be injected.
              </p>

              {/* Language tabs */}
              <div className="flex gap-1 flex-wrap border-b pb-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setActiveLang(l)}
                    className={`px-3 py-1 rounded-t text-xs font-medium transition-colors ${
                      activeLang === l
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>

              {/* Boilerplate / Driver toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCodeTab("boilerplate")}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${
                    codeTab === "boilerplate"
                      ? "bg-muted border-border font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Boilerplate (user sees)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab("driver")}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${
                    codeTab === "driver"
                      ? "bg-muted border-border font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Driver Code (hidden harness)
                </button>
              </div>

              {codeTab === "boilerplate" ? (
                <Textarea
                  key={`bp-${activeLang}`}
                  value={boilerplate[activeLang] ?? ""}
                  onChange={(e) => setBoilerplate((prev) => ({ ...prev, [activeLang]: e.target.value }))}
                  rows={10}
                  className="resize-y font-mono text-xs"
                  placeholder={`Boilerplate for ${LANG_LABELS[activeLang]}...`}
                />
              ) : (
                <Textarea
                  key={`dc-${activeLang}`}
                  value={driverCode[activeLang] ?? ""}
                  onChange={(e) => setDriverCode((prev) => ({ ...prev, [activeLang]: e.target.value }))}
                  rows={10}
                  className="resize-y font-mono text-xs"
                  placeholder={`Driver code for ${LANG_LABELS[activeLang]}. Use {{USER_CODE}} as the injection point.`}
                />
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/problems")} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={submitting}>
                {submitting ? <><Loader2 className="size-4 animate-spin mr-1" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
