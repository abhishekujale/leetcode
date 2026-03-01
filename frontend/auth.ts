import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!res.ok) return null

          const data = await res.json()
          if (!data.token || !data.user) return null

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.username,
            accessToken: data.token,
            isAdmin: data.user.isAdmin ?? false,
          }
        } catch {
          return null
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })

  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth: find-or-create the user in our backend and swap Google's
      // UUID for our MongoDB ObjectId + a backend JWT.
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_URL}/api/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              provider: "google",
              providerId: user.id,
            }),
          })
          if (!res.ok) return false
          const data = await res.json()
          // Overwrite Google's UUID with our MongoDB ObjectId
          user.id = data.user.id
          ;(user as typeof user & { accessToken?: string; username?: string; isAdmin?: boolean }).accessToken = data.token
          ;(user as typeof user & { username?: string }).username = data.user.username
          ;(user as typeof user & { isAdmin?: boolean }).isAdmin = data.user.isAdmin ?? false
        } catch {
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = (user as typeof user & { accessToken?: string }).accessToken
        token.username = (user as typeof user & { username?: string }).username ?? user.name ?? undefined
        token.isAdmin = (user as typeof user & { isAdmin?: boolean }).isAdmin ?? false
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
        ; (session.user as typeof session.user & { username?: string }).username =
          token.username as string
        ; (session as typeof session & { accessToken?: string }).accessToken =
          token.accessToken as string
        ; (session.user as typeof session.user & { isAdmin?: boolean }).isAdmin =
          token.isAdmin as boolean
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
})
