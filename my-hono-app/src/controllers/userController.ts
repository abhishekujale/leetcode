import type { Context } from "hono"
import { sign } from "hono/jwt"
import { User } from "../models/User.js"
import { registerSchema, loginSchema } from "../validators/schemas.js"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

// --- Password helpers using Web Crypto API (PBKDF2) ---

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  )
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("")
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("")
  return `${saltHex}:${hashHex}`
}

const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [saltHex, hashHex] = stored.split(":")
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  )
  const computedHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("")
  return computedHex === hashHex
}

// POST /api/auth/register
export const registerUser = async (c: Context) => {
  try {
    const body = await c.req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }, 400)
    }

    const { username, email, password, name } = parsed.data

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return c.json({ message: "Username or email already taken" }, 409)
    }

    const hashedPassword = await hashPassword(password)
    const user = await User.create({ username, email, password: hashedPassword, name })

    const token = await sign(
      { id: user._id.toString(), username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
      JWT_SECRET, "HS256"
    )

    return c.json({ token, user: { id: user._id, username: user.username, email: user.email } }, 201)
  } catch (error) {
    console.error("Register error:", error)
    return c.json({ message: "Error registering user" }, 500)
  }
}

// POST /api/auth/login
export const loginUser = async (c: Context) => {
  try {
    const body = await c.req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }, 400)
    }

    const { email, password } = parsed.data

    const user = await User.findOne({ email })
    if (!user) {
      return c.json({ message: "Invalid credentials" }, 401)
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return c.json({ message: "Invalid credentials" }, 401)
    }

    const token = await sign(
      { id: user._id.toString(), username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
      JWT_SECRET, "HS256"
    )

    return c.json({ token, user: { id: user._id, username: user.username, email: user.email } }, 200)
  } catch (error) {
    console.error("Login error:", error)
    return c.json({ message: "Error logging in" }, 500)
  }
}

// GET /api/users/:id
export const getUserById = async (c: Context) => {
  const userId = c.req.param("id")
  try {
    const user = await User.findById(userId).select("-password")
    if (!user) return c.json({ message: "User not found" }, 404)
    return c.json(user, 200)
  } catch (error) {
    return c.json({ message: "Error retrieving user" }, 500)
  }
}

// GET /api/users
export const getAllUser = async (c: Context) => {
  try {
    const users = await User.find().select("-password")
    return c.json(users, 200)
  } catch (error) {
    return c.json({ message: "Error retrieving users" }, 500)
  }
}

// PUT /api/users/:id
export const updateUser = async (c: Context) => {
  const userId = c.req.param("id")
  try {
    const data = await c.req.json()
    delete data.password
    const user = await User.findByIdAndUpdate(userId, data, { new: true }).select("-password")
    if (!user) return c.json({ message: "User not found" }, 404)
    return c.json(user, 200)
  } catch (error) {
    return c.json({ message: "Error updating user" }, 500)
  }
}

// DELETE /api/users/:id
export const deleteUser = async (c: Context) => {
  const userId = c.req.param("id")
  try {
    const user = await User.findByIdAndDelete(userId)
    if (!user) return c.json({ message: "User not found" }, 404)
    return c.json({ message: "User deleted successfully" }, 200)
  } catch (error) {
    return c.json({ message: "Error deleting user" }, 500)
  }
}
