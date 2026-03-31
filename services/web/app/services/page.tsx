import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Sunrise Construction - Outer Banks",
  description:
    "Roofing, siding, windows, exterior construction, and FORTIFIED roofing services for the Outer Banks. Certified CertainTeed ShingleMaster and Wincore Windows dealer.",
};

const services = [
  {
    id: "roofing",
    title: "Roof Replacements",
    subtitle: "CertainTeed ShingleMaster Certified",
    image: "/img/roofReplacements.jpeg",
    description:
      "When it's time to replace your roof, our consultants meet with you to inspect your current system and discuss the best replacement options for your coastal home. We specialize in shingle and TPO roof systems built to withstand Outer Banks weather.",
    features: [
      "Certified CertainTeed ShingleMaster Installers",
      "Sure Start Plus enhanced warranty coverage",
      "Low-E ThermaSheet insulated underlayment",
      "Shingle and TPO systems",
      "Complete tear-off and replacement",
      "Insurance claim assistance",
    ],
    highlight:
      "As Certified CertainTeed\u00ae ShingleMasters, we deliver roofing with enhanced warranty coverage that gives you — and your insurer — total confidence.",
    bgColor: "bg-navy-900",
    textColor: "text-white",
  },
  {
    id: "siding",
    title: "Premium Siding",
    subtitle: "Low-E HouseWrap Technology",
    image: "/img/newSidingMakeover.jpeg",
    description:
      "Our team of skilled artisans brings years of experience to every siding installation. Whether you prefer classic styles or modern designs, we approach each project with a commitment to craftsmanship that transforms your vision into reality.",
    features: [
      "Classic and modern siding designs",
      "Low-E HouseWrap — blocks 97% radiant heat",
      "Adds R-Value to your wall system",
      "Meets IECC Code without 2x6 framing",
      "Built-in overlap for full coverage",
      "Professional trim and accent work",
    ],
    highlight:
      "Low-E HouseWrap provides a thermal break between the elements and your home — used by top builders and remodelers nationwide.",
    bgColor: "bg-white",
    textColor: "text-navy-900",
  },
  {
    id: "windows",
    title: "Wincore Windows",
    subtitle: "Hurricane-Resistant & Energy Efficient",
    image: "/img/windowReplacements.jpg",
    description:
      "New windows regulate temperature, reduce drafts, enhance your home's appearance, and increase property value. Our expert installation of Wincore\u00ae Windows delivers both beauty and performance with industry-leading warranties.",
    features: [
      "Authorized Wincore\u00ae dealer",
      "Hurricane-resistant glass options",
      "Energy-efficient Low-E coatings",
      "Coastal salt air corrosion protection",
      "Industry-leading transferable warranty",
      "Professional measurement & installation",
    ],
    highlight:
      "With every Wincore\u00ae purchase, a portion supports Tough Enough To Wear Pink\u2122 — advancing breast cancer research.",
    bgColor: "bg-navy-50",
    textColor: "text-navy-900",
  },
  {
    id: "exterior",
    title: "Exterior Construction",
    subtitle: "Built for the Outer Banks",
    image: "/img/Beach-houses-1500.jpg",
    description:
      "Complete exterior renovation and new construction engineered to withstand the Outer Banks' unique challenges — salt air, high winds, flooding, and UV exposure. We build structures that protect your family and investment.",
    features: [
      "Coastal underpinning & structural work",
      "Hurricane-resistant porch construction",
      "Beachfront & oceanfront builds",
      "Deck construction & renovation",
      "Structural improvements & additions",
      "Storm-ready coastal design",
    ],
    highlight:
      "Our exterior builds are specifically engineered for the OBX — we understand the unique demands of coastal construction like no one else.",
    bgColor: "bg-navy-900",
    textColor: "text-white",
  },
  {
    id: "fortified",
    title: "FORTIFIED Roofing",
    subtitle: "IBHS Certified — Up to 50% Insurance Savings",
    image: "/img/solarDefense.jpg",
    description:
      "IBHS FORTIFIED roofing systems provide maximum protection against hurricanes and severe storms. Independently verified by trained evaluators, FORTIFIED homes sustain significantly less damage — and many insurers reward that with substantial premium reductions.",
    features: [
      "IBHS FORTIFIED certification",
      "Up to 50% insurance premium discounts",
      "Impact-resistant roofing materials",
      "Sealed roof deck technology",
      "Wind-rated ridge vents & edge metal",
      "Third-party verification & inspection",
    ],
    highlight:
      "FORTIFIED is not just a building standard — it's proof your home is built to a higher level. Many NC and VA insurers offer significant premium discounts.",
    bgColor: "bg-white",
    textColor: "text-navy-900",
  },
];

