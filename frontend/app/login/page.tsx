import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className=" min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black ">
        <LoginForm />
      </main>
    </div>
  )
}
