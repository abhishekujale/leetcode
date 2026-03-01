import { Code2, BarChart3, Brain, Flame } from "lucide-react"
import { SignupForm } from "@/components/signup-form"

const perks = [
  { icon: Brain, title: "Smart Practice", desc: "Adaptive problem sets tailored to your level" },
  { icon: BarChart3, title: "Track Progress", desc: "Visualize your growth across all difficulty tiers" },
  { icon: Flame, title: "Daily Streaks", desc: "Build consistency with daily challenges" },
]

export default function SignupPage() {
  return (
    <div className="grid min-h-[calc(100vh-0px)] lg:grid-cols-[1fr_1.1fr]">
      {/* ── Right form panel (rendered first on mobile) ── */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-8 bg-background order-2 lg:order-2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-orange-500">
              <Code2 className="size-4 text-white" />
            </div>
            <span className="font-bold tracking-tight">LeetClone</span>
          </div>

          <SignupForm />
        </div>
      </div>

      {/* ── Left branding panel ── */}
      <div className="relative hidden lg:flex flex-col justify-between bg-zinc-950 p-12 border-r border-zinc-800/60 overflow-hidden order-1 lg:order-1">
        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Glows */}
        <div className="pointer-events-none absolute top-1/3 right-0 size-96 rounded-full bg-indigo-500/8 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/4 left-0 size-64 rounded-full bg-orange-500/6 blur-[80px]" />

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
              Start your<br />
              <span className="bg-linear-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                coding journey
              </span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Join thousands of developers sharpening their skills with hands-on coding practice.
            </p>
          </div>

          {/* Perk cards */}
          <div className="space-y-3">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/50">
                  <Icon className="size-4 text-zinc-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-700">
          © {new Date().getFullYear()} LeetClone. All rights reserved.
        </p>
      </div>
    </div>
  )
}
