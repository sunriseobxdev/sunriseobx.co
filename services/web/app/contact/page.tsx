"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="overflow-hidden">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-20 bg-navy-900">
        <div className="absolute inset-0 opacity-15">
          <img src="/img/f-3.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-4">
            Get In Touch
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Start Your Project
            <br />
            <span className="text-sunrise-400">Today</span>
          </h1>
          <p className="mt-6 text-xl text-navy-300 max-w-2xl">
            Free estimates, expert advice, and honest pricing. We respond within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact content */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Form — takes 3 cols */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-extrabold text-navy-900 mb-2">
                Request a Free Estimate
              </h2>
              <p className="text-navy-500 mb-8">
                Tell us about your project and we&apos;ll get back to you with a detailed estimate.
              </p>

              {status === "sent" ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-800 font-bold text-xl">Message Sent!</p>
                  <p className="text-green-600 mt-2">
                    Thank you for reaching out. We&apos;ll respond within 24 hours.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm text-green-700 font-semibold underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-navy-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3.5 bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:border-transparent text-navy-800 transition"
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-navy-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3.5 bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:border-transparent text-navy-800 transition"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-navy-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3.5 bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:border-transparent text-navy-800 transition"
                        placeholder="(252) 555-0100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-navy-700 mb-2">
                        Service Needed
                      </label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3.5 bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:border-transparent text-navy-800 transition"
                      >
                        <option value="">Select a service...</option>
                        <option>Roof Replacement</option>
                        <option>Siding Installation</option>
                        <option>Window Replacement</option>
                        <option>Exterior Construction</option>
                        <option>FORTIFIED Roofing</option>
                        <option>Storm Damage Repair</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Project Details *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3.5 bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:border-transparent text-navy-800 transition"
                      placeholder="Tell us about your project — what work is needed, your timeline, and any questions you have..."
                      required
                    />
                  </div>
                  {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 text-sm">
                        Something went wrong. Please try again or call us directly at (252) 619-7966.
                      </p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full py-4 bg-sunrise-600 hover:bg-sunrise-500 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-sunrise-600/25 disabled:opacity-50"
                  >
                    {status === "sending" ? "Sending..." : "Send Message & Get Free Estimate"}
                  </button>
                  <p className="text-xs text-navy-400 text-center">
                    We respond to all inquiries within 24 hours. Your information is never shared.
                  </p>
                </form>
              )}
            </div>

            {/* Contact info — takes 2 cols */}
            <div className="lg:col-span-2 space-y-8">
              {/* Phone card */}
              <div className="bg-sunrise-600 rounded-2xl p-8 text-white">
                <h3 className="text-lg font-bold mb-2">Call Us Directly</h3>
                <a
                  href="tel:+12526197966"
                  className="text-3xl font-extrabold hover:text-sunrise-100 transition block"
                >
                  (252) 619-7966
                </a>
                <p className="text-sunrise-200 text-sm mt-2">
                  Mon-Fri 7am-6pm &middot; Sat 8am-2pm
                </p>
              </div>

              {/* Info cards */}
              <div className="bg-navy-50 rounded-2xl p-8 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">
                    Office
                  </h3>
                  <p className="text-navy-800 font-medium">
                    5149-5177 N Croatan Hwy
                    <br />
                    Kitty Hawk, NC 27949
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:hello@sunriseobx.co"
                    className="text-sunrise-600 font-medium hover:text-sunrise-700 transition"
                  >
                    hello@sunriseobx.co
                  </a>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">
                    Service Area
                  </h3>
                  <p className="text-navy-600 text-sm leading-relaxed">
                    We serve the entire Outer Banks — Corolla, Duck,
                    Southern Shores, Kitty Hawk, Kill Devil Hills, Nags Head,
                    Manteo, Rodanthe, Waves, Avon, Buxton, and Hatteras.
                  </p>
                </div>
              </div>

              {/* Promise card */}
              <div className="bg-navy-900 rounded-2xl p-8 text-white">
                <h3 className="text-lg font-bold mb-3">Our Promise</h3>
                <ul className="space-y-3">
                  {[
                    "Free, no-obligation estimates",
                    "Transparent, itemized pricing",
                    "Licensed, bonded & fully insured",
                    "We work with your insurance",
                    "Industry-leading warranties",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-navy-200">
                      <svg className="w-4 h-4 text-sunrise-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
