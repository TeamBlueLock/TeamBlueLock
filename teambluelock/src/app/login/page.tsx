import { LoginForm } from "@/components/ui/login-form"
import Link from "next/link"
import Image from "next/image"

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="mb-6 bg-white p-2 rounded-2xl shadow">
        <Image
          src="/TeamBlueLock.png"
          alt="Team Blue Lock Logo"
          width={96}
          height={96}
          className="mx-auto"
        />
      </div>

      {/* Hero */}
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
        TeamBlueLock Dashboard
      </h1>
      <p className="text-slate-600 max-w-xl mb-8">
        A simplifed, user-friendly financial analysis platform built for your needs.
      </p>

      {/* Login Form */}
      <div className="flex w-full justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>

      {/* Footer-ish */}
      <p className="mt-16 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} TeamBlueLock
      </p>
    </main>
  )
}

