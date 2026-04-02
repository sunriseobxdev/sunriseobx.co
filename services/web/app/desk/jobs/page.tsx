"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  cardStyle,
  inputStyle,
  labelStyle,
  buttonPrimary,
  buttonSecondary,
  badgeStyle,
  colors,
  pageTitle,
  tableStyle,
  thStyle,
  tdStyle,
} from "@/lib/desk-styles";

interface Job {
  id: string;
  job_number: string;
  title: string;
  status: string;
  service_type: string;
  customer_name: string;
  customer_email: string;
  contract_amount: number | null;
  estimated_start: string | null;
  estimated_end: string | null;
  created_at: string;
}

interface JobDetail extends Job {
  description: string;
  customer_phone: string;
  customer_address: string;
  job_address_line1: string;
  job_address_city: string;
  job_address_state: string;
  job_address_zip: string;
  deposit_amount: number | null;
  deposit_paid: boolean;
  actual_start: string | null;
  actual_end: string | null;
  permit_number: string;
  permit_status: string;
  notes: string;
  milestones: Milestone[];
  events: CalEvent[];
  change_orders: ChangeOrder[];
  agreements: Agreement[];
  payments: Payment[];
  invoices: JobInvoice[];
  messages: JobMessage[];
}

interface JobMessage {
  id: string;
  sender_type: string;
  sender_name: string;
  body: string;
  created_at: string;
}

interface JobInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total: string | null;
  status: string;
  issue_date: string;
  due_date: string;
  pdf_path: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
}

interface CalEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  event_type: string;
}

interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  amount: number | null;
  status: string;
}

interface Agreement {
  id: string;
  status: string;
  signed_at: string | null;
  created_at: string | null;
}

interface AgreementDetail {
  id: string;
  full_html: string;
  status: string;
  signed_at: string | null;
  signature_data: string | null;
  signer_ip: string | null;
  scope_of_work_html: string;
  compensation_html: string;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_type: string;
  paid_at: string | null;
}

type View = "list" | "create" | "detail";

const SERVICE_TYPES = [
  "Siding — AZEK PVC Lap",
  "Siding — LP SmartSide",
  "Siding — James Hardie",
  "Siding — Cedar Shake",
  "Siding — Plygem Vinyl",
  "Windows — ViWinco OceanView",
  "Windows — Wincore",
  "Decking — TimberTech Composite",
  "Decking — Pressure-Treated",
  "Railings — TimberTech PVC",
  "Roofing",
  "X-Bracing / Structural",
  "WRB — HydroGap",
  "Multi-Trade Package",
  "Other",
];

