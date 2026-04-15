'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { cardStyle, cardTitleStyle, buttonPrimary, buttonSecondary, colors, inputStyle, labelStyle } from '@/lib/desk-styles';

interface MediaEntry {
  name: string;
  type: 'dir' | 'file';
  path: string;
  url?: string;
  size?: number;
  contentType?: string;
  updated?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const CDN_BASE = 'https://cdn.sunriseobx.co';

export default function MediaPage() {
  const [path, setPath] = useState('');
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [newDirName, setNewDirName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFlash = useCallback((type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadEntries = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/media/browse?path=${encodeURIComponent(p)}`);
      setEntries(data.entries || []);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadEntries(path); }, [path, loadEntries]);

  function navigateTo(dir: string) {
    setPath(dir.endsWith('/') ? dir : dir + '/');
  }

  function navigateUp() {
    const parts = path.replace(/\/$/, '').split('/').filter(Boolean);
    parts.pop();
    setPath(parts.length > 0 ? parts.join('/') + '/' : '');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('path', path || 'img/uploads/');
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sunrise_token') : null;
      const res = await fetch(`/api/media/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      showFlash('success', `${data.uploaded.length} file(s) uploaded`);
      loadEntries(path);
    } catch (err) {
      showFlash('error', err instanceof Error ? err.message : 'Upload failed');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function deleteFile(filePath: string) {
    if (!confirm(`Delete ${filePath}?`)) return;
    try {
      await apiFetch(`/api/media/file?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      showFlash('success', 'Deleted');
      loadEntries(path);
    } catch {
      showFlash('error', 'Delete failed');
    }
  }

  async function createDir() {
    if (!newDirName.trim()) return;
    try {
      await apiFetch('/api/media/mkdir', {
        method: 'POST',
        body: JSON.stringify({ path: `${path}${newDirName}` }),
      });
      setNewDirName('');
      showFlash('success', 'Folder created');
      loadEntries(path);
    } catch {
      showFlash('error', 'Failed to create folder');
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    showFlash('success', 'URL copied');
  }

  const images = entries.filter((e) => e.type === 'file' && e.contentType?.startsWith('image/'));
  const dirs = entries.filter((e) => e.type === 'dir');
  const files = entries.filter((e) => e.type === 'file');

  const breadcrumbs = path.split('/').filter(Boolean);

  return (
    <div style={{ maxWidth: '1000px', animation: 'fadeSlideUp 0.3s ease' }}>
      {flash && (
        <div style={{
          padding: '0.6rem 1rem', marginBottom: '1rem', borderRadius: '8px', fontSize: '0.8rem',
          color: flash.type === 'success' ? colors.success : colors.danger,
          background: flash.type === 'success' ? colors.successBg : colors.dangerBg,
        }}>
          {flash.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ ...cardTitleStyle, marginBottom: 0 }}>Media Library</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.svg" onChange={handleUpload} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ ...buttonPrimary, opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: colors.muted, flexWrap: 'wrap' }}>
          <button onClick={() => setPath('')} style={{ background: 'none', border: 'none', color: colors.accent, cursor: 'pointer', fontWeight: 600, padding: 0 }}>
            cdn://
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: colors.muted }}>/</span>
              <button
                onClick={() => setPath(breadcrumbs.slice(0, i + 1).join('/') + '/')}
                style={{ background: 'none', border: 'none', color: i === breadcrumbs.length - 1 ? colors.heading : colors.accent, cursor: 'pointer', fontWeight: i === breadcrumbs.length - 1 ? 700 : 500, padding: 0 }}
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* New Folder */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={newDirName}
          onChange={(e) => setNewDirName(e.target.value)}
          placeholder="New folder name..."
          onKeyDown={(e) => { if (e.key === 'Enter') createDir(); }}
        />
        <button onClick={createDir} style={buttonSecondary}>Create Folder</button>
      </div>

      {loading ? (
        <p style={{ color: colors.muted, textAlign: 'center', padding: '2rem' }}>Loading...</p>
      ) : (
        <>
          {/* Directories */}
          {(path || dirs.length > 0) && (
            <div style={{ ...cardStyle, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {path && (
                  <button onClick={navigateUp} style={{ padding: '0.5rem 1rem', background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: colors.heading, fontWeight: 600 }}>
                    .. (up)
                  </button>
                )}
                {dirs.map((d) => (
                  <button key={d.path} onClick={() => navigateTo(d.path)} style={{ padding: '0.5rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#92400e', fontWeight: 500 }}>
                    {d.name}/
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Grid */}
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {images.map((img) => (
                <div key={img.path} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{ height: '140px', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => setViewImage(img.url || null)}
                  >
                    <img src={img.url} alt={img.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '0.4rem 0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: colors.heading, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={img.name}>
                      {img.name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: colors.muted }}>{formatSize(img.size || 0)}</div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem' }}>
                      <button onClick={() => copyUrl(img.url || '')} style={{ ...buttonSecondary, fontSize: '0.55rem', padding: '0.15rem 0.4rem' }}>Copy URL</button>
                      <button onClick={() => deleteFile(img.path)} style={{ ...buttonSecondary, fontSize: '0.55rem', padding: '0.15rem 0.4rem', color: colors.danger, borderColor: 'rgba(239,68,68,0.3)' }}>Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Non-image files */}
          {files.filter((f) => !f.contentType?.startsWith('image/')).length > 0 && (
            <div style={cardStyle}>
              {files.filter((f) => !f.contentType?.startsWith('image/')).map((f) => (
                <div key={f.path} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f0f4f8', fontSize: '0.8rem', gap: '0.75rem' }}>
                  <span style={{ color: colors.heading, flex: 1, fontWeight: 500 }}>{f.name}</span>
                  <span style={{ color: colors.muted, fontSize: '0.7rem' }}>{formatSize(f.size || 0)}</span>
                  <button onClick={() => copyUrl(f.url || '')} style={{ ...buttonSecondary, fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>URL</button>
                  <button onClick={() => deleteFile(f.path)} style={{ ...buttonSecondary, fontSize: '0.6rem', padding: '0.15rem 0.4rem', color: colors.danger }}>Del</button>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 && !loading && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: colors.muted }}>
              Empty directory. Upload files or create a folder.
            </div>
          )}
        </>
      )}

      {/* Image Lightbox */}
      {viewImage && (
        <div
          onClick={() => setViewImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '2rem' }}
        >
          <img src={viewImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  );
}
