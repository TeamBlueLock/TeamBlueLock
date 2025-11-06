import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team Blue Lock Dashboard",
  description: "Senior Project – Team Blue Lock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100`}
      >
        <div className="min-h-screen flex">
          {/* Sidebar */}
          <aside className="w-2/14 bg-slate-900 text-slate-100 flex flex-col">
            <div className="px-4 py-4 border-b border-slate-700">
              <h1 className="text-xl font-semibold">TeamBlueLock</h1>
              <p className="text-xs text-slate-400">
                Small Business Dashboard
              </p>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 text-sm">
              <SidebarLink href="/">Overview</SidebarLink>
              <SidebarLink href="/recipes">Recipes</SidebarLink>
              <SidebarLink href="/supply-cost">Supply Cost</SidebarLink>
              <SidebarLink href="/profit-analysis">Profit Analysis</SidebarLink>
            </nav>

            <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Team Blue Lock
            </div>
          </aside>

          {/* Main content area */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}