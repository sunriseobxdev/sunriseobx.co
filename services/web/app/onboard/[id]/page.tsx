"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Agreement {
  id: string;
  full_html: string;
  status: string;
  signed_at: string | null;
  job_number: string;
  job_title: string;
  customer_email: string;
  customer_name: string;
}

function getCustomerToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/sunrise_customer_token=([^;]+)/);
  return match ? match[1] : null;
}

export default function OnboardPage() {
  const params = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [step, setStep] = useState<"auth" | "review" | "sign" | "done">("auth");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);

  // Load agreement info
  useEffect(() => {
    fetch(`${API_URL}/api/agreements/onboard/${params.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        setAgreement(data);
        if (data.customer_email) setEmail(data.customer_email);
        if (data.status === "signed") setStep("done");
        else if (getCustomerToken()) setStep("review");
      })
      .catch(() => setError("Agreement not found."));
  }, [params.id]);

  // --- Auth Flow ---
  async function sendOTP() {
    setLoading(true);
    setError("");
    try {
      await fetch(`${API_URL}/customer/auth/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setAuthStep("code");
    } catch {
      setError("Failed to send code.");
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      document.cookie = `sunrise_customer_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
      setStep("review");
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  // --- Signature Canvas ---
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a3550";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDraw() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function submitSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL("image/png");
    const token = getCustomerToken();

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/agreements/onboard/${params.id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature_data: signatureData }),
      });
      if (!res.ok) throw new Error();
      setStep("done");
    } catch {
      setError("Failed to submit signature. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!agreement && !error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#627d98" }}>Loading agreement...</p>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", padding: "2rem", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ color: "#dc2626" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{ background: "#1a3550", borderBottom: "3px solid #f97316", padding: "1rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
          <span style={{ color: "#f97316" }}>Sunrise</span> Construction
        </h1>
        {agreement && (
          <p style={{ color: "#9fb3c8", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
            {agreement.job_number} — {agreement.job_title}
          </p>
        )}
      </header>

      <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "0 1.5rem" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Auth Step */}
        {step === "auth" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a3550", marginBottom: "1rem" }}>Verify Your Identity</h2>
            <p style={{ color: "#627d98", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Please verify your email to review and sign your agreement.
            </p>
            {authStep === "email" ? (
              <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "1rem", boxSizing: "border-box" }} />
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.7rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); verifyOTP(); }}>
                <p style={{ fontSize: "0.8rem", color: "#627d98", marginBottom: "0.75rem" }}>Code sent to <strong>{email}</strong></p>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6}
                  style={{ width: "100%", padding: "0.7rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", marginBottom: "1rem", boxSizing: "border-box" }} />
                <button type="submit" disabled={loading || code.length < 6} style={{ width: "100%", padding: "0.7rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Review Step */}
        {step === "review" && agreement && (
          <div>
            <div style={{ background: "white", borderRadius: "12px", padding: "2rem", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <div dangerouslySetInnerHTML={{ __html: agreement.full_html }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep("sign")} style={{ padding: "0.75rem 2rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>
                I Agree — Proceed to Sign
              </button>
            </div>
          </div>
        )}

        {/* Sign Step */}
        {step === "sign" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "2rem", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a3550", marginBottom: "0.5rem" }}>Sign Agreement</h2>
            <p style={{ color: "#627d98", fontSize: "0.8rem", marginBottom: "1rem" }}>
              Draw your signature below using your mouse or finger.
            </p>
            <canvas
              ref={canvasRef}
              width={600}
              height={150}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              style={{ width: "100%", height: "150px", border: "2px dashed #d1d5db", borderRadius: "8px", cursor: "crosshair", touchAction: "none" }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button onClick={submitSignature} disabled={loading} style={{ flex: 1, padding: "0.7rem", background: "#059669", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Submitting..." : "Submit Signature"}
              </button>
              <button onClick={clearSignature} style={{ padding: "0.7rem 1rem", background: "none", border: "1px solid #d1d5db", borderRadius: "8px", color: "#627d98", cursor: "pointer" }}>
                Clear
              </button>
              <button onClick={() => setStep("review")} style={{ padding: "0.7rem 1rem", background: "none", border: "1px solid #d1d5db", borderRadius: "8px", color: "#627d98", cursor: "pointer" }}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "3rem", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#ecfdf5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>&#10003;</span>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a3550" }}>Agreement Signed</h2>
            <p style={{ color: "#627d98", fontSize: "0.85rem", margin: "0.5rem 0 1.5rem" }}>
              Thank you! Your agreement has been signed and recorded.
            </p>
            <button onClick={() => router.push("/portal")} style={{ padding: "0.7rem 2rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
              Go to My Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
