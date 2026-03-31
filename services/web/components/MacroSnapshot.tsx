'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface MacroSeries {
  id: string;
  name: string;
  value: string | number;
  date: string;
  unit: string;
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

const INDICATOR_IDS = ['FEDFUNDS', 'DGS10', 'DGS2', 'CPIAUCSL', 'UNRATE'];

const INDICATOR_LABELS: Record<string, string> = {
  FEDFUNDS: 'Fed Funds Rate',
  DGS10: '10Y Treasury',
  DGS2: '2Y Treasury',
  CPIAUCSL: 'CPI',
  UNRATE: 'Unemployment',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr || '';
  }
}

export default function MacroSnapshot() {
  const [series, setSeries] = useState<MacroSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/external/macro');
        setSeries(data?.series || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load macro data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function findSeries(id: string): MacroSeries | undefined {
    return series.find((s) => s.id === id);
  }

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Macro Indicators</div>
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Unable to load macro data
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
          gap: '0.75rem',
        }}>
          {INDICATOR_IDS.map((id) => {
            const item = findSeries(id);
            return (
              <div
                key={id}
                style={{
                  background: '#0d0d0d',
                  border: '1px solid #222',
                  borderRadius: '4px',
                  padding: '0.75rem',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}>
                  {INDICATOR_LABELS[id] || id}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '0.2rem',
                }}>
                  {item ? `${item.value}${item.unit === 'Percent' || item.unit === '%' ? '%' : ''}` : '\u2014'}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.6rem',
                  color: 'var(--color-text-muted)',
                }}>
                  {item ? formatDate(item.date) : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
