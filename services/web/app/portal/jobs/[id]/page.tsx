"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { customerFetch } from "@/lib/customer";

interface JobDetail {
  id: string;
  job_number: string;
  title: string;
  description: string;
  status: string;
  service_type: string;
  job_address_line1: string;
  job_address_city: string;
  job_address_state: string;
  job_address_zip: string;
  contract_amount: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  estimated_start: string | null;
  estimated_end: string | null;
  permit_number: string | null;
  permit_status: string | null;
  milestones: { id: string; title: string; status: string; due_date: string | null; completed_at: string | null }[];
  events: { id: string; title: string; start_time: string; end_time: string | null; event_type: string }[];
  change_orders: { id: string; title: string; amount: number | null; status: string }[];
  agreements: { id: string; status: string; signed_at: string | null }[];
  payments: { id: string; amount: number; status: string; payment_type: string; paid_at: string | null }[];
  photos: { id: string; url: string; caption: string | null; phase: string | null }[];
  messages: { id: string; sender_type: string; sender_name: string; body: string; created_at: string }[];
  punch_list: { id: string; item: string; status: string; completed_at: string | null }[];
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#627d98", bg: "#f0f4f8" },
  pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  active: { label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
  completed: { label: "Completed", color: "#059669", bg: "#ecfdf5" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
};

const card = { background: "white", borderRadius: "12px", padding: "1.25rem 1.5rem", border: "1px solid #e2e8f0", marginBottom: "1rem" };
const sectionTitle = { fontSize: "0.85rem", fontWeight: 700 as const, color: "#1a3550", marginBottom: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" };

export default function CustomerJobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [msgBody, setMsgBody] = useState("");
  const [tab, setTab] = useState<"overview" | "timeline" | "calendar" | "documents" | "messages">("overview");

  useEffect(() => {
    if (params.id) {
      customerFetch(`/customer/jobs/${params.id}`).then(setJob).catch(() => {});
    }
  }, [params.id]);

  async function sendMessage() {
    if (!msgBody.trim() || !job) return;
    await customerFetch(`/customer/jobs/${job.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: msgBody }),
    });
    setMsgBody("");
    customerFetch(`/customer/jobs/${job.id}`).then(setJob);
  }

  if (!job) return <div style={{ color: "#627d98", textAlign: "center", padding: "3rem" }}>Loading...</div>;

  const responsiveStyles = `
    @media (min-width: 768px) {
      .portal-overview-grid { grid-template-columns: 1fr 1fr !important; }
      .portal-job-header { flex-direction: row !important; }
    }
  `;

  const s = STATUS_LABELS[job.status] || STATUS_LABELS.draft;
  const completedMilestones = job.milestones.filter((m) => m.status === "completed").length;
  const totalMilestones = job.milestones.length;
  const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "timeline", label: `Timeline (${completedMilestones}/${totalMilestones})` },
    { key: "calendar", label: "Calendar" },
    { key: "documents", label: "Documents" },
    { key: "messages", label: `Messages (${job.messages.length})` },
  ] as const;

  return (
    <div>
      <style>{responsiveStyles}</style>
      <Link href="/portal" style={{ color: "#f97316", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>&larr; Back to Jobs</Link>

      {/* Header */}
      <div style={{ ...card, marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }} className="portal-job-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <span style={{ fontWeight: 700, color: "#f97316" }}>{job.job_number}</span>
            <span style={{ padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, color: s.color, background: s.bg }}>{s.label}</span>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a3550", margin: 0 }}>{job.title}</h1>
          <p style={{ color: "#627d98", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{job.service_type}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          {job.contract_amount && <div style={{ fontWeight: 700, color: "#1a3550", fontSize: "1.1rem" }}>{usd.format(job.contract_amount)}</div>}
          {totalMilestones > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ width: "120px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${progressPct}%`, height: "100%", background: "#059669", borderRadius: "3px", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: "0.7rem", color: "#627d98" }}>{progressPct}% complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.5rem 0.75rem", border: "none", borderBottom: tab === t.key ? "2px solid #f97316" : "2px solid transparent",
              background: "none", color: tab === t.key ? "#f97316" : "#627d98",
              fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", marginBottom: "-2px", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }} className="portal-overview-grid">
          <div style={card}>
            <h3 style={sectionTitle}>Job Details</h3>
            <div style={{ fontSize: "0.8rem", color: "#334e68", lineHeight: 1.8 }}>
              <div><strong>Address:</strong> {job.job_address_line1} {job.job_address_city}, {job.job_address_state} {job.job_address_zip}</div>
              <div><strong>ETA:</strong> {job.estimated_start ? new Date(job.estimated_start).toLocaleDateString() : "TBD"} &ndash; {job.estimated_end ? new Date(job.estimated_end).toLocaleDateString() : "TBD"}</div>
              <div><strong>Permit:</strong> {job.permit_number || "N/A"} ({job.permit_status || "N/A"})</div>
              <div><strong>Deposit:</strong> {job.deposit_amount ? `${usd.format(job.deposit_amount)} ${job.deposit_paid ? "(Paid)" : "(Pending)"}` : "N/A"}</div>
            </div>
          </div>
          <div style={card}>
            <h3 style={sectionTitle}>Payments</h3>
            {job.payments.length === 0 ? (
              <p style={{ color: "#627d98", fontSize: "0.8rem" }}>No payments yet</p>
            ) : (
              job.payments.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f0f4f8", fontSize: "0.8rem" }}>
                  <span style={{ color: "#334e68" }}>{p.payment_type} — {p.status}</span>
                  <span style={{ fontWeight: 600, color: p.status === "succeeded" ? "#059669" : "#334e68" }}>{usd.format(p.amount)}</span>
                </div>
              ))
            )}
          </div>
          {job.change_orders.length > 0 && (
            <div style={card}>
              <h3 style={sectionTitle}>Change Orders</h3>
              {job.change_orders.map((co) => (
                <div key={co.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f0f4f8", fontSize: "0.8rem" }}>
                  <span style={{ color: "#334e68" }}>{co.title}</span>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    {co.amount && <span style={{ fontWeight: 600 }}>{usd.format(co.amount)}</span>}
                    <span style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, color: co.status === "approved" ? "#059669" : "#d97706", background: co.status === "approved" ? "#ecfdf5" : "#fffbeb" }}>{co.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {tab === "timeline" && (
        <div style={card}>
          <h3 style={sectionTitle}>Project Milestones</h3>
          {job.milestones.length === 0 ? (
            <p style={{ color: "#627d98", fontSize: "0.8rem" }}>No milestones set yet</p>
          ) : (
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div style={{ position: "absolute", left: "7px", top: 0, bottom: 0, width: "2px", background: "#e2e8f0" }} />
              {job.milestones.map((m) => (
                <div key={m.id} style={{ position: "relative", paddingBottom: "1.25rem" }}>
                  <div style={{
                    position: "absolute", left: "-1.5rem", top: "2px", width: "16px", height: "16px", borderRadius: "50%",
                    background: m.status === "completed" ? "#059669" : "#e2e8f0",
                    border: m.status === "completed" ? "none" : "2px solid #cbd5e1",
                  }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a3550" }}>{m.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#627d98" }}>
                    {m.status === "completed" && m.completed_at ? `Completed ${new Date(m.completed_at).toLocaleDateString()}` : m.due_date ? `Due ${new Date(m.due_date).toLocaleDateString()}` : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Punch list */}
          {job.punch_list.length > 0 && (
            <>
              <h3 style={{ ...sectionTitle, marginTop: "1.5rem" }}>Punch List</h3>
              {job.punch_list.map((pl) => (
                <div key={pl.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0", fontSize: "0.8rem" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "3px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: pl.status === "done" ? "#059669" : "#e2e8f0", color: "white", fontSize: "0.6rem" }}>
                    {pl.status === "done" ? "✓" : ""}
                  </span>
                  <span style={{ color: pl.status === "done" ? "#627d98" : "#334e68", textDecoration: pl.status === "done" ? "line-through" : "none" }}>{pl.item}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {tab === "calendar" && (
        <div style={card}>
          <h3 style={sectionTitle}>Calendar</h3>
          {job.events.length === 0 ? (
            <p style={{ color: "#627d98", fontSize: "0.8rem" }}>No events scheduled</p>
          ) : (
            job.events.map((e) => (
              <div key={e.id} style={{ display: "flex", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid #f0f4f8", fontSize: "0.8rem" }}>
                <div style={{ minWidth: "80px", color: "#f97316", fontWeight: 600, fontSize: "0.75rem" }}>
                  {new Date(e.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1a3550" }}>{e.title}</div>
                  <div style={{ color: "#627d98", fontSize: "0.7rem" }}>{e.event_type}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
        <div>
          {job.agreements.length > 0 && (
            <div style={card}>
              <h3 style={sectionTitle}>Agreements</h3>
              {job.agreements.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.8rem" }}>
                  <span style={{ color: "#334e68" }}>Independent Contractor Agreement</span>
                  <span style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, color: a.status === "signed" ? "#059669" : "#d97706", background: a.status === "signed" ? "#ecfdf5" : "#fffbeb" }}>
                    {a.status}{a.signed_at ? ` — ${new Date(a.signed_at).toLocaleDateString()}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          {job.photos.length > 0 && (
            <div style={card}>
              <h3 style={sectionTitle}>Photo Updates</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                {job.photos.map((p) => (
                  <div key={p.id}>
                    <img src={p.url} alt={p.caption || ""} style={{ width: "100%", borderRadius: "8px", aspectRatio: "4/3", objectFit: "cover" }} />
                    {p.caption && <p style={{ fontSize: "0.7rem", color: "#627d98", marginTop: "0.25rem" }}>{p.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {tab === "messages" && (
        <div style={card}>
          <h3 style={sectionTitle}>Messages</h3>
          <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "1rem" }}>
            {job.messages.length === 0 ? (
              <p style={{ color: "#627d98", fontSize: "0.8rem" }}>No messages yet</p>
            ) : (
              job.messages.map((m) => (
                <div key={m.id} style={{ padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "8px", background: m.sender_type === "customer" ? "#eff6ff" : "#f0f4f8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.75rem", color: m.sender_type === "customer" ? "#2563eb" : "#f97316" }}>
                      {m.sender_name || (m.sender_type === "customer" ? "You" : "Sunrise Construction")}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#627d98" }}>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#334e68" }}>{m.body}</p>
                </div>
              ))
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.85rem" }}
            />
            <button
              onClick={sendMessage}
              style={{ padding: "0.6rem 1.25rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
