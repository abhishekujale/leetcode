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
}

export interface Testcase {
  _id: string;
  input: string;
  output: string;
  description?: string;
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
}

export async function fetchProblems(params?: { difficulty?: string; tags?: string }): Promise<Problem[]> {
  const url = new URL(`${API_URL}/api/problems`);
  if (params?.difficulty) url.searchParams.set("difficulty", params.difficulty);
  if (params?.tags) url.searchParams.set("tags", params.tags);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch problems");
  return res.json();
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
): Promise<Submission> {
  const res = await fetch(`${API_URL}/api/problems/${problemId}/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ code, language, createdBy: userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submission failed");
  return data;
}

export async function executeCode(
  problemId: string,
  code: string,
  language: string
): Promise<{ message: string; results?: unknown }> {
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
