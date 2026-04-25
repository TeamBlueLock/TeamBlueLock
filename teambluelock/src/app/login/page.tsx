import { LoginForm } from "@/components/ui/login-form"
import Link from "next/link"
import Image from "next/image"

/**
 * Renders the login page for the TeamBlueLock application.
 *
 * This page displays the application logo, a brief description, and a login
 * form that allows users to authenticate and access the dashboard. It serves
 * as the entry point for users before they navigate to protected routes such
 * as inventory, recipes, and profit analysis.
 *
 * @returns A React element representing the login page UI, including branding,
 * descriptive text, and the login form component.
 *
 * @example
 * // Example behavior:
 * // Displays the TeamBlueLock logo, title, and login form centered on the page.
 *
 * @example
 * // Example result:
 * // Users can enter credentials through the login form to access the dashboard.
 */

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

