'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface EarningsEntry {
  symbol: string;
  date: string;
  epsEstimate: string | number | null;
  epsActual: string | number | null;
  revenueEstimate: string | number | null;
  revenueActual: string | number | null;
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
  padding: '0.6rem 1rem',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  color: 'var(--color-gold)',
  textTransform: 'uppercase',
  borderBottom: '1px solid #222',
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-sans)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 1rem',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
  borderBottom: '1px solid #1a1a1a',
  fontFamily: 'var(--font-sans)',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr || '\u2014';
  }
}

function formatValue(val: string | number | null | undefined, prefix?: string): string {
  if (val === null || val === undefined || val === '' || val === 'None') return '\u2014';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '\u2014';
  if (prefix === '$') {
    if (Math.abs(num) >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  }
  return num.toFixed(2);
}

export default function EarningsCalendar() {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/external/earnings');
        const items = data?.earningsCalendar || [];
        const sorted = items
          .sort((a: EarningsEntry, b: EarningsEntry) => {
            try {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            } catch {
              return 0;
            }
          })
          .slice(0, 20);
        setEntries(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Upcoming Earnings</div>
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Unable to load earnings data
        </div>
      ) : entries.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          No upcoming earnings
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Symbol', 'EPS Estimate', 'Revenue Estimate'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={`${entry.symbol}-${i}`}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {formatDate(entry.date)}
                  </td>
                  <td style={tdStyle}>
                    <Link
                      href={`/desk/market/${entry.symbol}`}
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-gold)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#b8973f'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-gold)'; }}
                    >
                      {entry.symbol}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    {formatValue(entry.epsEstimate)}
                  </td>
                  <td style={tdStyle}>
                    {formatValue(entry.revenueEstimate, '$')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
