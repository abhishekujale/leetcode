const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Problem {
  _id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  description: string;
  constraits?: string;
  sampleTestcases: Testcase[];
  createdBy: string;
  createdAt: string;
  boilerplate?: Record<string, string>;
  driverCode?: Record<string, string>;
}

export interface Testcase {
  _id: string;
  input: string;
  output: string;
  description?: string;
}

export interface TestResultItem {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtime: number;
  error?: string;
}

export interface Submission {
  _id: string;
  code: string;
  language: string;
  status: string;
  runtime: number;
  memory: number;
  createdAt: string;
  problem: { _id: string; title: string; difficulty: string };
  testResults?: TestResultItem[];
}

export interface ExecutionResult {
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error" | "compilation_error";
  results: TestResultItem[];
  totalRuntime: number;
  passedCount: number;
  totalCount: number;
  message?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  name?: string;
  bio?: string;
  coins: number;
  profilePicture?: string;
  solvedProblems: string[];
  xAccount?: string;
  linkedInAccount?: string;
  isAdmin?: boolean;
}

export async function fetchProblems(params?: { difficulty?: string; tags?: string }): Promise<Problem[]> {
  const url = new URL(`${API_URL}/api/problems`);
  if (params?.difficulty) url.searchParams.set("difficulty", params.difficulty);
  if (params?.tags) url.searchParams.set("tags", params.tags);
  const res = await fetch(url.toString(), { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch problems");
  const data = await res.json();
  return data.problems ?? data;
}

export async function fetchProblemById(id: string): Promise<Problem> {
  const res = await fetch(`${API_URL}/api/problems/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch problem");
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data as { token: string; user: { id: string; username: string; email: string } };
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
  name?: string;
}) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Registration failed");
  return json as { token: string; user: { id: string; username: string; email: string } };
}

export async function submitCode(
  problemId: string,
  code: string,
  language: string,
  userId: string
): Promise<{ submissionId: string; queued: boolean }> {
  const res = await fetch(`${API_URL}/api/problems/${problemId}/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, language, createdBy: userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submission failed");
  return data;
}

export async function fetchSubmissionById(id: string): Promise<Submission> {
  const res = await fetch(`${API_URL}/api/submissions/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch submission");
  return res.json();
}

export async function executeCode(
  problemId: string,
  code: string,
  language: string
): Promise<ExecutionResult> {
  const res = await fetch(`${API_URL}/api/problems/${problemId}/execute`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, language }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Execution failed");
  return data;
}

export async function fetchUserById(id: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function fetchUserSubmissions(userId: string): Promise<Submission[]> {
  const res = await fetch(`${API_URL}/api/users/${userId}/submissions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch submissions");
  return res.json();
}

export interface Discussion {
  _id: string;
  title: string;
  content: string;
  createdBy: { _id: string; username: string; email: string };
  problem: { _id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDiscussions {
  discussions: Discussion[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchDiscussionsPaginated(
  page = 1,
  limit = 15
): Promise<PaginatedDiscussions> {
  const res = await fetch(
    `${API_URL}/api/discussions/paginate?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch discussions");
  return res.json();
}

export async function searchDiscussions(query: string): Promise<Discussion[]> {
  const url = new URL(`${API_URL}/api/discussions/search`);
  url.searchParams.set("search", query);
  const res = await fetch(url.toString(), { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to search discussions");
  return res.json();
}

export async function fetchDiscussionById(id: string): Promise<Discussion> {
  const res = await fetch(`${API_URL}/api/discussions/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch discussion");
  return res.json();
}

export async function createDiscussion(data: { title: string; content: string; createdBy: string }): Promise<Discussion> {
  const res = await fetch(`${API_URL}/api/discussions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create discussion");
  return json;
}

export async function createDiscussionForProblem(
  problemId: string,
  data: { title: string; content: string; createdBy: string }
): Promise<Discussion> {
  const res = await fetch(`${API_URL}/api/problems/${problemId}/discussions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create discussion");
  return json;
}

export async function fetchProblemDiscussions(problemId: string): Promise<Discussion[]> {
  const res = await fetch(`${API_URL}/api/problems/${problemId}/discussions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch problem discussions");
  return res.json();
}

// ── Admin APIs ─────────────────────────────────────────────────────────────

export interface TestcaseFull {
  _id: string;
  input: string;
  output: string;
  description?: string;
  problem: string;
  createdBy: string;
}

export async function adminCreateProblem(data: {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  constraits?: string;
  createdBy: string;
  boilerplate?: Record<string, string>;
  driverCode?: Record<string, string>;
}): Promise<Problem> {
  const res = await fetch(`${API_URL}/api/admin/problems`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create problem");
  return json;
}

export async function adminUpdateProblem(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    constraits: string;
    boilerplate: Record<string, string>;
    driverCode: Record<string, string>;
  }>
): Promise<Problem> {
  const res = await fetch(`${API_URL}/api/admin/problems/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update problem");
  return json;
}

export async function adminDeleteProblem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/problems/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || "Failed to delete problem");
  }
}

export async function fetchTestcasesByProblem(problemId: string): Promise<TestcaseFull[]> {
  const res = await fetch(`${API_URL}/api/problems/${problemId}/testcases`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch testcases");
  return res.json();
}

export async function adminCreateTestcase(
  problemId: string,
  data: { input: string; output: string; description?: string; createdBy: string }
): Promise<TestcaseFull> {
  const res = await fetch(`${API_URL}/api/admin/problems/${problemId}/testcases`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create testcase");
  return json;
}

export async function adminDeleteTestcase(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/testcases/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || "Failed to delete testcase");
  }
}
