"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  updated_at: string;
}

interface Project {
  id: string;
  slug: string;
  title: string;
  status: string;
  featured: boolean;
  updated_at: string;
}

export default function CmsPage() {
  const [tab, setTab] = useState<"posts" | "projects">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const [postsRes, projectsRes] = await Promise.all([
        apiFetch("/api/cms/admin/posts"),
        apiFetch("/api/cms/admin/projects"),
      ]);
      setPosts(await postsRes.json());
      setProjects(await projectsRes.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await apiFetch(`/api/cms/admin/posts/${id}`, { method: "DELETE" });
    loadContent();
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("Delete this project?")) return;
    await apiFetch(`/api/cms/admin/projects/${id}`, { method: "DELETE" });
    loadContent();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Content Management</h1>

      <div className="flex gap-2 mb-6">
        {(["posts", "projects"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t
                ? "bg-sunrise-600 text-white"
                : "bg-navy-700 text-navy-300 hover:text-white"
            }`}
          >
            {t === "posts" ? "Blog Posts" : "Projects"}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-navy-800 rounded-xl border border-navy-700 p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="text-white font-semibold">{post.title}</h3>
                <p className="text-sm text-navy-400">/{post.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    post.status === "published"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-navy-700 text-navy-400"
                  }`}
                >
                  {post.status}
                </span>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="px-3 py-1 bg-red-900/20 text-red-400 rounded text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-navy-400 text-center py-8">No posts yet</p>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-navy-800 rounded-xl border border-navy-700 p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="text-white font-semibold">
                  {proj.title}
                  {proj.featured && (
                    <span className="ml-2 text-xs bg-sunrise-600/20 text-sunrise-400 px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </h3>
                <p className="text-sm text-navy-400">/{proj.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    proj.status === "published"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-navy-700 text-navy-400"
                  }`}
                >
                  {proj.status}
                </span>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="px-3 py-1 bg-red-900/20 text-red-400 rounded text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-navy-400 text-center py-8">No projects yet</p>
          )}
        </div>
      )}
    </div>
  );
}
