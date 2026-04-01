import { remark } from 'remark'
import html from 'remark-html'

const API_BASE = process.env.API_URL || 'https://api.sunriseobx.co'

async function fetchPosts() {
  const res = await fetch(`${API_BASE}/api/cms/posts`)
  if (!res.ok) return []
  return res.json()
}

function mapPost(post) {
  const content = post.content || {}
  return {
    id: post.slug,
    title: post.title,
    description: post.excerpt,
    date: post.published_at,
    image: post.image_url,
    category: content.categories || [],
    author: content.author || { name: '', avatar: '' },
  }
}

export async function getSortedPostsData() {
  const posts = await fetchPosts()
  return posts.map(mapPost)
}

export async function getPaginatedPostsData(limit, page) {
  const allPosts = await getSortedPostsData()
  const paginatedPosts = allPosts.slice((page - 1) * limit, page * limit)
  return { posts: paginatedPosts, total: allPosts.length }
}

export async function getRelatedPosts(current_id) {
  const allPosts = await getSortedPostsData()
  return allPosts.filter(p => p.id !== current_id)
}

export async function getAllPostsIds() {
  const allPosts = await getSortedPostsData()
  return allPosts.map(post => ({
    params: { id: post.id }
  }))
}

export async function getPostData(id) {
  const res = await fetch(`${API_BASE}/api/cms/posts/${id}`)
  if (!res.ok) return null
  const post = await res.json()
  const content = post.content || {}

  const processedContent = await remark()
    .use(html)
    .process(content.markdown || '')
  const contentHtml = processedContent.toString()

  return {
    id: post.slug,
    title: post.title,
    description: post.excerpt,
    date: post.published_at,
    image: post.image_url,
    contentHtml,
    category: content.categories || [],
    author: content.author || { name: '', avatar: '' },
    gallery: content.gallery || { enabled: false, items: [], cols: 3 },
    additional: content.additional || { enabled: false, content: '' },
  }
}
