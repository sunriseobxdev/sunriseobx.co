import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const services = [
  {
    title: "Premium Siding",
    description:
      "AZEK PVC lap siding with matching trims, LP SmartSide, James Hardie, and traditional cedar shake. Installed over Benjamin Obdyke HydroGap or Low-E HouseWrap for superior weather protection.",
    image: "https://cdn.sunriseobx.co/img/site/newSidingMakeover.jpeg",
    href: "/services#siding",
  },
  {
    title: "ViWinco Impact Windows",
    description:
      "ViWinco OceanView impact-rated windows with higher DP ratings and lifetime service. Hurricane-resistant laminated glass engineered for coastal exposure.",
    image: "https://cdn.sunriseobx.co/img/site/windowReplacements.jpg",
    href: "/services#windows",
  },
  {
    title: "Redecking & Railings",
    description:
      "TimberTech composite decking, TimberTech PVC railings, and pressure-treated decking built to withstand salt air and coastal weather year after year.",
    image: "https://cdn.sunriseobx.co/img/site/Beach-houses-1500.jpg",
    href: "/services#decking",
  },
  {
    title: "Roof Replacements",
    description:
      "Complete roof replacement systems with premium architectural shingles, stainless steel fasteners, and ice & water shield for lasting coastal protection.",
    image: "https://cdn.sunriseobx.co/img/site/roofReplacements.jpeg",
    href: "/services#roofing",
  },
  {
    title: "Exterior Construction",
    description:
      "Full exterior renovation and new construction engineered for salt air, high winds, and storm surge. X-bracing, underpinning, and structural repairs.",
    image: "https://cdn.sunriseobx.co/img/site/solarDefense.jpg",
    href: "/services#exterior",
  },
  {
    title: "FORTIFIED Roofing",
    description:
      "IBHS-certified FORTIFIED roofing systems proven to reduce storm damage. Earn up to 50% insurance premium discounts.",
    image: "https://cdn.sunriseobx.co/img/site/drone-inspection.jpg",
    href: "/services#fortified",
  },
];

const projects = [
  { image: "https://cdn.sunriseobx.co/img/portfolio/aerial-oceanfront-home-complete.jpg", title: "Oceanfront Home — Roof & Siding", location: "Duck" },
  { image: "https://cdn.sunriseobx.co/img/portfolio/oceanfront-home-dunes-complete.jpg", title: "Beachfront Window Renovation", location: "Nags Head" },
  { image: "https://cdn.sunriseobx.co/img/portfolio/aerial-roof-install-shingles.jpg", title: "Architectural Roof Replacement", location: "Kill Devil Hills" },
  { image: "https://cdn.sunriseobx.co/img/portfolio/aerial-deck-balcony-siding-blue.jpg", title: "Deck & Balcony Restoration", location: "Southern Shores" },
];

const certifications = [
  { image: "https://cdn.sunriseobx.co/img/site/slider/fortified.png", name: "IBHS FORTIFIED" },
  { image: "https://cdn.sunriseobx.co/img/site/slider/wincore.png", name: "ViWinco / Wincore" },
  { image: "https://cdn.sunriseobx.co/img/site/slider/low-e.png", name: "Low-E / HydroGap" },
  { image: "https://cdn.sunriseobx.co/img/site/slider/dpor.png", name: "VA DPOR Licensed" },
  { image: "https://cdn.sunriseobx.co/img/site/slider/drone-pilot.png", name: "FAA Licensed" },
];

