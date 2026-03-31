import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      <Header />

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

      <Footer />
    </main>
  );
}
