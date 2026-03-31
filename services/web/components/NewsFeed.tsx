'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: string | number;
  image: string;
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

function relativeTime(datetime: string | number): string {
  try {
    const ts = typeof datetime === 'number' ? datetime * 1000 : new Date(datetime).getTime();
    const now = Date.now();
    const diff = now - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch {
    return '';
  }
}

export default function NewsFeed({ symbol }: { symbol: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    async function load() {
      try {
        const data = await apiFetch(`/api/external/news/${encodeURIComponent(symbol)}`);
        const items = Array.isArray(data) ? data : data?.articles || data?.news || [];
        setArticles(items.slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [symbol]);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>News</div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ background: '#1a1a1a', height: '0.9rem', width: '80%', borderRadius: '3px' }} />
              <div style={{ background: '#1a1a1a', height: '0.7rem', width: '40%', borderRadius: '3px' }} />
              <div style={{ background: '#1a1a1a', height: '0.7rem', width: '95%', borderRadius: '3px' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Unable to load news
        </div>
      ) : articles.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          No recent news for {symbol}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: '0.75rem 0.4rem',
                borderBottom: i < articles.length - 1 ? '1px solid #1a1a1a' : 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201, 168, 76, 0.05)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                lineHeight: '1.4',
                marginBottom: '0.3rem',
              }}>
                {article.headline}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.3rem',
              }}>
                {article.source && (
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.05em',
                    color: 'var(--color-gold)',
                    textTransform: 'uppercase',
                  }}>
                    {article.source}
                  </span>
                )}
                {article.datetime && (
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.65rem',
                    color: 'var(--color-text-muted)',
                  }}>
                    {relativeTime(article.datetime)}
                  </span>
                )}
              </div>
              {article.summary && (
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {article.summary}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