const testimonials = [
  {
    quote:
      "Sunrise Construction replaced our roof after Hurricane Dorian. Their team was professional, fast, and the quality of work was exceptional. Highly recommend for any OBX homeowner.",
    name: "Michael & Sarah T.",
    location: "Nags Head, NC",
  },
  {
    quote:
      "We hired them for a complete siding makeover on our beach rental. The Low-E HouseWrap made a noticeable difference in our energy bills. Outstanding craftsmanship.",
    name: "David R.",
    location: "Kill Devil Hills, NC",
  },
  {
    quote:
      "The ViWinco impact windows they installed are beautiful and have held up perfectly through two storm seasons. Great team to work with from start to finish.",
    name: "Jennifer L.",
    location: "Duck, NC",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <Header />

      {/* Hero — full-bleed video/image background */}
      <section className="relative min-h-[100vh] flex items-center">
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="https://cdn.sunriseobx.co/img/site/Beach-houses-1500.jpg"
            className="w-full h-full object-cover"
          >
            <source src="/intro-sunrise.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900/90 via-navy-900/70 to-navy-900/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sunrise-600/20 border border-sunrise-500/30 rounded-full mb-8">
              <span className="w-2 h-2 bg-sunrise-500 rounded-full animate-pulse" />
              <span className="text-sunrise-300 text-sm font-medium tracking-wide">
                SERVING THE OUTER BANKS SINCE 2003
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
              Coastal Construction
              <br />
              <span className="bg-gradient-to-r from-sunrise-400 to-sunrise-600 bg-clip-text text-transparent">
                Built to Last
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-navy-200 leading-relaxed max-w-xl">
              The Outer Banks&apos; premier construction company. We build
              hurricane-resistant homes, beachfront renovations, and FORTIFIED
              roofing systems that protect what matters most.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="group bg-sunrise-600 hover:bg-sunrise-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-sunrise-600/25 hover:shadow-sunrise-500/40 text-center"
              >
                Get a Free Estimate
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </Link>
              <Link
                href="/projects"
                className="group backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all border border-white/20 text-center"
              >
                View Our Work
              </Link>
            </div>

            {/* Trust metrics */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
              <div>
                <p className="text-3xl font-bold text-white">20+</p>
                <p className="text-sm text-navy-300 mt-1">Years Experience</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-sm text-navy-300 mt-1">Projects Done</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">5.0</p>
                <p className="text-sm text-navy-300 mt-1">Star Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications bar */}
      <section className="bg-navy-900 border-t border-navy-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-70">
            {certifications.map((cert) => (
              <div key={cert.name} className="flex items-center gap-3">
                <Image
                  src={cert.image}
                  alt={cert.name}
                  width={40}
                  height={40}
                  className="object-contain brightness-0 invert"
                />
                <span className="text-xs text-navy-300 font-medium hidden sm:block">
                  {cert.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — premium grid with image backgrounds */}
      <section className="py-24 lg:py-32 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
              What We Do
            </p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-900">
              Our Services
            </h2>
            <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
              From roofing to complete exterior renovation, every project
              reflects our commitment to craftsmanship and coastal durability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="group relative overflow-hidden rounded-2xl h-80 flex items-end"
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
                <div className="relative p-6 w-full">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-navy-200 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                    {service.description}
                  </p>
                  <span className="inline-block mt-3 text-sunrise-400 text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                    Learn More &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
                Why Sunrise
              </p>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-900 leading-tight">
                The OBX&apos;s Most Trusted
                <br />
                Construction Company
              </h2>
              <p className="mt-6 text-navy-600 text-lg leading-relaxed">
                When you build on the Outer Banks, you need a contractor who
                understands coastal construction inside and out. We don&apos;t
                just build — we engineer homes that stand up to hurricanes,
                salt air, and the test of time.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    title: "Certified CertainTeed ShingleMaster",
                    desc: "Elite roofing certification with enhanced warranty coverage your insurer will love.",
                  },
                  {
                    title: "IBHS FORTIFIED Designation",
                    desc: "Hurricane-resistant construction proven to reduce damage by up to 50%.",
                  },
                  {
                    title: "Licensed, Bonded & Insured",
                    desc: "Full NC & VA contractor licensing. Your project is protected from day one.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sunrise-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-sunrise-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900">{item.title}</h3>
                      <p className="text-sm text-navy-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 mt-10 text-sunrise-600 font-semibold hover:text-sunrise-700 transition"
              >
                More About Our Company
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="relative">
              <img
                src="https://cdn.sunriseobx.co/img/site/WhyChooseUs.jpg"
                alt="Sunrise Construction team at work on Outer Banks home"
                className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-sunrise-600 text-white p-6 rounded-2xl shadow-xl">
                <p className="text-4xl font-extrabold">20+</p>
                <p className="text-sm text-sunrise-100 font-medium">
                  Years Building
                  <br />
                  the OBX
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 lg:py-32 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-3">
                Our Work
              </p>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white">
                Featured Projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="mt-4 md:mt-0 text-sunrise-400 font-semibold hover:text-sunrise-300 transition"
            >
              View All Projects &rarr;
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project, i) => (
              <Link
                key={i}
                href="/projects"
                className="group relative overflow-hidden rounded-2xl h-96"
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <h3 className="text-white font-bold">{project.title}</h3>
                  <p className="text-navy-300 text-sm">{project.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
              Client Testimonials
            </p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-900">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-navy-50 rounded-2xl p-8 relative"
              >
                <svg
                  className="w-10 h-10 text-sunrise-200 mb-4"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
                </svg>
                <p className="text-navy-700 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sunrise-100 flex items-center justify-center text-sunrise-600 font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">
                      {t.name}
                    </p>
                    <p className="text-navy-400 text-xs">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — premium */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0">
          <img
            src="https://cdn.sunriseobx.co/img/site/f-3.jpg"
            alt="Outer Banks construction"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-navy-900/80" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Ready to Build Something
            <br />
            <span className="text-sunrise-400">Extraordinary?</span>
          </h2>
          <p className="mt-6 text-lg text-navy-200 max-w-2xl mx-auto">
            Whether it&apos;s a new roof, siding upgrade, or complete exterior
            renovation — get a free, no-obligation estimate from the Outer
            Banks&apos; most trusted construction company.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-sunrise-600 hover:bg-sunrise-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-sunrise-600/25"
            >
              Get Your Free Estimate
            </Link>
            <a
              href="tel:+12526197966"
              className="backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all border border-white/20"
            >
              Call (252) 619-7966
            </a>
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="py-16 bg-navy-900 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-navy-400 mb-4">
            Proudly serving homeowners across the Outer Banks
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-navy-500">
            {[
              "Corolla", "Duck", "Southern Shores", "Kitty Hawk",
              "Kill Devil Hills", "Nags Head", "Manteo", "Hatteras",
            ].map((town) => (
              <span key={town}>{town}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
