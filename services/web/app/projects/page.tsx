import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects | Sunrise Construction - Outer Banks",
  description: "Browse our portfolio of completed construction projects across the Outer Banks — roofing, siding, windows, and full exterior renovations.",
};

const projects = [
  { id: 1, title: "Oceanfront Roof Replacement", location: "Nags Head, NC", service: "Roofing", image: "/img/project-1.jpg" },
  { id: 2, title: "Beachfront Siding Makeover", location: "Kill Devil Hills, NC", service: "Siding", image: "/img/project-2.jpg" },
  { id: 3, title: "Wincore Window Installation", location: "Duck, NC", service: "Windows", image: "/img/project-3.jpg" },
  { id: 4, title: "FORTIFIED Roof System", location: "Kitty Hawk, NC", service: "FORTIFIED", image: "/img/project-4.jpg" },
  { id: 5, title: "Coastal Exterior Renovation", location: "Southern Shores, NC", service: "Exterior", image: "/img/project-5.jpg" },
  { id: 6, title: "Storm Damage Restoration", location: "Hatteras, NC", service: "Roofing", image: "/img/project-6.jpg" },
  { id: 7, title: "Full Home Exterior Upgrade", location: "Manteo, NC", service: "Exterior", image: "/img/project-7.jpg" },
  { id: 8, title: "Rental Property Renovation", location: "Corolla, NC", service: "Siding", image: "/img/project-8.jpg" },
  { id: 9, title: "Hurricane-Ready Windows", location: "Avon, NC", service: "Windows", image: "/img/project-9.jpg" },
];

const serviceFilters = ["All", "Roofing", "Siding", "Windows", "Exterior", "FORTIFIED"];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-28 pb-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Our Projects</h1>
          <p className="mt-4 text-lg text-navy-300 max-w-2xl">
            Browse our portfolio of completed construction projects across the Outer Banks.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-2 mb-12">
            {serviceFilters.map((f) => (
              <span key={f} className="px-4 py-2 bg-navy-50 text-navy-600 rounded-full text-sm font-medium border border-navy-100 hover:border-sunrise-300 hover:text-sunrise-600 transition cursor-pointer">
                {f}
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="group rounded-2xl overflow-hidden border border-navy-100 hover:shadow-xl transition">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-sunrise-600 text-white text-xs font-medium rounded-full">
                    {project.service}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-navy-900 group-hover:text-sunrise-600 transition">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-sm text-navy-400">{project.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-navy-500 mb-4">Want to see your project here?</p>
            <Link href="/contact" className="inline-block bg-sunrise-600 hover:bg-sunrise-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Start Your Project
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
