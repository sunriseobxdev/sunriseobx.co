"use client";

import { useState, useEffect } from "react";
import { customerFetch, useCustomer } from "@/lib/customer";

export default function CustomerProfilePage() {
  const { customer } = useCustomer();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (customer) {
      customerFetch("/customer/auth/me").then((data) => {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address_line1: data.address_line1 || "",
          address_line2: data.address_line2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        });
      });
    }
  }, [customer]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await customerFetch("/customer/auth/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: "100%", padding: "0.65rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "0.85rem", boxSizing: "border-box" as const };
  const labelStyle = { display: "block", fontSize: "0.7rem", fontWeight: 600 as const, color: "#334e68", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a3550", marginBottom: "0.5rem" }}>My Profile</h1>
      <p style={{ color: "#627d98", fontSize: "0.85rem", marginBottom: "2rem" }}>Update your contact information and billing details.</p>

      <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", border: "1px solid #e2e8f0", maxWidth: "600px" }}>
        {saved && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", padding: "0.6rem 1rem", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem" }}>
            Profile saved successfully.
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Email</label>
          <input value={customer?.email || ""} disabled style={{ ...inputStyle, background: "#f0f4f8", color: "#627d98" }} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(252) 555-1234" />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Address</label>
          <input style={{ ...inputStyle, marginBottom: "0.5rem" }} value={form.address_line1} onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))} placeholder="Street address" />
          <input style={inputStyle} value={form.address_line2} onChange={(e) => setForm((p) => ({ ...p, address_line2: e.target.value }))} placeholder="Apt, suite, etc. (optional)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={labelStyle}>City</label>
            <input style={inputStyle} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <input style={inputStyle} value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>ZIP</label>
            <input style={inputStyle} value={form.zip} onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "0.7rem 1.5rem", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
