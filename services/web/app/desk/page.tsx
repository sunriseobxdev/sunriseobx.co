"use client";

import { useAuthStore } from "@/lib/store";
import Link from "next/link";

const quickLinks = [
  { href: "/desk/parcels", label: "Search Parcels", desc: "Browse Dare County property records", icon: "🗺️" },
  { href: "/desk/cms", label: "Manage Content", desc: "Edit blog posts, projects, and pages", icon: "📝" },
  { href: "/desk/campaigns", label: "Campaigns", desc: "Create and manage mailing campaigns", icon: "📬" },
  { href: "/desk/trade", label: "Trading Desk", desc: "View positions and place orders", icon: "📈" },
];

export default function DeskDashboard() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
      </h1>
      <p className="text-navy-400 mb-8">Sunrise Construction Admin Dashboard</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-6 bg-navy-800 rounded-xl border border-navy-700 hover:border-sunrise-500/50 transition group"
          >
            <div className="text-3xl mb-3">{link.icon}</div>
            <h3 className="text-white font-semibold group-hover:text-sunrise-400 transition">
              {link.label}
            </h3>
            <p className="text-sm text-navy-400 mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Dare County GIS</h2>
          <p className="text-navy-400 text-sm mb-4">
            47,869 property records available. Search by owner, address, street, subdivision, or town.
          </p>
          <Link
            href="/desk/parcels"
            className="inline-block px-4 py-2 bg-sunrise-600/20 text-sunrise-400 rounded-lg text-sm hover:bg-sunrise-600/30 transition"
          >
            Open Parcel Search
          </Link>
        </div>

        <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-sunrise-400">47,869</p>
              <p className="text-xs text-navy-400">County Parcels</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">5</p>
              <p className="text-xs text-navy-400">Services Offered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
