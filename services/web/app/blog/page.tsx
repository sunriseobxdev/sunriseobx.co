import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description:
    "Construction tips, product guides, and news from Sunrise Construction on the Outer Banks.",
};

// Use INTERNAL_API_URL (set in k8s deployment) for server-side fetches
const API_BASE = process.env.INTERNAL_API_URL || "http://sunriseobx-api:8080";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string;
  published_at: string;
  content?: {
    categories?: string[];
    author?: { name: string; avatar: string };
  };
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/api/cms/posts`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featured = posts[0] || null;
  const rest = posts.slice(1);

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
      {featured && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-center bg-navy-50 rounded-3xl overflow-hidden">
              <div className="h-80 lg:h-full">
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-4">
                  {featured.content?.categories?.[0] && (
                    <span className="px-3 py-1 bg-sunrise-100 text-sunrise-700 text-xs font-bold rounded-full">
                      {featured.content.categories[0]}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-navy-900 leading-snug">
                  {featured.title}
                </h2>
                <p className="mt-4 text-navy-600 leading-relaxed">
                  {featured.excerpt}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <time className="text-sm text-navy-400">
                    {new Date(featured.published_at).toLocaleDateString("en-US", {
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
      )}

      {/* All posts */}
      <section className="py-20 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-navy-900 mb-10">
            Latest Articles
          </h2>
          {rest.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((post) => (
                <article
                  key={post.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-navy-100 hover:shadow-xl hover:border-sunrise-200 transition-all"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {post.content?.categories?.[0] && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-navy-700 text-xs font-bold rounded-full">
                          {post.content.categories[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <time className="text-xs text-navy-400">
                        {new Date(post.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
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
          ) : (
            <p className="text-navy-400 text-center py-8">No articles yet.</p>
          )}
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