const STATUS_COLORS: Record<string, "success" | "warning" | "info" | "muted" | "danger" | "accent"> = {
  draft: "muted",
  pending: "warning",
  active: "info",
  paused: "warning",
  completed: "success",
  cancelled: "danger",
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const emptyForm = {
  title: "",
  description: "",
  service_type: "",
  customer_email: "",
  customer_name: "",
  job_address_line1: "",
  job_address_city: "",
  job_address_state: "NC",
  job_address_zip: "",
  contract_amount: "",
  deposit_amount: "",
  estimated_start: "",
  estimated_end: "",
  permit_status: "na",
  notes: "",
  scope_of_work: "",
};

export default function JobsPage() {
  const [view, setView] = useState<View>("list");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [onboardLink, setOnboardLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<AgreementDetail | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const data = await apiFetch("/api/jobs/");
      setJobs(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadJobDetail(id: string) {
    const data = await apiFetch(`/api/jobs/${id}`);
    setSelectedJob(data);
    setView("detail");
  }

  function F(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const job = await apiFetch("/api/jobs/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          contract_amount: form.contract_amount ? parseFloat(form.contract_amount) : null,
          deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        }),
      });

      // Auto-generate agreement if scope of work is provided
      if (form.scope_of_work.trim() && job.id) {
        try {
          // Get default template
          const templates = await apiFetch("/api/agreements/templates");
          const templateId = templates?.[0]?.id || null;

          const amt = form.contract_amount ? parseFloat(form.contract_amount) : 0;
          const dep = form.deposit_amount ? parseFloat(form.deposit_amount) : 0;
          const compensationHtml = `<p>7. For the services rendered, the Client will provide compensation to the Contractor for the flat fee of <strong>$${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.</p>${dep > 0 ? `<p><strong>PAYMENT SCHEDULE:</strong></p><ul><li>Deposit: $${dep.toLocaleString("en-US", { minimumFractionDigits: 2 })} due upon signing</li><li>Balance: $${(amt - dep).toLocaleString("en-US", { minimumFractionDigits: 2 })} due upon completion</li></ul>` : ""}<p>8. The above Compensation includes all applicable sales tax, and duties as required by law.</p>`;

          const agreement = await apiFetch(`/api/agreements/jobs/${job.id}/agreements`, {
            method: "POST",
            body: JSON.stringify({
              template_id: templateId,
              scope_of_work_html: form.scope_of_work,
              compensation_html: compensationHtml,
            }),
          });

          if (agreement?.id) {
            const link = `${window.location.origin}/onboard/${agreement.id}`;
            setOnboardLink(link);
            // Also send to customer if email exists
            if (form.customer_email) {
              try {
                await apiFetch(`/api/agreements/jobs/${job.id}/agreements/${agreement.id}/send`, { method: "POST" });
              } catch { /* non-critical */ }
            }
          }
        } catch (err) {
          console.error("Agreement generation failed (job still created):", err);
        }
      }

      if (!onboardLink) {
        setView("list");
        setForm({ ...emptyForm });
      }
      loadJobs();
    } catch (err) {
      console.error(err);
      alert("Failed to create job");
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    if (onboardLink) {
      navigator.clipboard.writeText(onboardLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  async function updateJobStatus(id: string, status: string) {
    await apiFetch(`/api/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    loadJobs();
    if (selectedJob?.id === id) loadJobDetail(id);
  }

  async function addMilestone(jobId: string) {
    if (!milestoneTitle.trim()) return;
    await apiFetch(`/api/jobs/${jobId}/milestones`, {
      method: "POST",
      body: JSON.stringify({ title: milestoneTitle }),
    });
    setMilestoneTitle("");
    loadJobDetail(jobId);
  }

  async function completeMilestone(jobId: string, mid: string) {
    await apiFetch(`/api/jobs/${jobId}/milestones/${mid}`, {
      method: "PUT",
      body: JSON.stringify({ status: "completed" }),
    });
    loadJobDetail(jobId);
  }

  // --- Detail View ---
  if (view === "detail" && selectedJob) {
    const j = selectedJob;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button style={buttonSecondary} onClick={() => { setView("list"); setSelectedJob(null); }}>
            &larr; Back
          </button>
          <h1 style={{ ...pageTitle, margin: 0 } as React.CSSProperties}>{j.job_number} — {j.title}</h1>
          <span style={badgeStyle(STATUS_COLORS[j.status] || "muted")}>{j.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 0 }}>
          {/* Job Info */}
          <div style={cardStyle}>
            <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Job Info</h3>
            <div style={{ fontSize: "0.8rem", color: colors.body, lineHeight: 1.8 }}>
              <div><strong style={{ color: colors.label }}>Service:</strong> {j.service_type || "—"}</div>
              <div><strong style={{ color: colors.label }}>Contract:</strong> {j.contract_amount ? usd.format(j.contract_amount) : "—"}</div>
              <div><strong style={{ color: colors.label }}>Deposit:</strong> {j.deposit_amount ? usd.format(j.deposit_amount) : "—"} {j.deposit_paid ? "(Paid)" : ""}</div>
              <div><strong style={{ color: colors.label }}>Permit:</strong> {j.permit_number || "—"} ({j.permit_status})</div>
              <div><strong style={{ color: colors.label }}>ETA:</strong> {j.estimated_start || "—"} → {j.estimated_end || "—"}</div>
              <div><strong style={{ color: colors.label }}>Address:</strong> {j.job_address_line1} {j.job_address_city}, {j.job_address_state} {j.job_address_zip}</div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {j.status === "draft" && <button style={{ ...buttonPrimary, fontSize: "0.75rem", padding: "0.4rem 0.75rem" }} onClick={() => updateJobStatus(j.id, "pending")}>Mark Pending</button>}
              {j.status === "pending" && <button style={{ ...buttonPrimary, fontSize: "0.75rem", padding: "0.4rem 0.75rem" }} onClick={() => updateJobStatus(j.id, "active")}>Start Job</button>}
              {j.status === "active" && <button style={{ ...buttonPrimary, fontSize: "0.75rem", padding: "0.4rem 0.75rem" }} onClick={() => updateJobStatus(j.id, "completed")}>Complete</button>}
            </div>
          </div>

          {/* Customer Info */}
          <div style={cardStyle}>
            <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Customer</h3>
            <div style={{ fontSize: "0.8rem", color: colors.body, lineHeight: 1.8 }}>
              <div><strong style={{ color: colors.label }}>Name:</strong> {j.customer_name || "—"}</div>
              <div><strong style={{ color: colors.label }}>Email:</strong> {j.customer_email || "—"}</div>
              <div><strong style={{ color: colors.label }}>Phone:</strong> {j.customer_phone || "—"}</div>
            </div>
          </div>
        </div>

        {/* Agreements */}
        {(j.agreements || []).length > 0 && (
          <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
            <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Agreements</h3>
            {(j.agreements || []).map((agr: Agreement) => {
              const link = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${agr.id}`;
              return (
                <div key={agr.id} style={{ padding: "0.75rem", borderRadius: "8px", background: agr.status === "signed" ? "rgba(16,185,129,0.06)" : "rgba(249,115,22,0.05)", border: `1px solid ${agr.status === "signed" ? "rgba(16,185,129,0.2)" : "rgba(249,115,22,0.15)"}`, marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: colors.heading, fontSize: "0.8rem", fontWeight: 600 }}>Independent Contractor Agreement</span>
                      <span style={badgeStyle(agr.status === "signed" ? "success" : agr.status === "sent" ? "info" : agr.status === "viewed" ? "warning" : "muted")}>
                        {agr.status}
                      </span>
                    </div>
                    {agr.signed_at && <span style={{ color: colors.muted, fontSize: "0.65rem" }}>Signed {new Date(agr.signed_at).toLocaleDateString()}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      style={{ ...buttonPrimary, fontSize: "0.65rem", padding: "0.35rem 0.75rem" }}
                      onClick={async () => {
                        const detail = await apiFetch(`/api/agreements/jobs/${j.id}/agreements/${agr.id}`);
                        setViewingAgreement(detail);
                      }}
                    >
                      View Agreement
                    </button>
                    <button
                      style={{ ...buttonSecondary, fontSize: "0.65rem", padding: "0.35rem 0.75rem" }}
                      onClick={() => { navigator.clipboard.writeText(link); }}
                    >
                      Copy Link
                    </button>
                    {agr.status === "draft" && (
                      <button
                        style={{ ...buttonSecondary, fontSize: "0.65rem", padding: "0.35rem 0.75rem", color: colors.info }}
                        onClick={async () => {
                          await apiFetch(`/api/agreements/jobs/${j.id}/agreements/${agr.id}/send`, { method: "POST" });
                          loadJobDetail(j.id);
                        }}
                      >
                        Send to Customer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Agreement Viewer Modal */}
        {viewingAgreement && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setViewingAgreement(null)} />
            <div style={{ position: "relative", background: "white", borderRadius: "12px", maxWidth: "800px", width: "95%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Modal Header */}
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1a3550" }}>Agreement — {j.job_number}</h2>
                  <span style={badgeStyle(viewingAgreement.status === "signed" ? "success" : "muted")}>{viewingAgreement.status}</span>
                </div>
                <button onClick={() => setViewingAgreement(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#627d98" }}>&times;</button>
              </div>
              {/* Signature Info */}
              {viewingAgreement.signed_at && (
                <div style={{ padding: "0.75rem 1.5rem", background: "#ecfdf5", borderBottom: "1px solid #a7f3d0", flexShrink: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.75rem", color: "#059669" }}>
                    <div><strong>Signed:</strong> {new Date(viewingAgreement.signed_at).toLocaleString()}</div>
                    {viewingAgreement.signer_ip && <div><strong>IP:</strong> {viewingAgreement.signer_ip}</div>}
                  </div>
                  {viewingAgreement.signature_data && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <strong style={{ fontSize: "0.7rem", color: "#059669" }}>Signature:</strong>
                      <img src={viewingAgreement.signature_data} alt="Signature" style={{ display: "block", maxWidth: "300px", height: "60px", marginTop: "0.25rem", border: "1px solid #a7f3d0", borderRadius: "4px", background: "white", padding: "0.25rem" }} />
                    </div>
                  )}
                </div>
              )}
              {/* Agreement Body */}
              <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                <div dangerouslySetInnerHTML={{ __html: viewingAgreement.full_html }} />
              </div>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
          <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Milestones</h3>
          {j.milestones.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: `1px solid ${colors.borderLight}` }}>
              <span style={badgeStyle(m.status === "completed" ? "success" : "muted")}>{m.status}</span>
              <span style={{ color: colors.body, fontSize: "0.8rem", flex: 1 }}>{m.title}</span>
              {m.due_date && <span style={{ color: colors.muted, fontSize: "0.7rem" }}>Due: {m.due_date}</span>}
              {m.status !== "completed" && (
                <button
                  style={{ ...buttonSecondary, padding: "0.2rem 0.5rem", fontSize: "0.65rem" }}
                  onClick={() => completeMilestone(j.id, m.id)}
                >
                  Complete
                </button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Add milestone..."
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMilestone(j.id)}
            />
            <button style={{ ...buttonPrimary, fontSize: "0.75rem" }} onClick={() => addMilestone(j.id)}>Add</button>
          </div>
        </div>

        {/* Change Orders */}
        {j.change_orders.length > 0 && (
          <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
            <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Change Orders</h3>
            {j.change_orders.map((co) => (
              <div key={co.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: `1px solid ${colors.borderLight}` }}>
                <span style={badgeStyle(co.status === "approved" ? "success" : co.status === "rejected" ? "danger" : "warning")}>{co.status}</span>
                <span style={{ color: colors.body, fontSize: "0.8rem", flex: 1 }}>{co.title}</span>
                {co.amount && <span style={{ color: colors.accent, fontSize: "0.8rem" }}>{usd.format(co.amount)}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Invoices */}
        <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>Invoices</h3>
            <a
              href={`/desk/invoices?job=${j.id}&client=${encodeURIComponent(j.customer_name || "")}&address=${encodeURIComponent((j.job_address_line1 || "") + ", " + (j.job_address_city || "") + ", " + (j.job_address_state || "") + " " + (j.job_address_zip || ""))}`}
              style={{ ...buttonPrimary, fontSize: "0.7rem", padding: "0.3rem 0.75rem", textDecoration: "none" }}
            >
              + New Invoice
            </a>
          </div>
          {(j.invoices || []).length === 0 ? (
            <p style={{ color: colors.muted, fontSize: "0.8rem" }}>No invoices yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {(j.invoices || []).map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colors.accent }}>{inv.invoice_number}</td>
                    <td style={tdStyle}>{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : "—"}</td>
                    <td style={tdStyle}>{inv.total ? usd.format(parseFloat(String(inv.total))) : "—"}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(inv.status === "paid" ? "success" : inv.status === "sent" ? "info" : "muted")}>{inv.status}</span>
                    </td>
                    <td style={tdStyle}>
                      {inv.pdf_path && (
                        <button
                          style={{ ...buttonSecondary, padding: "0.2rem 0.5rem", fontSize: "0.65rem" }}
                          onClick={async () => {
                            const data = await apiFetch(`/api/invoices/${inv.id}/pdf`);
                            window.open(data.url, "_blank");
                          }}
                        >
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
          <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Messages {(j.messages || []).length > 0 && <span style={{ color: colors.muted, fontWeight: 400 }}>({(j.messages || []).length})</span>}
          </h3>
          <div style={{ maxHeight: "350px", overflowY: "auto", marginBottom: "0.75rem" }}>
            {(j.messages || []).length === 0 ? (
              <p style={{ color: colors.muted, fontSize: "0.8rem" }}>No messages yet</p>
            ) : (
              (j.messages || []).map((m) => (
                <div key={m.id} style={{ padding: "0.6rem 0.75rem", marginBottom: "0.5rem", borderRadius: "8px", background: m.sender_type === "admin" ? "rgba(249,115,22,0.06)" : "rgba(45,95,138,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.7rem", color: m.sender_type === "admin" ? colors.accent : colors.info }}>
                      {m.sender_name || (m.sender_type === "admin" ? "Admin" : "Customer")}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: colors.muted }}>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: colors.body, whiteSpace: "pre-wrap" }}>{m.body}</p>
                </div>
              ))
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && messageBody.trim()) {
                  e.preventDefault();
                  apiFetch(`/api/jobs/${j.id}/messages`, { method: "POST", body: JSON.stringify({ body: messageBody }) })
                    .then(() => { setMessageBody(""); loadJobDetail(j.id); });
                }
              }}
              placeholder="Type a message to the customer..."
            />
            <button
              style={{ ...buttonPrimary, fontSize: "0.75rem" }}
              onClick={() => {
                if (!messageBody.trim()) return;
                apiFetch(`/api/jobs/${j.id}/messages`, { method: "POST", body: JSON.stringify({ body: messageBody }) })
                  .then(() => { setMessageBody(""); loadJobDetail(j.id); });
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Notes */}
        {j.notes && (
          <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
            <h3 style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>Notes</h3>
            <p style={{ color: colors.body, fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>{j.notes}</p>
          </div>
        )}
      </div>
    );
  }

  // --- Create View ---
  if (view === "create") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button style={buttonSecondary} onClick={() => setView("list")}>&larr; Back</button>
          <h1 style={pageTitle as React.CSSProperties}>New Job</h1>
        </div>
        <div style={{ ...cardStyle, maxWidth: "800px" }}>
          <style>{`
            .job-form input, .job-form textarea, .job-form select {
              color: ${colors.heading} !important;
              background: ${colors.input} !important;
            }
            .job-form input::placeholder, .job-form textarea::placeholder {
              color: ${colors.muted} !important; opacity: 1;
            }
            .job-form option { background: ${colors.input}; color: ${colors.heading}; }
            .job-form input:focus, .job-form textarea:focus, .job-form select:focus {
              border-color: ${colors.inputFocus} !important;
            }
          `}</style>
          <div className="job-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Job Title</label>
              <input style={inputStyle} value={form.title} onChange={F("title")} placeholder="e.g. Winter Siding & Window Replacement" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Customer Email</label>
                <input style={inputStyle} value={form.customer_email} onChange={F("customer_email")} placeholder="client@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Customer Name</label>
                <input style={inputStyle} value={form.customer_name} onChange={F("customer_name")} placeholder="Tom Winter" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Service Type</label>
              <select style={inputStyle} value={form.service_type} onChange={F("service_type")}>
                <option value="">Select...</option>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Job Address</label>
              <input style={inputStyle} value={form.job_address_line1} onChange={F("job_address_line1")} placeholder="22 Ocean Blvd" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={form.job_address_city} onChange={F("job_address_city")} placeholder="Southern Shores" />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={form.job_address_state} onChange={F("job_address_state")} />
              </div>
              <div>
                <label style={labelStyle}>ZIP</label>
                <input style={inputStyle} value={form.job_address_zip} onChange={F("job_address_zip")} placeholder="27949" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Contract Amount ($)</label>
                <input style={inputStyle} type="number" value={form.contract_amount} onChange={F("contract_amount")} placeholder="45000" />
              </div>
              <div>
                <label style={labelStyle}>Deposit Amount ($)</label>
                <input style={inputStyle} type="number" value={form.deposit_amount} onChange={F("deposit_amount")} placeholder="15000" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Estimated Start</label>
                <input style={inputStyle} type="date" value={form.estimated_start} onChange={F("estimated_start")} />
              </div>
              <div>
                <label style={labelStyle}>Estimated End</label>
                <input style={inputStyle} type="date" value={form.estimated_end} onChange={F("estimated_end")} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Permit Status</label>
              <select style={inputStyle} value={form.permit_status} onChange={F("permit_status")}>
                <option value="na">N/A</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Scope of Work (HTML — generates agreement automatically)</label>
              <textarea
                style={{ ...inputStyle, minHeight: "200px", resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }}
                value={form.scope_of_work}
                onChange={F("scope_of_work")}
                placeholder={`<h4>AZEK LAP SIDING SYSTEM</h4>\n<p>Contractor shall remove and dispose of existing siding...</p>\n<h4>1. Demolition & Preparation</h4>\n<p>...</p>`}
              />
              <p style={{ color: colors.muted, fontSize: "0.65rem", marginTop: "0.25rem" }}>
                Leave blank to create job without an agreement. HTML from scope goes into the Independent Contractor Agreement.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.notes} onChange={F("notes")} placeholder="Internal notes..." />
            </div>

            {/* Onboard link after creation */}
            {onboardLink && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "1rem" }}>
                <p style={{ color: colors.success, fontWeight: 700, fontSize: "0.85rem", margin: "0 0 0.5rem" }}>Job created! Customer onboarding link:</p>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    readOnly
                    value={onboardLink}
                    style={{ ...inputStyle, flex: 1, fontSize: "0.75rem", background: "rgba(16,185,129,0.05)" }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button style={{ ...buttonPrimary, fontSize: "0.75rem", padding: "0.5rem 1rem", whiteSpace: "nowrap" }} onClick={copyLink}>
                    {linkCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                {form.customer_email && (
                  <p style={{ color: colors.body, fontSize: "0.7rem", marginTop: "0.5rem" }}>
                    Agreement also sent to {form.customer_email} via email.
                  </p>
                )}
                <button
                  style={{ ...buttonSecondary, marginTop: "0.75rem", fontSize: "0.75rem" }}
                  onClick={() => { setOnboardLink(null); setView("list"); setForm({ ...emptyForm }); }}
                >
                  Done — Go to Jobs List
                </button>
              </div>
            )}

            {!onboardLink && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button style={{ ...buttonPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleCreate} disabled={saving}>
                  {saving ? "Creating..." : "Create Job"}
                </button>
                <button style={buttonSecondary} onClick={() => setView("list")}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={pageTitle as React.CSSProperties}>Job Management</h1>
        <button style={buttonPrimary} onClick={() => { setForm({ ...emptyForm }); setView("create"); }}>+ New Job</button>
      </div>

      <div style={cardStyle}>
        <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Job #</th>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Service</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>ETA</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td style={{ ...tdStyle, fontWeight: 600, color: colors.accent }}>{j.job_number}</td>
                <td style={{ ...tdStyle, color: colors.heading }}>{j.title}</td>
                <td style={tdStyle}>{j.customer_name || j.customer_email || "—"}</td>
                <td style={tdStyle}>{j.service_type || "—"}</td>
                <td style={tdStyle}>{j.contract_amount ? usd.format(j.contract_amount) : "—"}</td>
                <td style={tdStyle}>
                  <span style={badgeStyle(STATUS_COLORS[j.status] || "muted")}>{j.status}</span>
                </td>
                <td style={{ ...tdStyle, fontSize: "0.7rem" }}>{j.estimated_start || "—"}</td>
                <td style={tdStyle}>
                  <button
                    style={{ ...buttonSecondary, padding: "0.2rem 0.6rem", fontSize: "0.7rem" }}
                    onClick={() => loadJobDetail(j.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {jobs.length === 0 && (
          <p style={{ color: colors.muted, textAlign: "center", padding: "2rem 0" }}>No jobs yet</p>
        )}
      </div>
    </div>
  );
}
