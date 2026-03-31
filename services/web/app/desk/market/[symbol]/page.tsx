'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import NewsFeed from '@/components/NewsFeed';
import FundamentalsCard from '@/components/FundamentalsCard';
import InsiderTable from '@/components/InsiderTable';

interface TickerDetail {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  tags: string[];
  marketCap: string;
  snapshot: {
    latestTrade: {
      price: number;
      size: number;
      timestamp: string;
    } | null;
    latestQuote: {
      bidPrice: number;
      bidSize: number;
      askPrice: number;
      askSize: number;
      timestamp: string;
    } | null;
    dailyBar: {
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    } | null;
    prevDailyBar: {
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    } | null;
    dailyChange: number;
    dailyChangePercent: number;
  } | null;
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

const statLabel: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: '0.25rem',
};

const statValue: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
  fontWeight: 500,
  color: 'var(--color-text)',
};

function formatPrice(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatPercent(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

function formatChange(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}`;
}

function formatVolume(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}

function changeColor(val: number): string {
  return val >= 0 ? '#4caf50' : '#e05555';
}

const sectorColors: Record<string, string> = {
  'Technology': 'rgba(100, 149, 237, 0.2)',
  'Healthcare': 'rgba(76, 175, 80, 0.2)',
  'Financial Services': 'rgba(201, 168, 76, 0.2)',
  'Consumer Cyclical': 'rgba(255, 152, 0, 0.2)',
  'Communication Services': 'rgba(156, 39, 176, 0.2)',
  'Industrials': 'rgba(121, 134, 203, 0.2)',
  'Consumer Defensive': 'rgba(77, 182, 172, 0.2)',
  'Energy': 'rgba(224, 85, 85, 0.2)',
  'Utilities': 'rgba(174, 213, 129, 0.2)',
  'Real Estate': 'rgba(255, 183, 77, 0.2)',
  'Basic Materials': 'rgba(161, 136, 127, 0.2)',
};

function getSectorColor(sector: string): string {
  return sectorColors[sector] || 'rgba(201, 168, 76, 0.15)';
}

function OHLCVGrid({ label, data }: { label: string; data: { open: number; high: number; low: number; close: number; volume: number } }) {
  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <div style={statLabel}>Open</div>
          <div style={statValue}>{formatPrice(data.open)}</div>
        </div>
        <div>
          <div style={statLabel}>High</div>
          <div style={statValue}>{formatPrice(data.high)}</div>
        </div>
        <div>
          <div style={statLabel}>Low</div>
          <div style={statValue}>{formatPrice(data.low)}</div>
        </div>
        <div>
          <div style={statLabel}>Close</div>
          <div style={statValue}>{formatPrice(data.close)}</div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={statLabel}>Volume</div>
          <div style={statValue}>{formatVolume(data.volume)}</div>
        </div>
      </div>
    </div>
  );
}

export default function TickerDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string || '').toUpperCase();

  const [data, setData] = useState<TickerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'news' | 'fundamentals' | 'insiders'>('news');

  useEffect(() => {
    if (!symbol) return;
    async function load() {
      try {
        const result = await apiFetch(`/api/market/tickers/${symbol}`);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticker data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [symbol]);

  if (loading) {
    return (
      <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', padding: '2rem', fontSize: '0.85rem' }}>
        Loading {symbol}...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#e05555', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        No data found for {symbol}
      </div>
    );
  }

  const snap = data.snapshot;
  const hasCompanyInfo = !!(data.name || data.sector || data.description);
  const dailyChange = snap?.dailyChange ?? 0;
  const dailyChangePercent = snap?.dailyChangePercent ?? 0;
  const currentPrice = snap?.latestTrade?.price ?? snap?.dailyBar?.close ?? 0;
  const volume = snap?.dailyBar?.volume ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back link */}
      <div>
        <Link
          href="/desk/market"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-gold)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; }}
        >
          &larr; Back to Market
        </Link>
      </div>

      {/* Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1rem', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: 'var(--color-gold)',
              letterSpacing: '0.05em',
            }}>
              {data.symbol}
            </div>
            {data.name && (
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                color: 'var(--color-text)',
                marginTop: '0.2rem',
              }}>
                {data.name}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
              {data.sector && (
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text)',
                  background: getSectorColor(data.sector),
                  padding: '0.2rem 0.5rem',
                  borderRadius: '10px',
                }}>
                  {data.sector}
                </span>
              )}
              {data.industry && (
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text)',
                  background: 'rgba(201, 168, 76, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '10px',
                }}>
                  {data.industry}
                </span>
              )}
              {data.marketCap && (
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '10px',
                }}>
                  Mkt Cap: {data.marketCap}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}>
              {currentPrice > 0 ? formatPrice(currentPrice) : '--'}
            </div>
            {snap && (
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                color: changeColor(dailyChangePercent),
                marginTop: '0.2rem',
              }}>
                {formatChange(dailyChange)} ({formatPercent(dailyChangePercent)})
              </div>
            )}
            {volume > 0 && (
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.3rem',
              }}>
                Vol: {formatVolume(volume)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No company info warning */}
      {!hasCompanyInfo && (
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          padding: '0.6rem 0.8rem',
          background: 'rgba(201, 168, 76, 0.08)',
          border: '1px solid rgba(201, 168, 76, 0.15)',
          borderRadius: '4px',
        }}>
          No company info available in knowledge base. Showing live market data only.
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>About</div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            color: 'var(--color-text)',
          }}>
            {data.description}
          </div>
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Tags</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {data.tags.map((tag) => (
              <span key={tag} style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.7rem',
                color: 'var(--color-text)',
                background: 'rgba(201, 168, 76, 0.12)',
                padding: '0.2rem 0.55rem',
                borderRadius: '10px',
                letterSpacing: '0.03em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link
          href={`/desk/trade?symbol=${symbol}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.7rem 1.5rem',
            background: 'var(--color-gold)',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '3px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background 0.3s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#b8973f'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)'; }}
        >
          Trade
        </Link>
        <Link
          href={`/desk/chart?symbol=${symbol}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.7rem 1.5rem',
            background: 'transparent',
            color: 'var(--color-gold)',
            border: '1px solid var(--color-gold-dark)',
            borderRadius: '3px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201, 168, 76, 0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          Chart
        </Link>
      </div>

      {/* Live Data Cards */}
      {snap && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1rem',
        }}>
          {/* Latest Quote */}
          {snap.latestQuote && (
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Latest Quote</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={statLabel}>Bid</div>
                  <div style={statValue}>{formatPrice(snap.latestQuote.bidPrice)}</div>
                </div>
                <div>
                  <div style={statLabel}>Ask</div>
                  <div style={statValue}>{formatPrice(snap.latestQuote.askPrice)}</div>
                </div>
                <div>
                  <div style={statLabel}>Bid Size</div>
                  <div style={statValue}>{snap.latestQuote.bidSize.toLocaleString()}</div>
                </div>
                <div>
                  <div style={statLabel}>Ask Size</div>
                  <div style={statValue}>{snap.latestQuote.askSize.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Latest Trade */}
          {snap.latestTrade && (
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Latest Trade</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={statLabel}>Price</div>
                  <div style={statValue}>{formatPrice(snap.latestTrade.price)}</div>
                </div>
                <div>
                  <div style={statLabel}>Size</div>
                  <div style={statValue}>{snap.latestTrade.size.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Bar */}
          {snap.dailyBar && (
            <OHLCVGrid label="Daily Bar" data={snap.dailyBar} />
          )}

          {/* Prev Daily Bar */}
          {snap.prevDailyBar && (
            <OHLCVGrid label="Previous Daily Bar" data={snap.prevDailyBar} />
          )}
        </div>
      )}

      {/* External Data Tabs */}
      <div>
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #222',
          marginBottom: '1rem',
        }}>
          {(['news', 'fundamentals', 'insiders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-gold)' : '2px solid transparent',
                padding: '0.7rem 1.2rem',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: activeTab === tab ? 'var(--color-gold)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
              }}
            >
              {tab === 'news' ? 'News' : tab === 'fundamentals' ? 'Fundamentals' : 'Insiders'}
            </button>
          ))}
        </div>
        {activeTab === 'news' && <NewsFeed symbol={symbol} />}
        {activeTab === 'fundamentals' && <FundamentalsCard symbol={symbol} />}
        {activeTab === 'insiders' && <InsiderTable symbol={symbol} />}
      </div>
    </div>
  );
}
