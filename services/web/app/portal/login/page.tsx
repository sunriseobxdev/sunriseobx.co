"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type Step = "email" | "password" | "otp" | "totp" | "reset";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  async function checkEmail() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/auth/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setHasPassword(data.has_password);
      setTotpEnabled(data.totp_enabled);

      if (data.has_password) {
        setStep("password");
      } else {
        // No password — send OTP directly
        await sendOTP();
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendOTP() {
    const res = await fetch(`${API_URL}/customer/auth/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to send code");
  }

  async function loginWithPassword() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/auth/password-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      // TODO: if 2FA enabled, handle TOTP step
      document.cookie = `sunrise_customer_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
      router.push("/portal");
    } catch {
      setError("Login failed. Please try again.");
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
      if (!res.ok) {
        setError("Invalid or expired code.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      document.cookie = `sunrise_customer_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
      router.push("/portal");
    } catch {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await sendOTP();
      setStep("reset");
      setInfo("We sent a verification code to your email. Enter it below with your new password.");
    } catch {
      setError("Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/customer/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Reset failed.");
        setLoading(false);
        return;
      }
      setInfo("Password updated! You can now log in.");
      setStep("password");
      setPassword("");
      setCode("");
    } catch {
      setError("Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-3 border border-gray-300 rounded-lg text-sm";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const btnClass = "w-full py-3 bg-sunrise-600 hover:bg-sunrise-500 text-white border-none rounded-lg font-bold text-sm cursor-pointer transition";

  return (
    <div style={{ minHeight: "100vh", background: "#1a3550", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "2.5rem", width: "100%", maxWidth: "400px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a3550", margin: 0 }}>
            <span style={{ color: "#f97316" }}>Sunrise</span> Portal
          </h1>
          <p style={{ color: "#627d98", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {step === "email" && "Sign in to your account"}
            {step === "password" && "Enter your password"}
            {step === "otp" && "Enter the code we sent you"}
            {step === "reset" && "Reset your password"}
          </p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.6rem", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", padding: "0.6rem", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {info}
          </div>
        )}

        {/* Step: Email */}
        {step === "email" && (
          <form onSubmit={(e) => { e.preventDefault(); checkEmail(); }}>
            <label className={labelClass}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} style={{ marginBottom: "1rem" }} />
            <button type="submit" disabled={loading || !email} className={btnClass} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {/* Step: Password */}
        {step === "password" && (
          <form onSubmit={(e) => { e.preventDefault(); loginWithPassword(); }}>
            <p style={{ fontSize: "0.8rem", color: "#627d98", marginBottom: "1rem" }}>
              Signing in as <strong>{email}</strong>
            </p>
            <label className={labelClass}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required className={inputClass} style={{ marginBottom: "0.75rem" }} />
            <button type="submit" disabled={loading} className={btnClass} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem" }}>
              <button type="button" onClick={handleForgotPassword} style={{ background: "none", border: "none", color: "#f97316", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>
                Forgot password?
              </button>
              <button type="button" onClick={async () => { await sendOTP(); setStep("otp"); }} style={{ background: "none", border: "none", color: "#627d98", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>
                Use email code instead
              </button>
            </div>
          </form>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <form onSubmit={(e) => { e.preventDefault(); verifyOTP(); }}>
            <p style={{ fontSize: "0.8rem", color: "#627d98", marginBottom: "1rem" }}>
              Code sent to <strong>{email}</strong>
            </p>
            <label className={labelClass}>Verification Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", marginBottom: "1rem", boxSizing: "border-box" }} />
            <button type="submit" disabled={loading || code.length < 6} className={btnClass} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", background: "none", border: "none", color: "#627d98", fontSize: "0.8rem", cursor: "pointer" }}>
              Use a different email
            </button>
          </form>
        )}

        {/* Step: Password Reset */}
        {step === "reset" && (
          <form onSubmit={(e) => { e.preventDefault(); resetPassword(); }}>
            <label className={labelClass}>Verification Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1.2rem", textAlign: "center", letterSpacing: "0.3em", marginBottom: "0.75rem", boxSizing: "border-box" }} />
            <label className={labelClass}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className={inputClass} style={{ marginBottom: "1rem" }} />
            <button type="submit" disabled={loading || code.length < 6 || newPassword.length < 8} className={btnClass} style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button type="button" onClick={() => { setStep("password"); setError(""); setInfo(""); }} style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", background: "none", border: "none", color: "#627d98", fontSize: "0.8rem", cursor: "pointer" }}>
              Back to login
            </button>
          </form>
        )}

        {/* Support link */}
        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "1.5rem", paddingTop: "1rem", textAlign: "center" }}>
          <p style={{ color: "#627d98", fontSize: "0.75rem" }}>
            Lost access to your account or 2FA device?{" "}
            <Link href="/portal/support" style={{ color: "#f97316", textDecoration: "none" }}>
              Open a support ticket
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
