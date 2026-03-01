import type { Context, Next } from "hono"
import { verify } from "hono/jwt"

const PUBLIC_PATHS = [
  "/",
  "/api/auth/register",
  "/api/auth/login",
]

export const authMiddleware = async (c: Context, next: Next) => {
  if (PUBLIC_PATHS.includes(c.req.path)) {
    return await next()
  }

  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized: no token provided" }, 401)
  }

  const token = authHeader.split(" ")[1]
  try {
    const payload = await verify(token, process.env.JWT_SECRET || "secret", "HS256")
    c.set("user", payload)
    await next()
  } catch (error) {
    return c.json({ message: "Unauthorized: invalid or expired token" }, 401)
  }
}
