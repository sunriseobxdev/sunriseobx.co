"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  cardStyle,
  inputStyle,
  labelStyle,
  buttonPrimary,
  buttonSecondary,
  badgeStyle,
  colors,
  pageTitle,
} from "@/lib/desk-styles";

interface PostContent {
  markdown: string;
  categories: string[];
  author: { name: string; avatar: string };
  gallery: { enabled: boolean; items: { image: string; alt: string }[]; cols: number };
  additional: { enabled: boolean; content: string };
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: PostContent;
  image_url: string;
  status: string;
  published_at: string;
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

type View = "list" | "create" | "edit";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  markdown: "",
  imageUrl: "",
  status: "draft" as "draft" | "published",
  categories: "",
  authorName: "Zachary Wayland",
  authorAvatar: "/img/hardhat.jpeg",
};

export default function CmsPage() {
  const [tab, setTab] = useState<"posts" | "projects">("posts");
  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const [postsData, projectsData] = await Promise.all([
        apiFetch("/api/cms/admin/posts"),
        apiFetch("/api/cms/admin/projects"),
      ]);
      setPosts(postsData || []);
      setProjects(projectsData || []);
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

  function openCreate() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setSlugManual(false);
    setView("create");
  }

  function openEdit(post: Post) {
    const c = post.content || {} as PostContent;
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      markdown: c.markdown || "",
      imageUrl: post.image_url || "",
      status: (post.status as "draft" | "published") || "draft",
      categories: (c.categories || []).join(", "),
      authorName: c.author?.name || "Zachary Wayland",
      authorAvatar: c.author?.avatar || "/img/hardhat.jpeg",
    });
    setEditingId(post.id);
    setSlugManual(true);
    setView("edit");
  }

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !slugManual) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: {
          markdown: form.markdown,
          categories: form.categories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          author: { name: form.authorName, avatar: form.authorAvatar },
          gallery: { enabled: false, items: [], cols: 3 },
          additional: { enabled: false, content: "" },
        },
        image_url: form.imageUrl,
        status: form.status,
      };

      if (editingId) {
        await apiFetch(`/api/cms/admin/posts/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/cms/admin/posts", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      setView("list");
      loadContent();
    } catch (err) {
      console.error(err);
      alert("Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  // --- Render ---

  if (view === "create" || view === "edit") {
    return (
      <div>
        <style>{`
          .cms-form input, .cms-form textarea, .cms-form select {
            color: ${colors.heading} !important;
            background: ${colors.input} !important;
            border-color: ${colors.borderLight} !important;
          }
          .cms-form input::placeholder, .cms-form textarea::placeholder {
            color: ${colors.muted} !important;
            opacity: 1;
          }
          .cms-form input:focus, .cms-form textarea:focus, .cms-form select:focus {
            border-color: ${colors.inputFocus} !important;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
          }
          .cms-form option {
            background: ${colors.input};
            color: ${colors.heading};
          }
        `}</style>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button style={buttonSecondary} onClick={() => setView("list")}>
            &larr; Back
          </button>
          <h1 style={pageTitle as React.CSSProperties}>
            {view === "create" ? "New Blog Post" : "Edit Blog Post"}
          </h1>
        </div>

        <div className="cms-form" style={{ ...cardStyle, maxWidth: "800px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Title</label>
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Post title"
              />
            </div>

            {/* Slug */}
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={inputStyle}
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  updateField("slug", e.target.value);
                }}
                placeholder="post-slug"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label style={labelStyle}>Excerpt / Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
                value={form.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="Short description"
              />
            </div>

            {/* Image URL */}
            <div>
              <label style={labelStyle}>Image URL</label>
              <input
                style={inputStyle}
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                placeholder="/img/example.jpg"
              />
            </div>

            {/* Categories */}
            <div>
              <label style={labelStyle}>Categories (comma-separated)</label>
              <input
                style={inputStyle}
                value={form.categories}
                onChange={(e) => updateField("categories", e.target.value)}
                placeholder="Construction, Outer Banks, Roofing"
              />
            </div>

            {/* Author */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Author Name</label>
                <input
                  style={inputStyle}
                  value={form.authorName}
                  onChange={(e) => updateField("authorName", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Author Avatar URL</label>
                <input
                  style={inputStyle}
                  value={form.authorAvatar}
                  onChange={(e) => updateField("authorAvatar", e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={{ ...inputStyle, appearance: "auto" as const }}
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="draft" style={{ background: colors.input, color: colors.heading }}>Draft</option>
                <option value="published" style={{ background: colors.input, color: colors.heading }}>Published</option>
              </select>
            </div>

            {/* Markdown Content */}
            <div>
              <label style={labelStyle}>Content (Markdown)</label>
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: "300px",
                  resize: "vertical",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  lineHeight: "1.5",
                }}
                value={form.markdown}
                onChange={(e) => updateField("markdown", e.target.value)}
                placeholder="Write your blog post content in Markdown..."
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                style={{ ...buttonPrimary, opacity: saving ? 0.6 : 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : view === "create" ? "Create Post" : "Update Post"}
              </button>
              <button style={buttonSecondary} onClick={() => setView("list")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={pageTitle as React.CSSProperties}>Content Management</h1>
        {tab === "posts" && (
          <button style={buttonPrimary} onClick={openCreate}>
            + New Post
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["posts", "projects"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: tab === t ? colors.accent : colors.card,
              color: tab === t ? "#fff" : colors.body,
            }}
          >
            {t === "posts" ? "Blog Posts" : "Projects"}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ color: colors.heading, fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>
                  {post.title}
                </h3>
                <p style={{ color: colors.muted, fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
                  /{post.slug}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={badgeStyle(post.status === "published" ? "success" : "muted")}>
                  {post.status}
                </span>
                <button
                  onClick={() => openEdit(post)}
                  style={{
                    ...buttonSecondary,
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.7rem",
                    color: colors.link,
                    borderColor: colors.link,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  style={{
                    ...buttonSecondary,
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.7rem",
                    color: colors.danger,
                    borderColor: colors.danger,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p style={{ color: colors.muted, textAlign: "center", padding: "2rem 0" }}>
              No posts yet
            </p>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              style={{
                ...cardStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ color: colors.heading, fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>
                  {proj.title}
                  {proj.featured && (
                    <span style={{ ...badgeStyle("accent"), marginLeft: "0.5rem" }}>
                      Featured
                    </span>
                  )}
                </h3>
                <p style={{ color: colors.muted, fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
                  /{proj.slug}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={badgeStyle(proj.status === "published" ? "success" : "muted")}>
                  {proj.status}
                </span>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  style={{
                    ...buttonSecondary,
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.7rem",
                    color: colors.danger,
                    borderColor: colors.danger,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p style={{ color: colors.muted, textAlign: "center", padding: "2rem 0" }}>
              No projects yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
