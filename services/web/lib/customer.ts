"use client";

import { createContext, useContext } from "react";

export interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

export const CustomerCtx = createContext<{ customer: Customer | null; logout: () => void }>({
  customer: null,
  logout: () => {},
});

export function useCustomer() {
  return useContext(CustomerCtx);
}

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/sunrise_customer_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function customerFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${apiUrl}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/portal/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}
