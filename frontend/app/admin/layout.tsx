"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, ShieldCheck } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.replace("/")
      return
    }

    const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin
    if (!isAdmin) {
      router.replace("/")
      return
    }

    setChecked(true)
  }, [status, session, router])

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2 mb-8 pb-4 border-b">
        <ShieldCheck className="size-5 text-orange-500" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      {children}
    </div>
  )
}
