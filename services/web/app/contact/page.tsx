"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
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
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-28 pb-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Contact Us</h1>
          <p className="mt-4 text-lg text-navy-300 max-w-2xl">Ready to start your project? Get in touch for a free consultation and estimate.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-6">Send Us a Message</h2>
            {status === "sent" ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <p className="text-green-800 font-semibold text-lg">Thank you for your message!</p>
                <p className="text-green-600 mt-2">We&#39;ll get back to you within 24 hours.</p>
                <button onClick={() => setStatus("idle")} className="mt-4 text-sm text-green-700 underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">Your Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:outline-none focus:border-sunrise-500 text-navy-800" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:outline-none focus:border-sunrise-500 text-navy-800" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Subject</label>
                  <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:outline-none focus:border-sunrise-500 text-navy-800" placeholder="e.g. Roof replacement estimate" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Message</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:outline-none focus:border-sunrise-500 text-navy-800" placeholder="Tell us about your project..." required />
                </div>
                {status === "error" && <p className="text-red-600 text-sm">Something went wrong. Please try again or call us directly.</p>}
                <button type="submit" disabled={status === "sending"} className="w-full py-3.5 bg-sunrise-600 hover:bg-sunrise-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-6">Get In Touch</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-2">Office Address</h3>
                <p className="text-navy-700">5149-5177 N Croatan Hwy<br />Kitty Hawk, NC 27949</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-2">Phone</h3>
                <a href="tel:+12526197966" className="text-navy-700 hover:text-sunrise-600 transition text-lg font-medium">(252) 619-7966</a>
                <br />
                <a href="tel:+12522072602" className="text-navy-700 hover:text-sunrise-600 transition">(252) 207-2602</a>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-2">Email</h3>
                <a href="mailto:hello@sunriseobx.co" className="text-navy-700 hover:text-sunrise-600 transition">hello@sunriseobx.co</a>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-2">Service Area</h3>
                <p className="text-navy-600 text-sm leading-relaxed">We serve the entire Outer Banks corridor from Corolla to Hatteras, including Duck, Southern Shores, Kitty Hawk, Kill Devil Hills, Nags Head, Manteo, and all communities in between.</p>
              </div>
              <div className="bg-navy-50 rounded-xl p-6">
                <h3 className="font-semibold text-navy-900 mb-2">Free Estimates</h3>
                <p className="text-sm text-navy-600">We offer free, no-obligation estimates for all our services. Call us or fill out the form and we&#39;ll get back to you within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
