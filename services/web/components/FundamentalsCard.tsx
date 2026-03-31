'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface FundamentalsOverview {
  Name?: string;
  Sector?: string;
  MarketCapitalization?: string;
  PERatio?: string;
  EPS?: string;
  DividendYield?: string;
  '52WeekHigh'?: string;
  '52WeekLow'?: string;
  RevenueTTM?: string;
  GrossProfitTTM?: string;
  [key: string]: string | undefined;
}

interface IncomeReport {
  totalRevenue?: string;
  netIncome?: string;
  fiscalDateEnding?: string;
}

interface FundamentalsData {
  overview: FundamentalsOverview;
  income?: {
    annualReports?: IncomeReport[];
  };
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

function formatLargeNumber(val: string | undefined): string {
  if (!val || val === 'None' || val === '-') return '\u2014';
  const num = parseFloat(val);
  if (isNaN(num)) return '\u2014';
  if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatMetric(val: string | undefined, suffix?: string): string {
  if (!val || val === 'None' || val === '-' || val === '0') return '\u2014';
  const num = parseFloat(val);
  if (isNaN(num)) return '\u2014';
  return `${num.toFixed(2)}${suffix || ''}`;
}

function formatPercent(val: string | undefined): string {
  if (!val || val === 'None' || val === '-' || val === '0') return '\u2014';
  const num = parseFloat(val);
  if (isNaN(num)) return '\u2014';
  return `${(num * 100).toFixed(2)}%`;
}

function formatPrice(val: string | undefined): string {
  if (!val || val === 'None' || val === '-') return '\u2014';
  const num = parseFloat(val);
  if (isNaN(num)) return '\u2014';
  return `$${num.toFixed(2)}`;
}

export default function FundamentalsCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    async function load() {
      try {
        const result = await apiFetch(`/api/external/fundamentals/${encodeURIComponent(symbol)}`);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fundamentals');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [symbol]);

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Fundamentals</div>
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !data?.overview) {
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Fundamentals</div>
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          {error ? 'Unable to load fundamentals' : 'No fundamental data available'}
        </div>
      </div>
    );
  }

  const overview = data.overview;
  const latestAnnual = data.income?.annualReports?.[0];

  const metrics: { label: string; value: string }[] = [
    { label: 'Market Cap', value: formatLargeNumber(overview.MarketCapitalization) },
    { label: 'P/E Ratio', value: formatMetric(overview.PERatio) },
    { label: 'EPS', value: formatPrice(overview.EPS) },
    { label: 'Dividend Yield', value: formatPercent(overview.DividendYield) },
    { label: '52W High', value: formatPrice(overview['52WeekHigh']) },
    { label: '52W Low', value: formatPrice(overview['52WeekLow']) },
    { label: 'Revenue', value: latestAnnual?.totalRevenue ? formatLargeNumber(latestAnnual.totalRevenue) : formatLargeNumber(overview.RevenueTTM) },
    { label: 'Net Income', value: latestAnnual?.netIncome ? formatLargeNumber(latestAnnual.netIncome) : '\u2014' },
  ];

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Fundamentals</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
      }}>
        {metrics.map((m) => (
          <div key={m.label}>
            <div style={statLabel}>{m.label}</div>
            <div style={statValue}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
