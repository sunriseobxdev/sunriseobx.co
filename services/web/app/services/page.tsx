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
    image: "/img/GuysOnARoof-min.jpg",
    description:
      "When it's time to replace your roof, our consultants will meet with you to inspect your current roof and discuss replacement options. We specialize in the installation, service, and maintenance of Shingle and TPO roof systems.",
    features: [
      "Certified CertainTeed ShingleMaster Installers",
      "Enhanced warranty coverage backed by CertainTeed",
      "Low-E ThermaSheet insulated roofing underlayment",
      "Shingle and TPO roof systems",
      "Complete tear-off and replacement",
      "Storm damage repair and insurance claims",
    ],
    highlight:
      "We are Certified CertainTeed\u00ae Shingle Masters! Homeowners benefit from enhanced warranty coverage \u2014 Sure Start Plus extended warranty.",
  },
  {
    id: "siding",
    title: "New Siding Makeover",
    image: "/img/about-one.jpeg",
    description:
      "Craftsmanship is at the heart of everything we do. Our team brings years of experience to every siding installation and trim project, ensuring seamless integration and exceptional attention to detail.",
    features: [
      "Classic and modern siding designs",
      "Low-E HouseWrap for maximum energy savings",
      "Blocks 97% of radiant heat",
      "Built-in overlap for full coverage",
      "Helps meet IECC Code requirements",
      "Professional trim and accent work",
    ],
    highlight:
      "Low-E HouseWrap adds R-Value to your wall system, increases energy savings, and provides a thermal break \u2014 used by top builders nationwide.",
  },
  {
    id: "windows",
    title: "Window Replacement",
    image: "/img/about-two.jpeg",
    description:
      "New windows improve comfort by regulating temperature and reducing drafts, enhance appearance, and increase value. We install high-quality Wincore\u00ae Windows with beautiful aesthetics and optimal functionality.",
    features: [
      "Authorized Wincore Windows dealer",
      "Hurricane-resistant glass options",
      "Energy-efficient Low-E coatings",
      "Salt air corrosion protection",
      "Industry-leading warranties",
      "Professional measurement and installation",
    ],
    highlight:
      "Through your purchase of Wincore\u00ae products, a portion supports Tough Enough To Wear Pink\u2122 \u2014 supporting breast cancer research.",
  },
  {
    id: "exterior",
    title: "Exterior Construction",
    image: "/img/Beach-houses-1500.jpg",
    description:
      "Complete exterior renovation and new construction built to withstand Outer Banks weather. From coastal underpinning to hurricane-resistant porches, we build structures that last.",
    features: [
      "Coastal underpinning and structural work",
      "Hurricane-resistant porch construction",
      "Beachfront and oceanfront builds",
      "Deck construction and renovation",
      "Structural improvements and additions",
      "Storm-ready coastal design",
    ],
    highlight:
      "Specialized in Outer Banks coastal construction \u2014 our builds are engineered for salt air, high winds, and storm surge.",
  },
  {
    id: "fortified",
    title: "FORTIFIED Roofing",
    image: "/img/ShingleMaster.PNG",
    description:
      "IBHS FORTIFIED-certified roofing systems provide maximum protection against hurricanes, severe storms, and high winds. Earn insurance premium discounts while protecting your home.",
    features: [
      "IBHS FORTIFIED certification",
      "Up to 50% insurance premium discounts",
      "Impact-resistant roofing materials",
      "Sealed roof deck technology",
      "Wind-rated ridge vents and edge metal",
      "Third-party verification and inspection",
    ],
    highlight:
      "FORTIFIED homes sustain significantly less damage in hurricanes \u2014 and many insurers offer substantial premium discounts.",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-28 pb-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Our Services</h1>
          <p className="mt-4 text-lg text-navy-300 max-w-2xl">
            From roofing to complete exterior renovation, we deliver craftsmanship built for coastal living on the Outer Banks.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          {services.map((service, i) => (
            <div
              key={service.id}
              id={service.id}
              className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 items-center`}
            >
              <div className="lg:w-1/2">
                <img src={service.image} alt={service.title} className="rounded-2xl shadow-lg w-full h-80 object-cover" />
              </div>
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-bold text-navy-900">{service.title}</h2>
                <p className="mt-4 text-navy-600 leading-relaxed">{service.description}</p>
                <div className="mt-6 bg-sunrise-50 border border-sunrise-200 rounded-xl p-4">
                  <p className="text-sm text-sunrise-800">{service.highlight}</p>
                </div>
                <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy-600">
                      <span className="text-sunrise-500 mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-sunrise-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-sunrise-100">Contact us today for a free consultation and estimate on your project.</p>
          <Link href="/contact" className="inline-block mt-8 bg-white text-sunrise-700 px-10 py-4 rounded-lg text-lg font-bold hover:bg-sunrise-50 transition shadow-lg">
            Request a Free Quote
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
