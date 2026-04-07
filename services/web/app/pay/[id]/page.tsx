"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const InvoicePaymentForm = dynamic(() => import("@/components/InvoicePaymentForm"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  issue_date: string;
  due_date: string;
  line_items: { description: string; quantity: number; rate: number; amount: number }[];
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  notes: string;
  status: string;
  paid_at: string | null;
}

export default function InvoicePayPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`${API_URL}/api/invoices/public/${params.id}`)
        .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
        .then(setInvoice)
        .catch(() => setError("Invoice not found"));
    }
  }, [params.id]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "2rem", textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ color: "#1a3550" }}>Invoice Not Found</h2>
          <p style={{ color: "#627d98" }}>This invoice may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <div style={{ color: "#627d98", textAlign: "center", padding: "3rem" }}>Loading invoice...</div>;
  }

  const isPaid = invoice.status === "paid";
  const items = invoice.line_items || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ background: "white", borderRadius: "12px", padding: "2rem", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#1a3550" }}>Sunrise Construction</h1>
              <p style={{ margin: "0.25rem 0 0", color: "#627d98", fontSize: "0.8rem" }}>121 Pine Grove Lane, Point Harbor, NC 27964</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: "#1a3550", fontSize: "1rem" }}>{invoice.invoice_number}</div>
              {isPaid ? (
                <span style={{ display: "inline-block", padding: "0.2rem 0.8rem", background: "#ecfdf5", color: "#059669", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
                  PAID
                </span>
              ) : (
                <span style={{ display: "inline-block", padding: "0.2rem 0.8rem", background: "#fffbeb", color: "#d97706", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
                  DUE {new Date(invoice.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#334e68", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>Bill To</div>
              <div>{invoice.client_name}</div>
              {invoice.client_email && <div style={{ color: "#627d98" }}>{invoice.client_email}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</div>
              <div>Due: {new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Line Items */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#627d98", fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0", color: "#627d98", fontWeight: 600, width: "60px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0", color: "#627d98", fontWeight: 600, width: "80px" }}>Rate</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0", color: "#627d98", fontWeight: 600, width: "90px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <td style={{ padding: "0.6rem 0", color: "#334e68" }}>{item.description}</td>
                  <td style={{ textAlign: "right", padding: "0.6rem 0", color: "#334e68" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "0.6rem 0", color: "#334e68" }}>{usd.format(item.rate)}</td>
                  <td style={{ textAlign: "right", padding: "0.6rem 0", color: "#334e68", fontWeight: 500 }}>{usd.format(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ borderTop: "2px solid #e2e8f0", marginTop: "0.5rem", paddingTop: "0.75rem", display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "200px", marginBottom: "0.25rem" }}>
              <span style={{ color: "#627d98" }}>Subtotal</span>
              <span style={{ color: "#334e68" }}>{usd.format(Number(invoice.subtotal))}</span>
            </div>
            {Number(invoice.tax_amount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", width: "200px", marginBottom: "0.25rem" }}>
                <span style={{ color: "#627d98" }}>Tax ({(Number(invoice.tax_rate) * 100).toFixed(1)}%)</span>
                <span style={{ color: "#334e68" }}>{usd.format(Number(invoice.tax_amount))}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", width: "200px", fontWeight: 700, fontSize: "1.05rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
              <span style={{ color: "#1a3550" }}>Total</span>
              <span style={{ color: "#1a3550" }}>{usd.format(Number(invoice.total))}</span>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: "1.5rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", fontSize: "0.8rem", color: "#627d98" }}>
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}
        </div>

        {/* Payment Section */}
        {isPaid ? (
          <div style={{ background: "#ecfdf5", borderRadius: "12px", padding: "1.5rem", border: "1px solid #a7f3d0", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#10003;</div>
            <h3 style={{ color: "#059669", fontWeight: 700, margin: "0 0 0.25rem" }}>Paid in Full</h3>
            <p style={{ color: "#047857", fontSize: "0.85rem", margin: 0 }}>
              {invoice.paid_at ? `Paid on ${new Date(invoice.paid_at).toLocaleDateString()}` : "Thank you for your payment!"}
            </p>
          </div>
        ) : !showPayment ? (
          <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ color: "#334e68", fontSize: "0.9rem", margin: "0 0 1rem" }}>
              Amount due: <strong style={{ fontSize: "1.2rem", color: "#1a3550" }}>{usd.format(Number(invoice.total))}</strong>
            </p>
            <button
              onClick={() => setShowPayment(true)}
              style={{ padding: "0.75rem 2.5rem", background: "#059669", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
            >
              Pay Now
            </button>
            <p style={{ color: "#627d98", fontSize: "0.7rem", marginTop: "0.75rem" }}>Secure payment powered by Stripe</p>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a3550", marginBottom: "0.25rem" }}>
              Pay Invoice &mdash; {usd.format(Number(invoice.total))}
            </h3>
            <p style={{ color: "#627d98", fontSize: "0.75rem", marginBottom: "1rem" }}>
              Secure payment powered by Stripe. Your card details never touch our servers.
            </p>
            <InvoicePaymentForm
              invoiceId={invoice.id}
              onSuccess={() => {
                fetch(`${API_URL}/api/invoices/public/${params.id}`)
                  .then((r) => r.json())
                  .then(setInvoice);
                setShowPayment(false);
              }}
              onCancel={() => setShowPayment(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