export default function ServicesPage() {
  return (
    <main className="overflow-hidden">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pb-28 bg-navy-900">
        <div className="absolute inset-0 opacity-20">
          <img src="/img/GuysOnARoof-min.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-4">
            Our Services
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Expert Craftsmanship for
            <br />
            <span className="text-sunrise-400">Every Exterior Surface</span>
          </h1>
          <p className="mt-6 text-xl text-navy-300 max-w-2xl">
            From roofing to windows to complete exterior renovation — certified,
            insured, and built for the Outer Banks.
          </p>
        </div>
      </section>

      {/* Services */}
      {services.map((service, i) => (
        <section
          key={service.id}
          id={service.id}
          className={`${service.bgColor} py-20 lg:py-28`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div
              className={`flex flex-col ${
                i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } gap-12 lg:gap-20 items-center`}
            >
              {/* Image */}
              <div className="lg:w-1/2">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-2 bg-sunrise-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      {service.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="lg:w-1/2">
                <h2
                  className={`text-3xl lg:text-4xl font-extrabold ${
                    service.textColor === "text-white"
                      ? "text-white"
                      : "text-navy-900"
                  }`}
                >
                  {service.title}
                </h2>
                <p
                  className={`mt-5 text-lg leading-relaxed ${
                    service.textColor === "text-white"
                      ? "text-navy-300"
                      : "text-navy-600"
                  }`}
                >
                  {service.description}
                </p>

                {/* Highlight box */}
                <div
                  className={`mt-6 p-5 rounded-xl border ${
                    service.textColor === "text-white"
                      ? "bg-sunrise-600/10 border-sunrise-500/20"
                      : "bg-sunrise-50 border-sunrise-200"
                  }`}
                >
                  <p
                    className={`text-sm leading-relaxed ${
                      service.textColor === "text-white"
                        ? "text-sunrise-200"
                        : "text-sunrise-800"
                    }`}
                  >
                    {service.highlight}
                  </p>
                </div>

                {/* Features grid */}
                <ul className="mt-8 grid sm:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <svg
                        className="w-5 h-5 text-sunrise-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                        className={`text-sm ${
                          service.textColor === "text-white"
                            ? "text-navy-200"
                            : "text-navy-600"
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Process section */}
      <section className="py-24 lg:py-32 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
              How It Works
            </p>
            <h2 className="text-4xl font-extrabold text-navy-900">
              Our Simple 4-Step Process
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Free Consultation", desc: "We visit your property, assess your needs, and discuss options that fit your budget and goals." },
              { step: "02", title: "Detailed Estimate", desc: "You receive a transparent, itemized estimate with no hidden costs. We can work directly with your insurer." },
              { step: "03", title: "Expert Installation", desc: "Our certified crew completes your project with precision, keeping you informed at every stage." },
              { step: "04", title: "Final Walkthrough", desc: "We inspect every detail together. Your satisfaction is guaranteed, backed by industry-leading warranties." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sunrise-600 text-white flex items-center justify-center text-2xl font-extrabold mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm text-navy-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0">
          <img src="/img/f-3.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/80" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Let&apos;s Talk About
            <br />
            <span className="text-sunrise-400">Your Project</span>
          </h2>
          <p className="mt-6 text-lg text-navy-200 max-w-2xl mx-auto">
            Free estimates, expert advice, and honest pricing. Call us today or
            fill out our contact form — we respond within 24 hours.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-sunrise-600 hover:bg-sunrise-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-sunrise-600/25"
            >
              Request Free Estimate
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

      <Footer />
    </main>
  );
}
