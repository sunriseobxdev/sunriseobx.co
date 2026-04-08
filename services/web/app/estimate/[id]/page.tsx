"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  job_address: string;
  description: string;
  line_items: { description: string; quantity: number; rate: number; amount: number }[];
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  notes: string;
  valid_until: string | null;
  status: string;
  accepted_at: string | null;
}

export default function EstimateViewPage() {
  const params = useParams();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`${API_URL}/api/estimates/public/${params.id}`)
        .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
        .then((data) => {
          setEstimate(data);
          if (data.status === "accepted") setResponded("accepted");
          else if (data.status === "declined") setResponded("declined");
        })
        .catch(() => setError("Estimate not found"));
    }
  }, [params.id]);

  async function respond(action: "accept" | "decline") {
    setResponding(true);
    try {
      const res = await fetch(`${API_URL}/api/estimates/public/${params.id}/${action}`, { method: "POST" });
      if (res.ok) {
        setResponded(action === "accept" ? "accepted" : "declined");
      }
    } catch { /* ok */ }
    setResponding(false);
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "2rem", textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ color: "#1a3550" }}>Estimate Not Found</h2>
          <p style={{ color: "#627d98" }}>This estimate may have expired or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return <div style={{ color: "#627d98", textAlign: "center", padding: "3rem" }}>Loading estimate...</div>;
  }

  const items = estimate.line_items || [];
  const isExpired = estimate.valid_until && new Date(estimate.valid_until) < new Date();

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Company Header */}
        <div style={{ background: "#1a3550", borderRadius: "12px 12px 0 0", padding: "2rem 2rem 1.5rem", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>
                <span style={{ color: "#f97316" }}>Sunrise</span> Construction
              </h1>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "#9fb3c8" }}>Premier Outer Banks Construction</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: "#9fb3c8" }}>121 Pine Grove Lane</div>
              <div style={{ fontSize: "0.8rem", color: "#9fb3c8" }}>Point Harbor, NC 27964</div>
              <div style={{ fontSize: "0.8rem", color: "#9fb3c8", marginTop: "0.25rem" }}>(252) 305-4313</div>
            </div>
          </div>
        </div>

        {/* Estimate Details */}
        <div style={{ background: "white", padding: "2rem", border: "1px solid #e2e8f0", borderTop: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#627d98", fontWeight: 600 }}>Estimate</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a3550" }}>{estimate.estimate_number}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {estimate.valid_until && (
                <div style={{
                  display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                  color: isExpired ? "#dc2626" : "#d97706",
                  background: isExpired ? "#fef2f2" : "#fffbeb",
                }}>
                  {isExpired ? "EXPIRED" : `Valid until ${new Date(estimate.valid_until).toLocaleDateString()}`}
                </div>
              )}
            </div>
          </div>

          {/* Prepared For */}
          <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#627d98", fontWeight: 600, marginBottom: "0.35rem" }}>Prepared For</div>
            <div style={{ fontWeight: 600, color: "#1a3550", fontSize: "1rem" }}>{estimate.client_name}</div>
            {estimate.client_email && <div style={{ color: "#627d98", fontSize: "0.8rem" }}>{estimate.client_email}</div>}
            {estimate.client_phone && <div style={{ color: "#627d98", fontSize: "0.8rem" }}>{estimate.client_phone}</div>}
            {estimate.job_address && (
              <div style={{ color: "#334e68", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                <strong>Project Address:</strong> {estimate.job_address}
              </div>
            )}
          </div>

          {/* Description */}
          {estimate.description && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f0f7ff", borderLeft: "4px solid #f97316", borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#627d98", fontWeight: 600, marginBottom: "0.35rem" }}>Scope of Work</div>
              <p style={{ margin: 0, color: "#334e68", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{estimate.description}</p>
            </div>
          )}

          {/* Line Items */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #1a3550" }}>
                <th style={{ textAlign: "left", padding: "0.6rem 0", color: "#1a3550", fontWeight: 700 }}>Description</th>
                <th style={{ textAlign: "right", padding: "0.6rem 0", color: "#1a3550", fontWeight: 700, width: "60px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "0.6rem 0", color: "#1a3550", fontWeight: 700, width: "90px" }}>Rate</th>
                <th style={{ textAlign: "right", padding: "0.6rem 0", color: "#1a3550", fontWeight: 700, width: "100px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <td style={{ padding: "0.7rem 0", color: "#334e68" }}>{item.description}</td>
                  <td style={{ textAlign: "right", padding: "0.7rem 0", color: "#334e68" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "0.7rem 0", color: "#334e68" }}>{usd.format(item.rate)}</td>
                  <td style={{ textAlign: "right", padding: "0.7rem 0", color: "#1a3550", fontWeight: 600 }}>{usd.format(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ borderTop: "2px solid #1a3550", paddingTop: "0.75rem", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "220px", marginBottom: "0.3rem", fontSize: "0.85rem" }}>
              <span style={{ color: "#627d98" }}>Subtotal</span>
              <span style={{ color: "#334e68" }}>{usd.format(Number(estimate.subtotal))}</span>
            </div>
            {Number(estimate.tax_amount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", width: "220px", marginBottom: "0.3rem", fontSize: "0.85rem" }}>
                <span style={{ color: "#627d98" }}>Tax ({(Number(estimate.tax_rate) * 100).toFixed(1)}%)</span>
                <span style={{ color: "#334e68" }}>{usd.format(Number(estimate.tax_amount))}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", width: "220px", fontWeight: 700, fontSize: "1.2rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
              <span style={{ color: "#1a3550" }}>Total</span>
              <span style={{ color: "#1a3550" }}>{usd.format(Number(estimate.total))}</span>
            </div>
          </div>

          {estimate.notes && (
            <div style={{ marginTop: "1.5rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", fontSize: "0.8rem", color: "#627d98" }}>
              <strong>Notes:</strong> {estimate.notes}
            </div>
          )}
        </div>

        {/* Action Section */}
        <div style={{ background: "white", borderRadius: "0 0 12px 12px", borderTop: "3px solid #f97316", padding: "1.5rem 2rem", border: "1px solid #e2e8f0" }}>
          {responded === "accepted" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#ecfdf5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem", color: "#059669" }}>&#10003;</span>
              </div>
              <h3 style={{ color: "#059669", fontWeight: 700, margin: "0 0 0.25rem" }}>Estimate Accepted</h3>
              <p style={{ color: "#047857", fontSize: "0.85rem", margin: 0 }}>
                Thank you! We&rsquo;ll be in touch shortly to schedule and get started.
              </p>
            </div>
          ) : responded === "declined" ? (
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "#627d98", fontWeight: 700, margin: "0 0 0.25rem" }}>Estimate Declined</h3>
              <p style={{ color: "#627d98", fontSize: "0.85rem", margin: 0 }}>
                No problem. If you change your mind or have questions, call us at (252) 305-4313.
              </p>
            </div>
          ) : isExpired ? (
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "#d97706", fontWeight: 700, margin: "0 0 0.25rem" }}>Estimate Expired</h3>
              <p style={{ color: "#627d98", fontSize: "0.85rem", margin: 0 }}>
                This estimate has expired. Contact us at (252) 305-4313 for an updated quote.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: "#334e68", fontSize: "0.9rem", margin: "0 0 1rem", textAlign: "center" }}>
                Ready to move forward? Accept this estimate and we&rsquo;ll get started on your project.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button
                  onClick={() => respond("accept")}
                  disabled={responding}
                  style={{
                    padding: "0.85rem 2.5rem", background: "#059669", color: "white", border: "none",
                    borderRadius: "8px", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                    opacity: responding ? 0.6 : 1,
                  }}
                >
                  {responding ? "..." : "Accept Estimate"}
                </button>
                <button
                  onClick={() => { if (confirm("Are you sure you want to decline this estimate?")) respond("decline"); }}
                  disabled={responding}
                  style={{
                    padding: "0.85rem 1.5rem", background: "none", color: "#627d98", border: "1px solid #d1d5db",
                    borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                  }}
                >
                  Decline
                </button>
              </div>
              <p style={{ color: "#9fb3c8", fontSize: "0.7rem", textAlign: "center", marginTop: "0.75rem" }}>
                Questions? Call (252) 305-4313 or reply to the email we sent you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
