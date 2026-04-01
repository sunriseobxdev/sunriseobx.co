"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";

const navItems = [
  { href: "/desk", label: "Dashboard", icon: "📊" },
  { href: "/desk/jobs", label: "Jobs", icon: "🔨", privilege: "manage_jobs" },
  { href: "/desk/parcels", label: "Parcels", icon: "🗺️" },
  { href: "/desk/cms", label: "Content", icon: "📝" },
  { href: "/desk/campaigns", label: "Campaigns", icon: "📬" },
  { href: "/desk/trade", label: "Trade", icon: "📈", privilege: "trade" },
  { href: "/desk/market", label: "Market", icon: "🏪" },
  { href: "/desk/chart", label: "Chart", icon: "📉" },
  { href: "/desk/history", label: "History", icon: "📋" },
  { href: "/desk/invoices", label: "Invoices", icon: "🧾", privilege: "view_invoices" },
  { href: "/desk/payroll", label: "Payroll", icon: "💰", privilege: "view_payroll" },
  { href: "/desk/admin", label: "Admin", icon: "⚙️", role: "admin" },
  { href: "/desk/profile", label: "Profile", icon: "👤" },
];

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, hasPrivilege, isAdmin } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/auth/me", {
      headers: {
        Authorization: `Bearer ${document.cookie.match(/sunriseobx_token=([^;]+)/)?.[1] || ""}`,
      },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => router.push("/login"));
  }, [setUser, router]);

  function handleLogout() {
    document.cookie = "sunriseobx_token=; path=/; max-age=0";
    router.push("/login");
  }

  const filteredNav = navItems.filter((item) => {
    if (item.role === "admin" && !isAdmin()) return false;
    if (item.privilege && !hasPrivilege(item.privilege)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-800 border-r border-navy-700 transform transition-transform md:relative md:translate-x-0 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-navy-700">
          <Link href="/" className="text-lg font-bold text-white">
            <span className="text-sunrise-500">Sunrise</span> Desk
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const active =
              item.href === "/desk"
                ? pathname === "/desk"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-sunrise-600/20 text-sunrise-400"
                    : "text-navy-300 hover:bg-navy-700 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-navy-700">
          {user && (
            <div className="mb-2 px-2">
              <p className="text-sm text-white truncate font-medium">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-navy-400 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-navy-400 hover:text-white hover:bg-navy-700 rounded-lg transition text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-navy-700 bg-navy-800/50 md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-2"
          >
            ☰
          </button>
          <span className="text-white font-bold">
            <span className="text-sunrise-500">Sunrise</span> Desk
          </span>
          <div />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
