"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { adminCreateProblem } from "@/lib/api"

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

const DEFAULT_BOILERPLATE: Record<Lang, string> = {
  javascript: `function solution(nums, target) {\n  // Write your solution here\n}`,
  typescript: `function solution(nums: number[], target: number): number[] {\n  // Write your solution here\n  return [];\n}`,
  python: `def solution(nums, target):\n    # Write your solution here\n    pass`,
  java: `// Write your solution method here (no class/main needed)\npublic int[] twoSum(int[] nums, int target) {\n    // your code\n    return new int[]{};\n}`,
  cpp: `// Write your solution function here\n// (No need for #include or main — the judge handles that)\n\nvector<int> solution() {\n    // your code\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Read from stdin, print to stdout\n    _ = fmt.Println\n}`,
}

const DEFAULT_DRIVER: Record<Lang, string> = {
  javascript: `{{USER_CODE}}\n\n// ── Judge harness ─────────────────────────────────────────────────\nprocess.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet __inp = "";\nprocess.stdin.on("data", d => (__inp += d));\nprocess.stdin.on("end", () => {\n  try {\n    const __args = __inp.trim().split("\\n").map(l => {\n      try { return JSON.parse(l); } catch { return l; }\n    });\n    const __res = solution(...__args);\n    process.stdout.write(JSON.stringify(__res) + "\\n");\n  } catch (e) {\n    process.stderr.write((e instanceof Error ? e.message : String(e)) + "\\n");\n    process.exit(1);\n  }\n});`,
  typescript: `{{USER_CODE}}\n\n// ── Judge harness ─────────────────────────────────────────────────\nprocess.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet __inp = "";\nprocess.stdin.on("data", (d: string) => (__inp += d));\nprocess.stdin.on("end", () => {\n  try {\n    const __args = __inp.trim().split("\\n").map((l: string) => {\n      try { return JSON.parse(l); } catch { return l; }\n    });\n    const __res = solution(...(__args as any));\n    process.stdout.write(JSON.stringify(__res) + "\\n");\n  } catch (e: any) {\n    process.stderr.write((e.message ?? String(e)) + "\\n");\n    process.exit(1);\n  }\n});`,
  python: `{{USER_CODE}}\n\n# ── Judge harness ─────────────────────────────────────────────────\nimport sys as __sys\nimport json as __json\n__lines = __sys.stdin.read().strip().split('\\n')\n__args = []\nfor __l in __lines:\n    try:\n        __args.append(__json.loads(__l))\n    except Exception:\n        __args.append(__l)\ntry:\n    __res = solution(*__args)\n    print(__json.dumps(__res))\nexcept Exception as __e:\n    __sys.stderr.write(str(__e) + '\\n')\n    __sys.exit(1)`,
  java: `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    {{USER_CODE}}\n\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        // Read input, call method, print result\n        // Example for twoSum:\n        // int n = sc.nextInt();\n        // int[] nums = new int[n];\n        // for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // int target = sc.nextInt();\n        // Solution sol = new Solution();\n        // int[] res = sol.twoSum(nums, target);\n        // System.out.println(res[0] + \" \" + res[1]);\n    }\n}`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // Read input, call your function, print result\n    return 0;\n}`,
  go: `{{USER_CODE}}`,
}

function getStoredUserId(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("user")
  return stored ? (JSON.parse(stored).id ?? "") : ""
}

export default function NewProblemPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [constraits, setConstraits] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // Per-language boilerplate (shown in editor) and driver code (hidden harness)
  const [boilerplate, setBoilerplate] = useState<Record<string, string>>(
    Object.fromEntries(LANGUAGES.map((l) => [l, DEFAULT_BOILERPLATE[l]]))
  )
  const [driverCode, setDriverCode] = useState<Record<string, string>>(
    Object.fromEntries(LANGUAGES.map((l) => [l, DEFAULT_DRIVER[l]]))
  )

  const [activeLang, setActiveLang] = useState<Lang>("javascript")
  const [codeTab, setCodeTab] = useState<"boilerplate" | "driver">("boilerplate")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

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
      const problem = await adminCreateProblem({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        tags,
        constraits: constraits.trim() || undefined,
        createdBy: getStoredUserId(),
        boilerplate,
        driverCode,
      })
      router.push(`/admin/problems/${problem._id}/testcases`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create problem")
      setSubmitting(false)
    }
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
          <CardTitle>Create Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Two Sum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                placeholder="Describe the problem statement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Constraints (optional)</label>
              <Textarea
                placeholder="1 ≤ n ≤ 10^5&#10;-10^9 ≤ nums[i] ≤ 10^9"
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
                  placeholder="array, hash-map, ..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 pr-1">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}>
                        <X className="size-3" />
                      </button>
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
                {submitting ? <><Loader2 className="size-4 animate-spin mr-1" />Creating...</> : "Create & Add Testcases"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
