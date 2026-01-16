// src/app/page.tsx
import Link from "next/link"
import Image from "next/image"

export default function Home() {
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

      {/* Login Button */}
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-medium shadow hover:bg-blue-700 transition"
      >
        Log In
      </Link>

      {/* About Section */}
      <section className="mt-20 max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold text-lg mb-2">Inventory</h3>
          <p className="text-slate-600 text-sm">
            Track items, quantities, and costs in one centralized dashboard.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold text-lg mb-2">Recipes</h3>
          <p className="text-slate-600 text-sm">
            Manage recipe ingredients and automatically connect them to your inventory.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold text-lg mb-2">Profit Analysis</h3>
          <p className="text-slate-600 text-sm">
            Visualize costs, revenue, and margins with built-in analytics.
          </p>
        </div>
      </section>

      {/* Footer-ish */}
      <p className="mt-16 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} TeamBlueLock
      </p>
    </main>
  )
}
