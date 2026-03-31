"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending2fa, setPending2fa] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.requires2fa) {
        setPending2fa(data.pendingToken);
        return;
      }

      document.cookie = `sunriseobx_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/desk");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handle2fa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken: pending2fa, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      document.cookie = `sunriseobx_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/desk");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-sunrise-500">Sunrise</span> Construction
          </h1>
          <p className="mt-2 text-navy-400">Admin Portal</p>
        </div>

        <div className="bg-navy-800 rounded-2xl p-8 shadow-xl border border-navy-700">
          {!pending2fa ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:border-sunrise-500"
                  placeholder="admin@sunriseobx.co"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:border-sunrise-500"
                  required
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sunrise-600 hover:bg-sunrise-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2fa} className="space-y-5">
              <p className="text-navy-300 text-sm">
                Enter your 6-digit authenticator code or recovery code.
              </p>
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-navy-700 border border-navy-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-sunrise-500"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sunrise-600 hover:bg-sunrise-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
