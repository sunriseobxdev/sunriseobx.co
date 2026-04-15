import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Projects",
  description:
    "Browse our portfolio of completed construction projects across the Outer Banks — roofing, siding, windows, and full exterior renovations.",
};

export const dynamic = "force-dynamic";

interface CmsProject {
  id: string;
  slug: string;
  title: string;
  description?: string;
  images: string[] | { url: string; alt?: string }[];
  services?: string;
  location?: string;
  featured: boolean;
}

// Fallback data when CMS has no published projects yet
const fallbackProjects = [
  { id: "1", title: "Oceanfront Roof Replacement", location: "Nags Head, NC", services: "Roofing", image: "https://cdn.sunriseobx.co/img/site/project-1.jpg", featured: true },
  { id: "2", title: "Beachfront Siding Makeover", location: "Kill Devil Hills, NC", services: "Siding", image: "https://cdn.sunriseobx.co/img/site/project-2.jpg", featured: true },
  { id: "3", title: "Hurricane-Ready Windows", location: "Duck, NC", services: "Windows", image: "https://cdn.sunriseobx.co/img/site/project-3.jpg", featured: true },
  { id: "4", title: "FORTIFIED Roof System", location: "Kitty Hawk, NC", services: "FORTIFIED", image: "https://cdn.sunriseobx.co/img/site/project-4.jpg", featured: false },
  { id: "5", title: "Coastal Exterior Renovation", location: "Southern Shores, NC", services: "Exterior", image: "https://cdn.sunriseobx.co/img/site/project-5.jpg", featured: false },
  { id: "6", title: "Storm Damage Restoration", location: "Hatteras, NC", services: "Roofing", image: "https://cdn.sunriseobx.co/img/site/project-6.jpg", featured: false },
  { id: "7", title: "Full Home Exterior Upgrade", location: "Manteo, NC", services: "Exterior", image: "https://cdn.sunriseobx.co/img/site/project-7.jpg", featured: false },
  { id: "8", title: "Rental Property Renovation", location: "Corolla, NC", services: "Siding", image: "https://cdn.sunriseobx.co/img/site/project-8.jpg", featured: false },
  { id: "9", title: "Beachfront Window Install", location: "Avon, NC", services: "Windows", image: "https://cdn.sunriseobx.co/img/site/project-9.jpg", featured: false },
  { id: "10", title: "Oceanview Roof Upgrade", location: "Nags Head, NC", services: "Roofing", image: "https://cdn.sunriseobx.co/img/site/project-10.jpg", featured: false },
  { id: "11", title: "Historic Home Siding", location: "Manteo, NC", services: "Siding", image: "https://cdn.sunriseobx.co/img/site/project-11.jpg", featured: false },
  { id: "12", title: "New Construction Exterior", location: "Corolla, NC", services: "Exterior", image: "https://cdn.sunriseobx.co/img/site/project-12.jpg", featured: false },
];

function getImage(proj: CmsProject): string {
  if (!proj.images || proj.images.length === 0) return "https://cdn.sunriseobx.co/img/site/project-1.jpg";
  const first = proj.images[0];
  if (typeof first === "string") return first;
  return first.url || "https://cdn.sunriseobx.co/img/site/project-1.jpg";
}

async function getProjects(): Promise<{ id: string; title: string; location?: string; services?: string; image: string; featured: boolean }[]> {
  try {
    // Try internal k8s URL first, fall back to public
    const urls = [
      "http://sunriseobx-api.sunriseobx.svc.cluster.local:8080/api/cms/projects",
      "http://sunriseobx-api:8080/api/cms/projects",
      "https://api.sunriseobx.co/api/cms/projects",
    ];
    let res: Response | null = null;
    for (const url of urls) {
      try {
        res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
        if (res.ok) break;
      } catch { continue; }
    }
    if (!res || !res.ok) return fallbackProjects;
    const res2 = res; // rebind for type narrowing
    const data: CmsProject[] = await res2.json();
    if (data.length === 0) return fallbackProjects;
    return data.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      services: p.services,
      image: getImage(p),
      featured: p.featured,
    }));
  } catch {
    return fallbackProjects;
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  const all = projects;

  return (
    <main className="overflow-hidden">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pb-28 bg-navy-900">
        <div className="absolute inset-0 opacity-15">
          <img src="https://cdn.sunriseobx.co/img/site/construction-2.jpeg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-4">
            Our Portfolio
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Projects That Speak
            <br />
            <span className="text-sunrise-400">For Themselves</span>
          </h1>
          <p className="mt-6 text-xl text-navy-300 max-w-2xl">
            Every project is a testament to our commitment to quality,
            durability, and the unique demands of coastal construction.
          </p>
        </div>
      </section>

      {/* Featured projects — large */}
      {featured.length > 0 && (
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
              Featured Work
            </p>
            <h2 className="text-3xl font-extrabold text-navy-900 mb-10">
              Recent Highlights
            </h2>

            <div className="grid lg:grid-cols-3 gap-6">
              {featured.map((project) => (
                <div
                  key={project.id}
                  className="group relative overflow-hidden rounded-2xl h-[450px] cursor-pointer"
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/20 to-transparent" />
                  <div className="absolute top-5 left-5">
                    <span className="px-3 py-1.5 bg-sunrise-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      {project.services || "Exterior"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    {project.location && <p className="text-navy-300 text-sm mt-1">{project.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All projects grid */}
      <section className="py-20 lg:py-28 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
            Full Portfolio
          </p>
          <h2 className="text-3xl font-extrabold text-navy-900 mb-10">
            All Projects
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {all.map((project) => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-xl h-72 cursor-pointer"
              >
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xs text-sunrise-400 font-semibold uppercase">
                    {project.services || "Exterior"}
                  </span>
                  <h3 className="text-white font-bold text-sm mt-0.5">{project.title}</h3>
                  {project.location && <p className="text-navy-300 text-xs">{project.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0">
          <img src="https://cdn.sunriseobx.co/img/site/f-3.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/80" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Your Home Could Be
            <br />
            <span className="text-sunrise-400">Our Next Showcase</span>
          </h2>
          <p className="mt-6 text-lg text-navy-200 max-w-2xl mx-auto">
            We&apos;d love to add your project to our portfolio. Get a free
            estimate and let&apos;s discuss how we can transform your home.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-sunrise-600 hover:bg-sunrise-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-sunrise-600/25"
            >
              Start Your Project
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
