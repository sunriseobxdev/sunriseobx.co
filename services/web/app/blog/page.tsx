import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description:
    "Construction tips, product guides, and news from Sunrise Construction on the Outer Banks.",
};

const featuredPost = {
  slug: "building-with-wincore",
  title: "Why Wincore Windows Are the #1 Choice for Outer Banks Homes",
  excerpt:
    "Hurricane-resistant glass, salt air corrosion protection, and energy-efficient Low-E coatings — discover why coastal homeowners are choosing Wincore for their window replacements.",
  image: "/img/windowReplacements.jpg",
  date: "2024-12-15",
  category: "Windows",
  readTime: "5 min read",
};

const posts = [
  {
    slug: "salt-box-roofing-package",
    title: "The Salt Box Package: Premium Roofing Built for the Coast",
    excerpt:
      "Our Salt Box roofing package combines CertainTeed shingles with Low-E ThermaSheet underlayment for maximum protection and energy savings.",
    image: "/img/roofReplacements.jpeg",
    date: "2024-11-20",
    category: "Roofing",
    readTime: "4 min read",
  },
  {
    slug: "cool-coastal-house-package",
    title: "Cool Coastal House: Siding That Saves You Money",
    excerpt:
      "Transform your home's exterior with premium siding and Low-E HouseWrap — blocks 97% of radiant heat while looking beautiful.",
    image: "/img/newSidingMakeover.jpeg",
    date: "2024-10-08",
    category: "Siding",
    readTime: "4 min read",
  },
  {
    slug: "fortified-roofing-insurance-savings",
    title: "How FORTIFIED Roofing Can Save You 50% on Insurance",
    excerpt:
      "IBHS FORTIFIED certification isn't just about protection — many insurers offer substantial premium discounts for homes built to this standard.",
    image: "/img/solarDefense.jpg",
    date: "2024-09-15",
    category: "FORTIFIED",
    readTime: "6 min read",
  },
  {
    slug: "hurricane-prep-obx-homeowners",
    title: "Hurricane Season Prep: What Every OBX Homeowner Should Know",
    excerpt:
      "From roof inspections to impact-resistant upgrades, here's your complete guide to preparing your Outer Banks home for hurricane season.",
    image: "/img/drone-inspection.jpg",
    date: "2024-08-01",
    category: "Tips",
    readTime: "7 min read",
  },
  {
    slug: "choosing-right-siding-obx",
    title: "Choosing the Right Siding for Your Coastal Home",
    excerpt:
      "Salt air, UV exposure, and hurricane winds — not all siding is created equal. Here's how to pick materials that last on the OBX.",
    image: "/img/about-one.jpeg",
    date: "2024-07-10",
    category: "Siding",
    readTime: "5 min read",
  },
];

export default function BlogPage() {
  return (
    <main className="overflow-hidden">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-4">
            Blog & Resources
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Construction
            <span className="text-sunrise-400"> Insights</span>
          </h1>
          <p className="mt-6 text-xl text-navy-300 max-w-2xl">
            Tips, guides, and news to help you make informed decisions about
            your Outer Banks home.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center bg-navy-50 rounded-3xl overflow-hidden">
            <div className="h-80 lg:h-full">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 lg:p-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-sunrise-100 text-sunrise-700 text-xs font-bold rounded-full">
                  {featuredPost.category}
                </span>
                <span className="text-navy-400 text-xs">{featuredPost.readTime}</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-navy-900 leading-snug">
                {featuredPost.title}
              </h2>
              <p className="mt-4 text-navy-600 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <time className="text-sm text-navy-400">
                  {new Date(featuredPost.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="text-sunrise-600 font-semibold text-sm">
                  Read Article &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All posts */}
      <section className="py-20 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-navy-900 mb-10">
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group bg-white rounded-2xl overflow-hidden border border-navy-100 hover:shadow-xl hover:border-sunrise-200 transition-all"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-navy-700 text-xs font-bold rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <time className="text-xs text-navy-400">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <span className="text-xs text-navy-300">&middot;</span>
                    <span className="text-xs text-navy-400">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 group-hover:text-sunrise-600 transition leading-snug">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-navy-500 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <span className="inline-block mt-4 text-sm font-semibold text-sunrise-600 group-hover:translate-x-1 transition-transform">
                    Read More &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Get Coastal Construction Tips Delivered
          </h2>
          <p className="mt-4 text-navy-300">
            Join OBX homeowners who stay informed about building, maintenance,
            and storm preparation.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-8 bg-sunrise-600 hover:bg-sunrise-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-sunrise-600/25"
          >
            Get In Touch
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
