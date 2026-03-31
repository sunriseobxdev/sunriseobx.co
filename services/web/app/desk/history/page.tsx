'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Order {
  id: string;
  submitted_at: string;
  symbol: string;
  side: string;
  type: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  status: string;
}

function statusColor(status: string): string {
  switch (status) {
    case 'filled': return '#4caf50';
    case 'partially_filled': return '#ff9800';
    case 'canceled': case 'expired': return '#888';
    case 'rejected': return '#e05555';
    case 'new': case 'accepted': return '#2196f3';
    default: return 'var(--color-text-muted)';
  }
}

function statusBackground(status: string): string {
  switch (status) {
    case 'filled': return 'rgba(76, 175, 80, 0.12)';
    case 'partially_filled': return 'rgba(255, 152, 0, 0.12)';
    case 'canceled': case 'expired': return 'rgba(136, 136, 136, 0.1)';
    case 'rejected': return 'rgba(224, 85, 85, 0.12)';
    case 'new': case 'accepted': return 'rgba(33, 150, 243, 0.12)';
    default: return 'rgba(90, 80, 64, 0.1)';
  }
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

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/orders?status=all');
        setOrders(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div style={{ color: '#e05555', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={cardTitleStyle}>Order History</div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
          No order history
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
            <thead>
              <tr>
                {['Date', 'Symbol', 'Side', 'Type', 'Qty', 'Filled', 'Avg Price', 'Status'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    color: 'var(--color-gold)',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #222',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    borderBottom: '1px solid #1a1a1a',
                    whiteSpace: 'nowrap',
                  }}>
                    {new Date(order.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    {order.symbol}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: order.side === 'buy' ? '#4caf50' : '#e05555',
                    borderBottom: '1px solid #1a1a1a',
                    textTransform: 'uppercase',
                  }}>
                    {order.side}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    borderBottom: '1px solid #1a1a1a',
                    textTransform: 'capitalize',
                  }}>
                    {order.type.replace('_', ' ')}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text)',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    {order.qty}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text)',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    {order.filled_qty}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text)',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    {order.filled_avg_price
                      ? `$${parseFloat(order.filled_avg_price).toFixed(2)}`
                      : '--'}
                  </td>
                  <td style={{
                    padding: '0.6rem 0.75rem',
                    borderBottom: '1px solid #1a1a1a',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '3px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'capitalize',
                      color: statusColor(order.status),
                      background: statusBackground(order.status),
                    }}>
                      {order.status.replace('_', ' ')}
                    </span>
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
