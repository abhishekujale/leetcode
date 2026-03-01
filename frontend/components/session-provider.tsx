"use client"
import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"

// Syncs the backend JWT from the NextAuth session into localStorage so that
// getAuthHeaders() in api.ts always has a valid token — covers Google OAuth
// redirects, page refreshes, and any other entry point.
function TokenSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session) {
      const token = (session as typeof session & { accessToken?: string }).accessToken
      if (token) localStorage.setItem("token", token)

      const user = session.user
      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            username: (user as typeof user & { username?: string }).username ?? user.name,
            email: user.email,
            isAdmin: (user as typeof user & { isAdmin?: boolean }).isAdmin ?? false,
          })
        )
      }
    }

    if (status === "unauthenticated") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }, [session, status])

  return null
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TokenSync />
      {children}
    </SessionProvider>
  )
}
