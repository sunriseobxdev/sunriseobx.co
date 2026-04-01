"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/auth/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send code");
      setStep("code");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) throw new Error("Invalid code");
      const data = await res.json();
      document.cookie = `sunrise_customer_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
      router.push("/portal");
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1a3550", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "2.5rem", width: "100%", maxWidth: "400px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a3550", margin: 0 }}>
            <span style={{ color: "#f97316" }}>Sunrise</span> Portal
          </h1>
          <p style={{ color: "#627d98", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {step === "email" ? "Enter your email to sign in" : "Enter the code we sent you"}
          </p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#334e68", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "1rem", boxSizing: "border-box" }}
            />
            <button
              type="submit"
              disabled={loading || !email}
              style={{ width: "100%", padding: "0.75rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verifyOTP(); }}>
            <p style={{ fontSize: "0.8rem", color: "#627d98", marginBottom: "1rem" }}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#334e68", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", marginBottom: "1rem", boxSizing: "border-box" }}
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              style={{ width: "100%", padding: "0.75rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", background: "none", border: "none", color: "#627d98", fontSize: "0.8rem", cursor: "pointer" }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
