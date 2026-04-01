"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { customerFetch, useCustomer } from "@/lib/customer";

interface Job {
  id: string;
  job_number: string;
  title: string;
  status: string;
  service_type: string;
  estimated_start: string | null;
  estimated_end: string | null;
  contract_amount: number | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#627d98", bg: "#f0f4f8" },
  pending: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  active: { label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
  paused: { label: "Paused", color: "#d97706", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#059669", bg: "#ecfdf5" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2" },
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function PortalDashboard() {
  const { customer } = useCustomer();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    customerFetch("/customer/jobs")
      .then(setJobs)
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a3550", marginBottom: "0.5rem" }}>
        Welcome{customer?.full_name ? `, ${customer.full_name}` : ""}
      </h1>
      <p style={{ color: "#627d98", fontSize: "0.9rem", marginBottom: "2rem" }}>
        View your projects, documents, and payment history.
      </p>

      {jobs.length === 0 ? (
        <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#627d98", fontSize: "0.9rem" }}>No active projects yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {jobs.map((job) => {
            const s = STATUS_LABELS[job.status] || STATUS_LABELS.draft;
            return (
              <Link
                key={job.id}
                href={`/portal/jobs/${job.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "1.25rem 1.5rem",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 700, color: "#f97316", fontSize: "0.85rem" }}>{job.job_number}</span>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, color: s.color, background: s.bg }}>{s.label}</span>
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1a3550", margin: 0 }}>{job.title}</h3>
                    {job.service_type && <p style={{ color: "#627d98", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{job.service_type}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {job.contract_amount && (
                      <div style={{ fontWeight: 700, color: "#1a3550", fontSize: "0.95rem" }}>{usd.format(job.contract_amount)}</div>
                    )}
                    {job.estimated_start && (
                      <div style={{ color: "#627d98", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        ETA: {new Date(job.estimated_start).toLocaleDateString()}
                      </div>
                    )}
                    <span style={{ color: "#f97316", fontSize: "0.8rem", fontWeight: 600 }}>View Details &rarr;</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
