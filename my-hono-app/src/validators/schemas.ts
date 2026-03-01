import { z } from "zod"

// ── Auth ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// ── Problem ───────────────────────────────────────────────────────────────

export const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([]),
  constraits: z.string().optional(),
  createdBy: z.string().min(1),
  boilerplate: z.record(z.string(), z.string()).optional(),
  driverCode: z.record(z.string(), z.string()).optional(),
})

export const updateProblemSchema = createProblemSchema.partial()

// ── Testcase ──────────────────────────────────────────────────────────────

export const createTestcaseSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  description: z.string().optional(),
  createdBy: z.string().min(1),
})

// ── Submission / Execution ────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "go",
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const submitCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.enum(SUPPORTED_LANGUAGES, {
    error: `Language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
  }),
  createdBy: z.string().min(1, "User ID is required"),
})

export const executeCodeSchema = z.object({
  code: z.string().min(1),
  language: z.enum(SUPPORTED_LANGUAGES),
})

// ── Discussion ────────────────────────────────────────────────────────────

export const createDiscussionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  createdBy: z.string().min(1),
})

export const updateDiscussionSchema = createDiscussionSchema.partial()
