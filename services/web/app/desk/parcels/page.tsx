"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface Parcel {
  parcel: string;
  pin: string;
  owner1: string;
  owner2: string;
  mailaddr1: string;
  mailaddr2: string;
  mailcity: string;
  mailstate: string;
  mailzip: string;
  stnum: string;
  stdir: string;
  stname: string;
  stsuffix: string;
  zipname: string;
  subdivision: string;
  totval: number;
  landval: number;
  bldgval: number;
}

interface Stats {
  total: number;
  synced: boolean;
  towns: Array<{ town: string; count: string; out_of_town: string; avg_value: string; high_value: string }>;
  valueDistribution: Record<string, string>;
}

interface FilterResult {
  total: number;
  parcels: Parcel[];
  towns: Array<{ town: string; count: string }>;
}

const TARGET_TOWNS = [
  "KILL DEVIL HILLS", "NAGS HEAD", "KITTY HAWK",
  "SOUTHERN SHORES", "DUCK", "MANTEO", "COLINGTON",
  "COROLLA", "AVON", "BUXTON", "FRISCO", "HATTERAS",
  "RODANTHE", "WAVES", "SALVO", "WANCHESE",
];

export default function ParcelsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<FilterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filter state
  const [selectedTowns, setSelectedTowns] = useState<string[]>(["KILL DEVIL HILLS", "NAGS HEAD", "KITTY HAWK", "SOUTHERN SHORES", "DUCK"]);
  const [minValue, setMinValue] = useState("500000");
  const [maxValue, setMaxValue] = useState("");
  const [outOfTownOnly, setOutOfTownOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("totval");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await apiFetch("/api/parcels/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }

  const runFilter = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTowns.length > 0) params.set("towns", selectedTowns.join(","));
      if (minValue) params.set("minValue", minValue);
      if (maxValue) params.set("maxValue", maxValue);
      if (outOfTownOnly) params.set("outOfTownOnly", "true");
      if (search) params.set("search", search);
      params.set("sort", sort);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(pageNum * PAGE_SIZE));

      const data = await apiFetch(`/api/parcels/filter?${params}`);
      setResults(data);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTowns, minValue, maxValue, outOfTownOnly, search, sort]);

  async function handleSync() {
    setSyncing(true);
    try {
      const data = await apiFetch("/api/parcels/sync", { method: "POST", body: "{}" });
      alert(`Synced ${data.synced.toLocaleString()} parcels from Dare County GIS`);
      loadStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }

  function toggleTown(town: string) {
    setSelectedTowns((prev) =>
      prev.includes(town) ? prev.filter((t) => t !== town) : [...prev, town]
    );
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (selectedTowns.length > 0) params.set("towns", selectedTowns.join(","));
    if (minValue) params.set("minValue", minValue);
    if (maxValue) params.set("maxValue", maxValue);
    if (outOfTownOnly) params.set("outOfTownOnly", "true");
    if (search) params.set("search", search);

    const token = document.cookie.match(/sunriseobx_token=([^;]+)/)?.[1] || "";
    window.open(`/api/parcels/export?${params}&token=${token}`, "_blank");
  }

  const fmt = (n: number | string) => Number(n).toLocaleString();
  const fmtMoney = (n: number | string) => `$${Number(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dare County Property Database</h1>
          <p className="text-navy-400 text-sm mt-1">
            {stats?.synced
              ? `${fmt(stats.total)} parcels cached locally`
              : "Not synced yet — click Sync to load data"}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm font-medium transition border border-navy-600 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync from GIS"}
        </button>
      </div>

      {/* Stats cards */}
      {stats?.synced && stats.valueDistribution && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Under $250k", value: stats.valueDistribution.under_250k, color: "text-navy-300" },
            { label: "$250k–$500k", value: stats.valueDistribution.v250_500k, color: "text-navy-200" },
            { label: "$500k–$1M", value: stats.valueDistribution.v500k_1m, color: "text-sunrise-400" },
            { label: "$1M–$2M", value: stats.valueDistribution.v1m_2m, color: "text-sunrise-300" },
            { label: "$2M+", value: stats.valueDistribution.over_2m, color: "text-sunrise-200" },
          ].map((s) => (
            <div key={s.label} className="bg-navy-800 rounded-xl border border-navy-700 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{fmt(s.value)}</p>
              <p className="text-xs text-navy-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Filter Properties</h2>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-navy-200 rounded-lg text-xs font-medium transition border border-navy-600">
              Export CSV
            </button>
            <button
              onClick={() => runFilter(0)}
              disabled={loading}
              className="px-4 py-1.5 bg-sunrise-600 hover:bg-sunrise-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Towns */}
        <div>
          <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Towns</label>
          <div className="flex flex-wrap gap-2">
            {TARGET_TOWNS.map((town) => (
              <button
                key={town}
                onClick={() => toggleTown(town)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  selectedTowns.includes(town)
                    ? "bg-sunrise-600/20 text-sunrise-400 border-sunrise-500/30"
                    : "bg-navy-700 text-navy-400 border-navy-600 hover:text-navy-200"
                }`}
              >
                {town}
              </button>
            ))}
          </div>
        </div>

        {/* Value + toggles */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Min Value</label>
            <select
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
            >
              <option value="">Any</option>
              <option value="250000">$250,000</option>
              <option value="500000">$500,000</option>
              <option value="750000">$750,000</option>
              <option value="1000000">$1,000,000</option>
              <option value="1500000">$1,500,000</option>
              <option value="2000000">$2,000,000</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Max Value</label>
            <select
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
            >
              <option value="">Any</option>
              <option value="500000">$500,000</option>
              <option value="1000000">$1,000,000</option>
              <option value="2000000">$2,000,000</option>
              <option value="5000000">$5,000,000</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-400 uppercase tracking-wider block mb-2">Owner Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or address..."
              className="w-full px-3 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm placeholder-navy-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer py-2.5">
              <input
                type="checkbox"
                checked={outOfTownOnly}
                onChange={(e) => setOutOfTownOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-sunrise-500"
              />
              <span className="text-sm text-navy-200 font-medium">Out-of-town owners only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Result stats */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-white font-bold text-lg">{fmt(results.total)} properties</p>
              <div className="flex flex-wrap gap-2">
                {results.towns.slice(0, 8).map((t) => (
                  <span key={t.town} className="px-2 py-1 bg-navy-800 text-navy-300 rounded text-xs border border-navy-700">
                    {t.town}: {fmt(t.count)}
                  </span>
                ))}
              </div>
            </div>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); runFilter(0); }}
              className="px-3 py-1.5 bg-navy-700 border border-navy-600 rounded-lg text-navy-200 text-xs"
            >
              <option value="totval">Sort by Value (High→Low)</option>
              <option value="owner1">Sort by Owner Name</option>
              <option value="zipname">Sort by Town</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-navy-700">
            <table className="w-full text-sm">
              <thead className="bg-navy-800 text-navy-400">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Mailing Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">OBX Property</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Town</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {results.parcels.map((p, i) => (
                  <tr key={i} className="hover:bg-navy-800/50 transition">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{(p.owner1 || "").trim()}</p>
                      {p.owner2?.trim() && (
                        <p className="text-navy-400 text-xs">{p.owner2.trim()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-navy-200 text-xs">{(p.mailaddr1 || "").trim()}</p>
                      <p className="text-navy-400 text-xs">
                        {(p.mailcity || "").trim()}, {(p.mailstate || "").trim()} {(p.mailzip || "").trim()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-navy-300 text-xs">
                      {[p.stnum, p.stdir, p.stname, p.stsuffix].filter((s) => s?.trim()).join(" ")}
                    </td>
                    <td className="px-4 py-3 text-navy-400 text-xs">{(p.zipname || "").trim()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sunrise-400 font-mono text-sm font-medium">
                        {p.totval ? fmtMoney(p.totval) : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {results.total > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-navy-400 text-sm">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, results.total)} of {fmt(results.total)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => runFilter(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 bg-navy-700 text-navy-300 rounded-lg text-sm disabled:opacity-30 hover:bg-navy-600 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => runFilter(page + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= results.total}
                  className="px-3 py-1.5 bg-navy-700 text-navy-300 rounded-lg text-sm disabled:opacity-30 hover:bg-navy-600 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
