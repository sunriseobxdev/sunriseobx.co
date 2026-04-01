"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CustomerCtx, customerFetch } from "@/lib/customer";
import type { Customer } from "@/lib/customer";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const token = typeof document !== "undefined"
      ? document.cookie.match(/sunrise_customer_token=([^;]+)/)?.[1]
      : null;
    if (!token && !pathname.startsWith("/portal/login")) {
      router.push("/portal/login");
      return;
    }
    if (token) {
      customerFetch("/customer/auth/me")
        .then((data) => setCustomer(data))
        .catch(() => {
          if (!pathname.startsWith("/portal/login")) router.push("/portal/login");
        });
    }
  }, [pathname, router]);

  function logout() {
    document.cookie = "sunrise_customer_token=; path=/; max-age=0";
    router.push("/portal/login");
  }

  if (pathname.startsWith("/portal/login")) {
    return <>{children}</>;
  }

  return (
    <CustomerCtx.Provider value={{ customer, logout }}>
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <header style={{ background: "#1a3550", borderBottom: "3px solid #f97316", padding: "0 1rem" }}>
          <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1000px", margin: "0 auto" }}>
            <Link href="/portal" style={{ color: "white", fontWeight: 800, fontSize: "1rem", textDecoration: "none" }}>
              <span style={{ color: "#f97316" }}>Sunrise</span> Portal
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link href="/portal" style={{ color: pathname === "/portal" ? "#f97316" : "#9fb3c8", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                Jobs
              </Link>
              <Link href="/portal/profile" style={{ color: pathname === "/portal/profile" ? "#f97316" : "#9fb3c8", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                Profile
              </Link>
              <button onClick={logout} style={{ background: "none", border: "1px solid #627d98", color: "#9fb3c8", padding: "0.25rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer" }}>
                Out
              </button>
            </div>
          </div>
        </header>
        <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          {children}
        </main>
      </div>
    </CustomerCtx.Provider>
  );
}
