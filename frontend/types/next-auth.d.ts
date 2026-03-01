import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    accessToken?: string
  }

  interface Session {
    accessToken?: string
    user: {
      id: string
      username?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    accessToken?: string
    username?: string
  }
}
