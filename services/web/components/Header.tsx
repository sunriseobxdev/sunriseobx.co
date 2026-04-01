"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-navy-900/95 backdrop-blur-sm border-b border-navy-700">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/img/Sunrise-Logo-No-Text.svg" alt="Sunrise" width={32} height={32} />
          <span className="text-xl font-bold text-white">
            <span className="text-sunrise-500">Sunrise</span> Construction
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/services" className="text-navy-200 hover:text-white transition text-sm font-medium">
            Services
          </Link>
          <Link href="/projects" className="text-navy-200 hover:text-white transition text-sm font-medium">
            Projects
          </Link>
          <Link href="/about" className="text-navy-200 hover:text-white transition text-sm font-medium">
            About
          </Link>
          <Link href="/blog" className="text-navy-200 hover:text-white transition text-sm font-medium">
            Blog
          </Link>
          <Link href="/contact" className="text-navy-200 hover:text-white transition text-sm font-medium">
            Contact
          </Link>
          <Link
            href="/portal/login"
            className="text-navy-400 hover:text-white transition text-sm font-medium"
            title="Customer Portal"
          >
            Log In
          </Link>
          <Link
            href="/contact"
            className="bg-sunrise-600 hover:bg-sunrise-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Get a Quote
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-2"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-navy-800 border-t border-navy-700 px-6 py-4 space-y-3">
          {[
            { href: "/services", label: "Services" },
            { href: "/projects", label: "Projects" },
            { href: "/about", label: "About" },
            { href: "/blog", label: "Blog" },
            { href: "/contact", label: "Contact" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-navy-200 hover:text-white transition py-1"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/portal/login"
            onClick={() => setMobileOpen(false)}
            className="block text-navy-400 hover:text-white transition py-1"
          >
            Customer Log In
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileOpen(false)}
            className="block bg-sunrise-600 text-white text-center px-5 py-2.5 rounded-lg font-semibold mt-3"
          >
            Get a Quote
          </Link>
        </div>
      )}
    </header>
  );
}
