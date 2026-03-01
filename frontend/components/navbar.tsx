"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Code2, LogOut, User, ChevronDown, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/problems", label: "Problems" },
  { href: "/discussions", label: "Discuss" },
  { href: "/leaderboard", label: "Leaderboard" },
]

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isLoading = status === "loading"

  const user = session?.user
    ? {
        id: session.user.id,
        username:
          (session.user as typeof session.user & { username?: string }).username ??
          session.user.name ??
          session.user.email ??
          "User",
        email: session.user.email ?? "",
        isAdmin: (session.user as typeof session.user & { isAdmin?: boolean }).isAdmin ?? false,
      }
    : null

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    signOut({ callbackUrl: "/login" })
  }

  // Hide navbar on auth pages
  if (pathname === "/login" || pathname === "/signup") return null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        {/* Logo */}
        <Link href="/problems" className="flex items-center gap-2.5 shrink-0">
          <div className="flex size-7 items-center justify-center rounded-md bg-orange-500">
            <Code2 className="size-3.5 text-white" />
          </div>
          <span className="font-bold tracking-tight">LeetClone</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <ThemeToggle />

        {/* Auth area */}
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar fallback={user.username} size="sm" />
                <span className="hidden font-medium sm:block max-w-30 truncate">
                  {user.username}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal py-2">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)}>
                <User className="size-4" />
                My Profile
              </DropdownMenuItem>
              {user.isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <ShieldCheck className="size-4" />
                    Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
              Sign in
            </Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => router.push("/signup")}
            >
              Get started
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
