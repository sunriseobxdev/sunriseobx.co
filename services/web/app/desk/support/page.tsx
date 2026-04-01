"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  cardStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary,
  badgeStyle, colors, pageTitle, tableStyle, thStyle, tdStyle,
} from "@/lib/desk-styles";

interface Ticket {
  id: string;
  ticket_number: string;
  customer_name: string | null;
  customer_email: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  message_count: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  body: string;
  created_at: string;
}

interface TicketDetail extends Ticket {
  messages: Message[];
}

type View = "list" | "detail";

const STATUS_BADGE: Record<string, "success" | "warning" | "info" | "muted" | "danger"> = {
  open: "warning",
  in_progress: "info",
  closed: "muted",
};

const PRIORITY_BADGE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  low: "muted",
  normal: "info" as "muted",
  high: "warning",
  urgent: "danger",
};

export default function SupportPage() {
  const [view, setView] = useState<View>("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const data = await apiFetch("/api/support/tickets");
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTicket(id: string) {
    const data = await apiFetch(`/api/support/tickets/${id}`);
    setSelected(data);
    setView("detail");
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await apiFetch(`/api/support/tickets/${selected.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: reply }),
      });
      setReply("");
      loadTicket(selected.id);
      loadTickets();
    } catch {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/api/support/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    loadTickets();
    if (selected?.id === id) loadTicket(id);
  }

  if (view === "detail" && selected) {
    const t = selected;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button style={buttonSecondary} onClick={() => { setView("list"); setSelected(null); }}>&larr; Back</button>
          <h1 style={{ ...pageTitle, margin: 0 } as React.CSSProperties}>{t.ticket_number} — {t.subject}</h1>
          <span style={badgeStyle(STATUS_BADGE[t.status] || "muted")}>{t.status}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: "1.5rem" }}>
          {/* Messages */}
          <div style={cardStyle}>
            <div style={{ maxHeight: "500px", overflowY: "auto", marginBottom: "1rem" }}>
              {t.messages.map((m) => (
                <div key={m.id} style={{
                  padding: "0.75rem", marginBottom: "0.5rem", borderRadius: "8px",
                  background: m.sender_type === "admin" ? "rgba(249,115,22,0.08)" : `rgba(45,95,138,0.1)`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.75rem", color: m.sender_type === "admin" ? colors.accent : colors.info }}>
                      {m.sender_name || (m.sender_type === "admin" ? "Support" : "Customer")}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: colors.muted }}>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: colors.body, whiteSpace: "pre-wrap" }}>{m.body}</p>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>

            {t.status !== "closed" && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                  placeholder="Type a reply..."
                />
                <button style={{ ...buttonPrimary, fontSize: "0.75rem" }} onClick={sendReply} disabled={sending}>
                  {sending ? "..." : "Send"}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={cardStyle}>
            <h3 style={{ color: colors.heading, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>Details</h3>
            <div style={{ fontSize: "0.75rem", color: colors.body, lineHeight: 2 }}>
              <div><strong style={{ color: colors.label }}>Customer:</strong> {t.customer_name || "—"}</div>
              <div><strong style={{ color: colors.label }}>Email:</strong> {t.customer_email}</div>
              <div><strong style={{ color: colors.label }}>Category:</strong> {t.category}</div>
              <div><strong style={{ color: colors.label }}>Priority:</strong> <span style={badgeStyle(PRIORITY_BADGE[t.priority] || "muted")}>{t.priority}</span></div>
              <div><strong style={{ color: colors.label }}>Created:</strong> {new Date(t.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {t.status !== "closed" && (
                <button style={{ ...buttonSecondary, fontSize: "0.7rem", width: "100%" }} onClick={() => updateStatus(t.id, "closed")}>Close Ticket</button>
              )}
              {t.status === "closed" && (
                <button style={{ ...buttonSecondary, fontSize: "0.7rem", width: "100%" }} onClick={() => updateStatus(t.id, "open")}>Reopen</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={pageTitle as React.CSSProperties}>Support Tickets</h1>

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Ticket</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Subject</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Messages</th>
              <th style={thStyle}>Updated</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td style={{ ...tdStyle, fontWeight: 600, color: colors.accent }}>{t.ticket_number}</td>
                <td style={tdStyle}>{t.customer_name || t.customer_email}</td>
                <td style={{ ...tdStyle, color: colors.heading }}>{t.subject}</td>
                <td style={tdStyle}>{t.category}</td>
                <td style={tdStyle}><span style={badgeStyle(STATUS_BADGE[t.status] || "muted")}>{t.status}</span></td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{t.message_count}</td>
                <td style={{ ...tdStyle, fontSize: "0.7rem" }}>{new Date(t.updated_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button style={{ ...buttonSecondary, padding: "0.2rem 0.6rem", fontSize: "0.7rem" }} onClick={() => loadTicket(t.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <p style={{ color: colors.muted, textAlign: "center", padding: "2rem 0" }}>No support tickets</p>
        )}
      </div>
    </div>
  );
}
