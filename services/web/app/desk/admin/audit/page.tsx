'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface AuditEntry {
  id: string;
  timestamp?: string;
  createdAt?: string;
  user_email?: string;
  userEmail?: string;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ip?: string;
  ipAddress?: string;
}

const actionColors: Record<string, string> = {
  login: '#2196f3',
  logout: '#666',
  create_user: '#4caf50',
  update_user: '#c9a84c',
  disable_user: '#e05555',
  enable_user: '#4caf50',
  delete_user: '#e05555',
  change_password: '#ff9800',
  update_role: '#9c27b0',
};

function ActionBadge({ action }: { action: string }) {
  const color = actionColors[action] || 'var(--color-text-muted)';
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.45rem',
      borderRadius: '9999px',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: color,
      background: `${color}1a`,
      lineHeight: '1.4',
      whiteSpace: 'nowrap',
    }}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMon = Math.floor(diffDay / 30);
  if (diffMon < 12) return `${diffMon}mo ago`;
  return `${Math.floor(diffMon / 12)}y ago`;
}

function absoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

const cardStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid var(--color-gold-dark)',
  borderRadius: '4px',
  padding: 'clamp(1rem, 3vw, 1.5rem)',
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '0.75rem',
  letterSpacing: '0.2em',
  color: 'var(--color-gold)',
  marginBottom: '1.2rem',
  textTransform: 'uppercase',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  color: 'var(--color-gold)',
  textTransform: 'uppercase',
  borderBottom: '1px solid #222',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  fontSize: '0.8rem',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid #1a1a1a',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
};

const LIMIT = 50;

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadEntries = useCallback(async (offset: number, append: boolean) => {
    try {
      const data = await apiFetch(`/api/iam/audit?limit=${LIMIT}&offset=${offset}`);
      const items: AuditEntry[] = Array.isArray(data) ? data : (data?.items || []);
      if (append) {
        setEntries((prev) => [...prev, ...items]);
      } else {
        setEntries(items);
      }
      setHasMore(items.length === LIMIT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    }
  }, []);

  useEffect(() => {
    async function init() {
      await loadEntries(0, false);
      setLoading(false);
    }
    init();
  }, [loadEntries]);

  async function handleLoadMore() {
    setLoadingMore(true);
    await loadEntries(entries.length, true);
    setLoadingMore(false);
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (error) {
    return (
      <div style={{ color: '#e05555', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
        letterSpacing: '0.2em',
        color: 'var(--color-gold)',
        textTransform: 'uppercase',
        marginBottom: '1.5rem',
      }}>
        Audit Log
      </h1>

      <div style={cardStyle}>
        <div style={cardTitleStyle}>Activity</div>

        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            No audit entries
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                <thead>
                  <tr>
                    {['Time', 'User', 'Action', 'Resource', 'Details', 'IP'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isExpanded = expandedIds.has(entry.id);
                    const hasDetails = entry.details && Object.keys(entry.details).length > 0;

                    return (
                      <tr key={entry.id}>
                        <td style={tdStyle} title={absoluteTime(entry.timestamp || entry.createdAt || '')}>
                          {relativeTime(entry.timestamp || entry.createdAt || '')}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--color-text)' }}>
                          {entry.user_email || entry.userEmail || ''}
                        </td>
                        <td style={tdStyle}>
                          <ActionBadge action={entry.action} />
                        </td>
                        <td style={tdStyle}>
                          {entry.resource}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'normal', maxWidth: '300px' }}>
                          {hasDetails ? (
                            <div>
                              <button
                                onClick={() => toggleExpand(entry.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-gold-dark)',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.3rem',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                {isExpanded ? '\u25BC Hide' : '\u25B6 Show'}
                              </button>
                              {isExpanded && (
                                <pre style={{
                                  marginTop: '0.4rem',
                                  padding: '0.5rem',
                                  background: '#0d0d0d',
                                  border: '1px solid #222',
                                  borderRadius: '3px',
                                  fontSize: '0.65rem',
                                  color: 'var(--color-text-muted)',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                  maxHeight: '200px',
                                  overflow: 'auto',
                                  fontFamily: 'monospace',
                                }}>
                                  {JSON.stringify(entry.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#333', fontSize: '0.7rem' }}>--</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                          {entry.ip || entry.ipAddress || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '0.55rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '3px',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: loadingMore ? 'default' : 'pointer',
                    opacity: loadingMore ? 0.6 : 1,
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
