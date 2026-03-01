import type { Context, Next } from "hono"
import { verify } from "hono/jwt"

export const adminMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401)
  }

  const token = authHeader.split(" ")[1]
  try {
    const payload = await verify(token, process.env.JWT_SECRET || "secret", "HS256")
    if (!payload.isAdmin) {
      return c.json({ message: "Forbidden: admin access required" }, 403)
    }
    c.set("user", payload)
    await next()
  } catch {
    return c.json({ message: "Unauthorized: invalid or expired token" }, 401)
  }
}
