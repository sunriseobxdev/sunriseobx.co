"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  filter_type: string;
  filter_value: string;
  total_recipients: number;
  total_sent: number;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body_html: "",
    filter_type: "town",
    filter_value: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const data = await apiFetch("/api/campaigns");
      setCampaigns(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: "", subject: "", body_html: "", filter_type: "town", filter_value: "" });
      loadCampaigns();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePopulate(id: string) {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/campaigns/${id}/populate`, {
        method: "POST",
      });
      alert(`Populated ${data.populated} recipients from ${data.total_parcels} parcels`);
      loadCampaigns();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
      loadCampaigns();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Mailing Campaigns</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-sunrise-600 hover:bg-sunrise-700 text-white rounded-lg text-sm font-medium transition"
        >
          New Campaign
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-navy-800 rounded-xl border border-navy-700 p-6 mb-6 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-300 mb-1">Campaign Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1">Email Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy-300 mb-1">Filter Type</label>
              <select
                value={form.filter_type}
                onChange={(e) => setForm({ ...form, filter_type: e.target.value })}
                className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
              >
                <option value="owner">Owner</option>
                <option value="street">Street</option>
                <option value="subdivision">Subdivision</option>
                <option value="town">Town</option>
                <option value="cql">Custom CQL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-navy-300 mb-1">Filter Value</label>
              <input
                value={form.filter_value}
                onChange={(e) => setForm({ ...form, filter_value: e.target.value })}
                placeholder={form.filter_type === "town" ? "e.g. NAGS HEAD" : ""}
                className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-navy-300 mb-1">Email Body (HTML)</label>
            <textarea
              value={form.body_html}
              onChange={(e) => setForm({ ...form, body_html: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-sunrise-600 hover:bg-sunrise-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            Create Campaign
          </button>
        </form>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="bg-navy-800 rounded-xl border border-navy-700 p-5 flex items-center justify-between"
          >
            <div>
              <h3 className="text-white font-semibold">{c.name}</h3>
              <p className="text-sm text-navy-400">
                {c.filter_type}: {c.filter_value} | {c.total_recipients} recipients
                {c.total_sent > 0 && ` | ${c.total_sent} sent`}
              </p>
              <p className="text-xs text-navy-500 mt-1">
                {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  c.status === "sent"
                    ? "bg-green-900/50 text-green-400"
                    : "bg-navy-700 text-navy-300"
                }`}
              >
                {c.status}
              </span>
              {c.status === "draft" && (
                <button
                  onClick={() => handlePopulate(c.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-sunrise-600/20 text-sunrise-400 rounded text-xs hover:bg-sunrise-600/30 transition"
                >
                  Populate Recipients
                </button>
              )}
              <button
                onClick={() => handleDelete(c.id)}
                className="px-3 py-1 bg-red-900/20 text-red-400 rounded text-xs hover:bg-red-900/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-navy-400 text-center py-8">No campaigns yet</p>
        )}
      </div>
    </div>
  );
}
