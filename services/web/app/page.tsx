import Link from "next/link";

const services = [
  {
    title: "Roof Replacements",
    description:
      "Certified CertainTeed ShingleMaster installers. Shingle and TPO systems with enhanced warranty coverage.",
    icon: "🏠",
  },
  {
    title: "New Siding",
    description:
      "Expert siding installation with Low-E HouseWrap for maximum energy savings and coastal durability.",
    icon: "🔨",
  },
  {
    title: "Window Replacement",
    description:
      "High-quality Wincore Windows — beautiful aesthetics, optimal functionality, industry-leading warranties.",
    icon: "🪟",
  },
  {
    title: "Exterior Construction",
    description:
      "Complete exterior renovation and new construction built to withstand Outer Banks weather.",
    icon: "🏗️",
  },
  {
    title: "FORTIFIED Roofing",
    description:
      "IBHS FORTIFIED-certified roofing for maximum hurricane and storm resistance.",
    icon: "🛡️",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Header */}
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
            <Link
              href="/contact"
              className="bg-sunrise-600 hover:bg-sunrise-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Get a Quote
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center bg-navy-900">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Building the
              <span className="text-sunrise-500"> Outer Banks</span>
              <br />
              Since Day One
            </h1>
            <p className="mt-6 text-xl text-navy-200 max-w-2xl">
              Premier construction company specializing in hurricane-resistant
              homes, beachfront construction, and coastal renovation across the
              OBX.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="/contact"
                className="bg-sunrise-600 hover:bg-sunrise-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
              >
                Start Your Project
              </Link>
              <Link
                href="/projects"
                className="border-2 border-navy-400 hover:border-white text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
              >
                View Our Work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy-900">Our Services</h2>
            <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
              From roofing to complete exterior renovation, we deliver
              craftsmanship built for coastal living.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="p-8 rounded-2xl border border-navy-100 hover:border-sunrise-300 hover:shadow-lg transition group"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-navy-900 group-hover:text-sunrise-600 transition">
                  {service.title}
                </h3>
                <p className="mt-3 text-navy-500">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-sunrise-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white">
            Ready to Build Your Dream Home?
          </h2>
          <p className="mt-4 text-xl text-sunrise-100">
            Contact us today for a free consultation and estimate.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-8 bg-white text-sunrise-700 px-10 py-4 rounded-lg text-lg font-bold hover:bg-sunrise-50 transition shadow-lg"
          >
            Get Your Free Quote
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                <span className="text-sunrise-500">Sunrise</span> Construction
              </h3>
              <p className="text-navy-300">
                Premier Outer Banks construction company. Building
                hurricane-resistant homes and coastal renovations with
                unmatched craftsmanship.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-300 uppercase tracking-wider mb-4">
                Services
              </h4>
              <ul className="space-y-2 text-navy-400">
                <li>Roof Replacements</li>
                <li>New Siding</li>
                <li>Window Replacement</li>
                <li>Exterior Construction</li>
                <li>FORTIFIED Roofing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-300 uppercase tracking-wider mb-4">
                Contact
              </h4>
              <ul className="space-y-2 text-navy-400">
                <li>Outer Banks, North Carolina</li>
                <li>info@sunriseobx.co</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-navy-700 text-center text-navy-500 text-sm">
            &copy; {new Date().getFullYear()} Sunrise Construction. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
