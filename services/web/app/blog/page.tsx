import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Sunrise Construction - Outer Banks",
  description: "Construction tips, product guides, and news from Sunrise Construction on the Outer Banks. Learn about roofing, windows, siding, and FORTIFIED building.",
};

const posts = [
  {
    slug: "building-with-wincore",
    title: "Building With Wincore Windows",
    excerpt: "Discover why Wincore Windows are the perfect choice for Outer Banks homes — hurricane-resistant glass, salt air protection, and energy-efficient Low-E coatings.",
    image: "/img/articles3.jpeg",
    date: "2024-12-15",
    category: "Windows",
  },
  {
    slug: "salt-box-roofing-package",
    title: "The Salt Box Package: Premium Roofing for Coastal Homes",
    excerpt: "Our Salt Box roofing package combines CertainTeed shingles with Low-E ThermaSheet underlayment for maximum protection and energy savings on the OBX.",
    image: "/img/articles4.jpeg",
    date: "2024-11-20",
    category: "Roofing",
  },
  {
    slug: "cool-coastal-house-package",
    title: "Cool Coastal House Package: Siding & Insulation",
    excerpt: "Transform your home's exterior with our Cool Coastal package featuring premium siding and Low-E HouseWrap — blocks 97% of radiant heat while looking beautiful.",
    image: "/img/articles6.jpeg",
    date: "2024-10-08",
    category: "Siding",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-28 pb-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Blog</h1>
          <p className="mt-4 text-lg text-navy-300 max-w-2xl">
            Construction tips, product guides, and news from the Outer Banks.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.slug} className="group rounded-2xl overflow-hidden border border-navy-100 hover:shadow-xl transition">
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-navy-900/80 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <time className="text-xs text-navy-400">{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
                  <h3 className="mt-2 text-lg font-bold text-navy-900 group-hover:text-sunrise-600 transition leading-snug">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-navy-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-sm font-medium text-sunrise-600">
                    Read More &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-navy-400 text-lg">No posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
