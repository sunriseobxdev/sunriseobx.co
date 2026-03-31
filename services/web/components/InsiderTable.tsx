'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface InsiderTransaction {
  name: string;
  share: string | number;
  change: string | number;
  transactionDate: string;
  transactionCode: string;
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

function transactionLabel(code: string): { text: string; color: string } {
  const c = (code || '').toUpperCase();
  if (c === 'P' || c === 'A') return { text: 'Purchase', color: '#4caf50' };
  if (c === 'S' || c === 'D' || c === 'F') return { text: 'Sale', color: '#e05555' };
  if (c === 'M') return { text: 'Exercise', color: 'var(--color-gold)' };
  return { text: code || '\u2014', color: 'var(--color-text-muted)' };
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr || '\u2014';
  }
}

function formatShares(val: string | number): string {
  if (val === undefined || val === null || val === '') return '\u2014';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '\u2014';
  return num.toLocaleString();
}

export default function InsiderTable({ symbol }: { symbol: string }) {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!symbol) return;
    async function load() {
      try {
        const result = await apiFetch(`/api/external/insiders/${encodeURIComponent(symbol)}`);
        const items = result?.data || [];
        setTransactions(items.slice(0, 15));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load insider data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [symbol]);

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Insider Transactions</div>
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Unable to load insider data
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          No insider transactions for {symbol}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Name', 'Type', 'Shares', 'Change'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => {
                const txType = transactionLabel(tx.transactionCode);
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.name || '\u2014'}
                    </td>
                    <td style={{ ...tdStyle, color: txType.color, fontWeight: 600 }}>
                      {txType.text}
                    </td>
                    <td style={tdStyle}>
                      {formatShares(tx.share)}
                    </td>
                    <td style={tdStyle}>
                      {formatShares(tx.change)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
