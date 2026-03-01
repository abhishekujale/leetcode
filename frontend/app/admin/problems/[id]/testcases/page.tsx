"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  fetchProblemById,
  fetchTestcasesByProblem,
  adminCreateTestcase,
  adminDeleteTestcase,
  type TestcaseFull,
  type Problem,
} from "@/lib/api"

function getStoredUserId(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("user")
  return stored ? (JSON.parse(stored).id ?? "") : ""
}

export default function TestcasesPage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [testcases, setTestcases] = useState<TestcaseFull[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // New testcase form state
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [description, setDescription] = useState("")
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    Promise.all([fetchProblemById(problemId), fetchTestcasesByProblem(problemId)])
      .then(([p, tcs]) => {
        setProblem(p)
        setTestcases(tcs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [problemId])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || !output.trim()) {
      setFormError("Input and output are required.")
      return
    }
    setFormError("")
    setAdding(true)
    try {
      const tc = await adminCreateTestcase(problemId, {
        input: input.trim(),
        output: output.trim(),
        description: description.trim() || undefined,
        createdBy: getStoredUserId(),
      })
      setTestcases((prev) => [...prev, tc])
      setInput("")
      setOutput("")
      setDescription("")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add testcase")
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testcase?")) return
    setDeleting(id)
    try {
      await adminDeleteTestcase(id)
      setTestcases((prev) => prev.filter((tc) => tc._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(null)
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

      <div className="mb-6">
        <h2 className="text-lg font-semibold">{problem?.title}</h2>
        <p className="text-sm text-muted-foreground capitalize">{problem?.difficulty}</p>
      </div>

      {/* Existing testcases */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Testcases ({testcases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Expected Output</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testcases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No testcases yet. Add one below.
                  </TableCell>
                </TableRow>
              ) : (
                testcases.map((tc, i) => (
                  <TableRow key={tc._id}>
                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                    <TableCell>
                      <pre className="text-xs bg-muted rounded px-2 py-1 max-w-40 overflow-auto">{tc.input}</pre>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs bg-muted rounded px-2 py-1 max-w-40 overflow-auto">{tc.output}</pre>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tc.description ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={deleting === tc._id}
                        onClick={() => handleDelete(tc._id)}
                      >
                        {deleting === tc._id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Trash2 className="size-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add testcase form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Plus className="size-4 text-orange-500" />
            Add Testcase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Input</label>
                <Textarea
                  placeholder="[2,7,11,15]&#10;9"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  className="resize-none font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Expected Output</label>
                <Textarea
                  placeholder="[0,1]"
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  rows={4}
                  className="resize-none font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Basic example"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                disabled={adding}
              >
                {adding ? <><Loader2 className="size-4 animate-spin" />Adding...</> : <><Plus className="size-4" />Add Testcase</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
