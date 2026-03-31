"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface Parcel {
  parcel: string;
  pin14: string;
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
  stapt: string;
  zipname: string;
  subdivision: string;
  totval: string;
}

export default function ParcelsPage() {
  const [searchType, setSearchType] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Parcel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    try {
      let url = "";
      switch (searchType) {
        case "search":
          url = `/api/parcels/search?term=${encodeURIComponent(query)}`;
          break;
        case "owner":
          url = `/api/parcels/by-owner?name=${encodeURIComponent(query)}`;
          break;
        case "street":
          url = `/api/parcels/by-street?name=${encodeURIComponent(query)}`;
          break;
        case "subdivision":
          url = `/api/parcels/by-subdivision?name=${encodeURIComponent(query)}`;
          break;
        case "town":
          url = `/api/parcels/by-town?name=${encodeURIComponent(query)}`;
          break;
      }

      const data = await apiFetch(url);

      if (searchType === "search") {
        // searchData.php returns flat array
        setResults(data);
        setTotal(data.length);
      } else {
        // WFS returns { totalFeatures, parcels }
        setResults(data.parcels || []);
        setTotal(data.totalFeatures || data.parcels?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const headers = [
      "parcel", "owner1", "owner2", "mailaddr1", "mailaddr2",
      "mailcity", "mailstate", "mailzip", "site_address", "subdivision", "totval",
    ];
    const rows = results.map((p) => [
      p.parcel, p.owner1, p.owner2 || "", p.mailaddr1, p.mailaddr2 || "",
      p.mailcity, p.mailstate, p.mailzip,
      [p.stnum, p.stdir, p.stname, p.stsuffix].filter(Boolean).join(" "),
      p.subdivision, p.totval,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parcels-${searchType}-${query}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dare County Parcels</h1>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="px-4 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white text-sm"
        >
          <option value="search">Quick Search</option>
          <option value="owner">By Owner</option>
          <option value="street">By Street</option>
          <option value="subdivision">By Subdivision</option>
          <option value="town">By Town</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search term..."
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-navy-400 text-sm focus:outline-none focus:border-sunrise-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-sunrise-600 hover:bg-sunrise-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2.5 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm transition border border-navy-600"
          >
            Export CSV
          </button>
        )}
      </form>

      {total > 0 && (
        <p className="text-sm text-navy-400 mb-4">
          {total.toLocaleString()} results
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-navy-700">
          <table className="w-full text-sm">
            <thead className="bg-navy-800 text-navy-300">
              <tr>
                <th className="px-4 py-3 text-left">Parcel</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Site Address</th>
                <th className="px-4 py-3 text-left">Mailing Address</th>
                <th className="px-4 py-3 text-left">Town</th>
                <th className="px-4 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {results.slice(0, 500).map((p, i) => (
                <tr key={i} className="hover:bg-navy-800/50">
                  <td className="px-4 py-2 text-navy-200 font-mono text-xs">
                    {p.parcel}
                  </td>
                  <td className="px-4 py-2 text-white">
                    {(p.owner1 || "").trim()}
                    {p.owner2?.trim() ? (
                      <span className="text-navy-400 block text-xs">
                        {p.owner2.trim()}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-navy-300 text-xs">
                    {[p.stnum, p.stdir, p.stname, p.stsuffix]
                      .filter((s) => s?.trim())
                      .join(" ")}
                  </td>
                  <td className="px-4 py-2 text-navy-300 text-xs">
                    {p.mailaddr1?.trim()}
                    {p.mailcity?.trim()
                      ? `, ${p.mailcity.trim()}, ${p.mailstate?.trim()} ${p.mailzip?.trim()}`
                      : ""}
                  </td>
                  <td className="px-4 py-2 text-navy-400 text-xs">
                    {(p.zipname || "").trim()}
                  </td>
                  <td className="px-4 py-2 text-navy-200 text-right font-mono text-xs">
                    {p.totval
                      ? `$${Number(p.totval).toLocaleString()}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
