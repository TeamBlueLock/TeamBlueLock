import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "../../app/globals.css";
import { auth } from "@/lib/auth";
import { headers as getHeaders } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/ui/logout-button";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  // ✅ BYPASS AUTH ONLY FOR PLAYWRIGHT
  if (process.env.PLAYWRIGHT === "true") {
    return (
          <div className="min-h-screen flex">
            <aside className="w-2/14 bg-black text-slate-100 flex flex-col">
              <div className="px-4 py-4 border-b border-slate-700">
                <h1 className="text-xl font-semibold">TeamBlueLock</h1>
                <p className="text-xs text-slate-400">Dashboard</p>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1 text-sm">
                <SidebarLink href="/dashboard/inventory">Inventory</SidebarLink>
                <SidebarLink href="/dashboard/recipes">Recipes</SidebarLink>
                <SidebarLink href="/dashboard/profit-analysis">Profit Analysis</SidebarLink>
              </nav>

              <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
                {/* optional: you can hide logout in tests if it touches auth */}
                <LogoutButton />
                &copy; {new Date().getFullYear()} Team Blue Lock
              </div>
            </aside>

            <main className="flex-1 p-8">{children}</main>
          </div>
    );
  }

  // 🔒 Normal auth
  const headersList = await getHeaders();
  const sessionResult = await auth.api.getSession({ headers: headersList });
  const session = sessionResult?.session;

  if (!session) {
    redirect("/login");
  }

  return (
        <div className="min-h-screen flex">
          <aside className="w-2/14 bg-black text-slate-100 flex flex-col">
            <div className="px-4 py-4 border-b border-slate-700">
              <h1 className="text-xl font-semibold">TeamBlueLock</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 text-sm">
              <SidebarLink href="/dashboard/inventory">Inventory</SidebarLink>
              <SidebarLink href="/dashboard/recipes">Recipes</SidebarLink>
              <SidebarLink href="/dashboard/profit-analysis">Profit Analysis</SidebarLink>
            </nav>

            <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400 flex flex-col items-center gap-1 text-center">
              <LogoutButton />
              &copy; {new Date().getFullYear()} TeamBlueLock
            </div>
          </aside>

          <main className="flex-1 p-8">{children}</main>
        </div>
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
