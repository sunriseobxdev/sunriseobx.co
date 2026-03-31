import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Sunrise Construction - Outer Banks",
  description: "Learn about Sunrise Construction — the Outer Banks' premier construction company. Founded with a mission to redefine excellence in coastal construction.",
};

const stats = [
  { value: "20+", label: "Years Experience" },
  { value: "500+", label: "Projects Completed" },
  { value: "100%", label: "Licensed & Insured" },
  { value: "5-Star", label: "Customer Rating" },
];

const values = [
  { title: "Craftsmanship", description: "Every project reflects our commitment to exceptional quality. We take pride in our work and stand behind every nail, shingle, and window we install." },
  { title: "Transparency", description: "Open, honest communication from start to finish. No hidden costs, no surprises — just straightforward partnerships built on trust." },
  { title: "Innovation", description: "We stay at the forefront of building technology, from FORTIFIED roofing to energy-efficient Low-E products, bringing the best solutions to our clients." },
  { title: "Community", description: "The Outer Banks is our home. We're invested in building not just homes, but a stronger, more resilient community for generations to come." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-28 pb-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">About Sunrise Construction</h1>
          <p className="mt-4 text-lg text-navy-300 max-w-2xl">Redefining excellence in construction on the Outer Banks of North Carolina.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-navy-900">Our Story</h2>
            <p className="mt-6 text-navy-600 leading-relaxed">
              At Sunrise Construction, our mission is to redefine excellence in construction on the Outer Banks of North Carolina. We stand as a beacon of innovation and commitment, bridging the gap in the market for a construction company that prioritizes exceptional craftsmanship, superior customer service, and transparent communication.
            </p>
            <p className="mt-4 text-navy-600 leading-relaxed">
              We serve the entire Outer Banks corridor — from Corolla to Hatteras — specializing in hurricane-resistant construction, beachfront builds, and coastal renovations that stand the test of time and weather.
            </p>
            <p className="mt-4 text-navy-600 leading-relaxed">
              As Certified CertainTeed ShingleMasters and authorized Wincore Windows dealers, we bring industry-leading products and warranties to every project. Our FORTIFIED roofing certification means your home gets maximum protection — and potential insurance savings.
            </p>
          </div>
          <div>
            <img src="/img/about.jpg" alt="Sunrise Construction team at work" className="rounded-2xl shadow-lg w-full h-96 object-cover" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-sunrise-600">{stat.value}</p>
              <p className="mt-2 text-sm text-navy-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div key={v.title} className="p-6 rounded-xl bg-white border border-navy-100 hover:border-sunrise-300 hover:shadow-md transition">
                <h3 className="text-lg font-bold text-navy-900">{v.title}</h3>
                <p className="mt-3 text-sm text-navy-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Serving the Entire Outer Banks</h2>
          <p className="text-navy-300 max-w-2xl mx-auto mb-8">From the northern beaches of Corolla to the southern shores of Hatteras, we&#39;re proud to serve the OBX community.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Corolla","Duck","Southern Shores","Kitty Hawk","Kill Devil Hills","Nags Head","Manteo","Wanchese","Rodanthe","Waves","Salvo","Avon","Buxton","Frisco","Hatteras"].map((town) => (
              <span key={town} className="px-4 py-2 bg-navy-800 text-navy-200 rounded-full text-sm border border-navy-700">{town}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
