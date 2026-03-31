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

const TARGET_TOWNS = [
  "KILL DEVIL HILLS", "NAGS HEAD", "KITTY HAWK",
  "SOUTHERN SHORES", "DUCK", "MANTEO", "COLINGTON",
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [populatingId, setPopulatingId] = useState<string | null>(null);

  // Advanced filter state for new campaign
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedTowns, setSelectedTowns] = useState<string[]>(["KILL DEVIL HILLS", "NAGS HEAD", "KITTY HAWK", "SOUTHERN SHORES", "DUCK"]);
  const [minValue, setMinValue] = useState("500000");
  const [outOfTownOnly, setOutOfTownOnly] = useState(true);

  // Preview count
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setCampaigns(await apiFetch("/api/campaigns") || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function previewFilter() {
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTowns.length > 0) params.set("towns", selectedTowns.join(","));
      if (minValue) params.set("minValue", minValue);
      if (outOfTownOnly) params.set("outOfTownOnly", "true");
      params.set("limit", "1");
      const data = await apiFetch(`/api/parcels/filter?${params}`);
      setPreviewCount(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Store filter as JSON in filter_value
      const filterPayload = JSON.stringify({
        towns: selectedTowns,
        minValue: minValue ? parseFloat(minValue) : null,
        outOfTownOnly,
      });
      await apiFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          subject,
          body_html: bodyHtml,
          filter_type: "advanced",
          filter_value: filterPayload,
        }),
      });
      setShowCreate(false);
      setName("");
      setSubject("");
      setBodyHtml("");
      setPreviewCount(null);
      loadCampaigns();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePopulate(id: string) {
    setPopulatingId(id);
    try {
      // Get campaign filter and pass as body
      const campaign = campaigns.find((c) => c.id === id);
      let body = {};
      if (campaign?.filter_type === "advanced" && campaign?.filter_value) {
        try { body = JSON.parse(campaign.filter_value); } catch { /* ignore */ }
      }

      const data = await apiFetch(`/api/campaigns/${id}/populate`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      alert(`Populated ${data.populated.toLocaleString()} recipients from ${data.total_parcels.toLocaleString()} matching parcels`);
      loadCampaigns();
    } catch (err) {
      console.error(err);
    } finally {
      setPopulatingId(null);
    }
  }

  function exportRecipients(id: string) {
    const token = document.cookie.match(/sunriseobx_token=([^;]+)/)?.[1] || "";
    window.open(`/api/campaigns/${id}/export?token=${token}`, "_blank");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
    loadCampaigns();
  }

  function toggleTown(town: string) {
    setSelectedTowns((prev) =>
      prev.includes(town) ? prev.filter((t) => t !== town) : [...prev, town]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mailing Campaigns</h1>
          <p className="text-navy-400 text-sm mt-1">Create targeted direct mail campaigns from the Dare County property database</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); if (!showCreate) previewFilter(); }}
          className="px-5 py-2.5 bg-sunrise-600 hover:bg-sunrise-500 text-white rounded-lg text-sm font-bold transition"
        >
          {showCreate ? "Cancel" : "New Campaign"}
        </button>
      </div>

      {/* Create campaign form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-navy-800 rounded-xl border border-navy-700 p-6 space-y-5">
          <h2 className="text-lg font-bold text-white">Create Campaign</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Campaign Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm" placeholder="e.g. Winter 2026 — Duck Oceanfront" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Email Subject (optional)</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm" placeholder="Your Outer Banks home deserves the best" />
            </div>
          </div>

          {/* Target filter */}
          <div className="bg-navy-900/50 rounded-xl p-5 space-y-4 border border-navy-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Target Audience</h3>
              {previewCount !== null && (
                <span className="px-3 py-1 bg-sunrise-600/20 text-sunrise-400 rounded-full text-sm font-bold">
                  {previewCount.toLocaleString()} properties match
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Towns</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_TOWNS.map((town) => (
                  <button type="button" key={town} onClick={() => { toggleTown(town); setTimeout(previewFilter, 100); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      selectedTowns.includes(town) ? "bg-sunrise-600/20 text-sunrise-400 border-sunrise-500/30" : "bg-navy-700 text-navy-400 border-navy-600"
                    }`}
                  >
                    {town}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Min Property Value</label>
                <select value={minValue} onChange={(e) => { setMinValue(e.target.value); setTimeout(previewFilter, 100); }}
                  className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm">
                  <option value="">Any</option>
                  <option value="250000">$250,000</option>
                  <option value="500000">$500,000</option>
                  <option value="750000">$750,000</option>
                  <option value="1000000">$1,000,000</option>
                  <option value="2000000">$2,000,000</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer py-2.5">
                  <input type="checkbox" checked={outOfTownOnly} onChange={(e) => { setOutOfTownOnly(e.target.checked); setTimeout(previewFilter, 100); }} className="w-4 h-4 rounded accent-sunrise-500" />
                  <span className="text-sm text-navy-200 font-medium">Out-of-town owners only</span>
                </label>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={previewFilter} disabled={previewLoading}
                  className="px-4 py-2.5 bg-navy-600 hover:bg-navy-500 text-white rounded-lg text-sm transition">
                  {previewLoading ? "Counting..." : "Preview Count"}
                </button>
              </div>
            </div>
          </div>

          {/* Email body */}
          <div>
            <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Email / Letter Body (HTML)</label>
            <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={6}
              className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm font-mono"
              placeholder="Dear {owner_name},&#10;&#10;I'm writing to you regarding your property at {site_address} in {town}..." />
          </div>

          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-sunrise-600 hover:bg-sunrise-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50">
            Create Campaign
          </button>
        </form>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-navy-800 rounded-xl border border-navy-700 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-bold truncate">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    c.status === "sent" ? "bg-green-900/30 text-green-400 border border-green-800/30"
                    : "bg-navy-700 text-navy-300 border border-navy-600"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-navy-400 mt-1">
                  {c.total_recipients > 0 ? `${c.total_recipients.toLocaleString()} recipients` : "No recipients yet"}
                  {c.total_sent > 0 && ` · ${c.total_sent.toLocaleString()} sent`}
                  {" · "}{new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.status === "draft" && (
                  <button onClick={() => handlePopulate(c.id)} disabled={populatingId === c.id}
                    className="px-3 py-1.5 bg-sunrise-600/20 text-sunrise-400 rounded-lg text-xs font-semibold hover:bg-sunrise-600/30 transition disabled:opacity-50">
                    {populatingId === c.id ? "Loading..." : "Populate Recipients"}
                  </button>
                )}
                {c.total_recipients > 0 && (
                  <button onClick={() => exportRecipients(c.id)}
                    className="px-3 py-1.5 bg-navy-700 text-navy-200 rounded-lg text-xs font-medium hover:bg-navy-600 transition border border-navy-600">
                    Export CSV
                  </button>
                )}
                <button onClick={() => handleDelete(c.id)}
                  className="px-3 py-1.5 bg-red-900/20 text-red-400 rounded-lg text-xs hover:bg-red-900/30 transition">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="bg-navy-800 rounded-xl border border-navy-700 p-12 text-center">
            <p className="text-navy-400 text-lg mb-2">No campaigns yet</p>
            <p className="text-navy-500 text-sm">Create your first targeted mailing campaign to reach Outer Banks property owners</p>
          </div>
        )}
      </div>
    </div>
  );
}
