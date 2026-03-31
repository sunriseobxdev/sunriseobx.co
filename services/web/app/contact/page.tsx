import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-navy-900/95 backdrop-blur-sm border-b border-navy-700">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-sunrise-500">Sunrise</span> Construction
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/services" className="text-navy-200 hover:text-white transition">Services</Link>
            <Link href="/projects" className="text-navy-200 hover:text-white transition">Projects</Link>
            <Link href="/about" className="text-navy-200 hover:text-white transition">About</Link>
            <Link href="/contact" className="text-navy-200 hover:text-white transition">Contact</Link>
          </div>
        </nav>
      </header>
      <div className="pt-24 max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-navy-900">Contact</h1>
        <p className="mt-4 text-navy-500">Content coming soon.</p>
      </div>
    </main>
  );
}
