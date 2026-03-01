import { Code2, CheckCircle2, Zap, Trophy, Users } from "lucide-react"
import { LoginForm } from "@/components/login-form"

const features = [
  { icon: CheckCircle2, text: "500+ curated coding problems" },
  { icon: Zap, text: "Real-time code execution engine" },
  { icon: Trophy, text: "Global leaderboards & rankings" },
  { icon: Users, text: "Community discussions & solutions" },
]

const stats = [
  { value: "50K+", label: "Developers" },
  { value: "500+", label: "Problems" },
  { value: "1M+", label: "Submissions" },
]

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100vh-0px)] lg:grid-cols-2">
      {/* ── Left branding panel ── */}
      <div className="relative hidden lg:flex flex-col justify-between bg-zinc-950 p-12 border-r border-zinc-800/60 overflow-hidden">
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-130 rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 size-64 rounded-full bg-blue-500/6 blur-[80px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500 shadow-lg shadow-orange-500/30">
            <Code2 className="size-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">LeetClone</span>
        </div>

        {/* Hero copy */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="text-[2.6rem] font-bold text-white leading-[1.15] tracking-tight">
              Level up your<br />
              <span className="bg-linear-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                coding skills
              </span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Practice algorithms, ace technical interviews, and compete with developers worldwide.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 border border-green-500/20">
                  <Icon className="size-3 text-green-400" />
                </div>
                <span className="text-sm text-zinc-300">{text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-800/80">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-700">
          © {new Date().getFullYear()} LeetClone. Built for developers.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-orange-500">
              <Code2 className="size-4 text-white" />
            </div>
            <span className="font-bold tracking-tight">LeetClone</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
