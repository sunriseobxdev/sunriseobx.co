'use client';

import { useState, useEffect, FormEvent, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import TickerSearch from '@/components/TickerSearch';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, badgeStyle, colors, tableStyle, thStyle, tdStyle } from '@/lib/desk-styles';

interface Order {
  id: string;
  symbol: string;
  side: string;
  type: string;
  qty: string;
  filled_qty: string;
  status: string;
  submitted_at: string;
  limit_price?: string;
  stop_price?: string;
}

interface QuoteData {
  bp: number; bs: number; ap: number; as: number;
}

interface TradeData {
  p: number; s: number;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function TradePage() {
  return <Suspense><TradeInner /></Suspense>;
}

function TradeInner() {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || '');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState('market');
  const [qty, setQty] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeInForce, setTimeInForce] = useState('day');
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live quote for spread visualization
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeData | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiFetch('/api/orders');
      setOrders(data || []);
    } catch {}
  }, []);

  const loadQuote = useCallback(async () => {
    if (!symbol.trim()) { setQuote(null); setLastTrade(null); return; }
    try {
      const [q, t] = await Promise.all([
        apiFetch(`/api/quotes/${symbol.toUpperCase()}/latest`),
        apiFetch(`/api/trades/${symbol.toUpperCase()}/latest`),
      ]);
      setQuote(q);
      setLastTrade(t);
    } catch { setQuote(null); setLastTrade(null); }
  }, [symbol]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadQuote(); }, [loadQuote]);

  // Auto-refresh quote every 5s
  useEffect(() => {
    if (!symbol.trim()) return;
    const interval = setInterval(loadQuote, 5000);
    return () => clearInterval(interval);
  }, [symbol, loadQuote]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const body: Record<string, string> = {
        symbol: symbol.toUpperCase(), side, type: orderType, qty, time_in_force: timeInForce,
      };
      if (orderType === 'limit' || orderType === 'stop_limit') body.limit_price = limitPrice;
      if (orderType === 'stop' || orderType === 'stop_limit') body.stop_price = stopPrice;
      await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(body) });
      setSuccess(`${side.toUpperCase()} ${qty} ${symbol.toUpperCase()} submitted`);
      setQty(''); setLimitPrice(''); setStopPrice('');
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally { setSubmitting(false); }
  }

  async function handleCancel(id: string) {
    try { await apiFetch(`/api/orders/${id}`, { method: 'DELETE' }); loadOrders(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Cancel failed'); }
  }

  const showLimit = orderType === 'limit' || orderType === 'stop_limit';
  const showStop = orderType === 'stop' || orderType === 'stop_limit';
  const spread = quote ? quote.ap - quote.bp : 0;
  const spreadPct = quote && quote.bp > 0 ? (spread / quote.bp * 100) : 0;
  const midPrice = quote ? (quote.ap + quote.bp) / 2 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top row: Order entry + Spread */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '1.5rem' }}>
        {/* Order Entry */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>New Order</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Symbol with autocomplete */}
            <div>
              <label style={labelStyle}>Symbol</label>
              <TickerSearch
                value={symbol}
                onChange={(s) => setSymbol(s)}
                placeholder="Search AAPL, MSFT..."
              />
            </div>

            {/* Side toggle - full width */}
            <div>
              <label style={labelStyle}>Side</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                <button type="button" onClick={() => setSide('buy')} style={{
                  padding: '0.75rem',
                  background: side === 'buy' ? colors.successBg : colors.surfaceLight,
                  border: `2px solid ${side === 'buy' ? colors.success : colors.borderLight}`,
                  borderRadius: '8px 0 0 8px',
                  color: side === 'buy' ? colors.success : colors.muted,
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.15em', transition: 'all 0.15s',
                }}>BUY</button>
                <button type="button" onClick={() => setSide('sell')} style={{
                  padding: '0.75rem',
                  background: side === 'sell' ? colors.dangerBg : colors.surfaceLight,
                  border: `2px solid ${side === 'sell' ? colors.danger : colors.borderLight}`,
                  borderRadius: '0 8px 8px 0',
                  color: side === 'sell' ? colors.danger : colors.muted,
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.15em', transition: 'all 0.15s',
                }}>SELL</button>
              </div>
            </div>

            {/* Type + Quantity row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={orderType} onChange={e => setOrderType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop">Stop</option>
                  <option value="stop_limit">Stop Limit</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Quantity</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                  required min="1" step="1" placeholder="100" style={inputStyle} />
              </div>
            </div>

            {/* Conditional price fields */}
            {(showLimit || showStop) && (
              <div style={{ display: 'grid', gridTemplateColumns: showLimit && showStop ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                {showLimit && (
                  <div>
                    <label style={labelStyle}>Limit Price</label>
                    <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                      required min="0" step="0.01" placeholder={midPrice ? midPrice.toFixed(2) : '150.00'} style={inputStyle} />
                  </div>
                )}
                {showStop && (
                  <div>
                    <label style={labelStyle}>Stop Price</label>
                    <input type="number" value={stopPrice} onChange={e => setStopPrice(e.target.value)}
                      required min="0" step="0.01" placeholder="145.00" style={inputStyle} />
                  </div>
                )}
              </div>
            )}

            {/* TIF */}
            <div>
              <label style={labelStyle}>Time in Force</label>
              <select value={timeInForce} onChange={e => setTimeInForce(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="day">Day</option>
                <option value="gtc">GTC</option>
                <option value="ioc">IOC</option>
                <option value="fok">FOK</option>
              </select>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting} style={{
              width: '100%', padding: '0.85rem',
              background: submitting ? colors.muted : side === 'buy' ? colors.success : colors.danger,
              color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 700, fontSize: '0.9rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
              opacity: submitting ? 0.6 : 1,
            }}>
              {submitting ? 'Submitting...' : `${side.toUpperCase()} ${symbol.toUpperCase() || 'SYMBOL'}`}
            </button>

            {error && <div style={{ color: colors.danger, fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: colors.dangerBg, borderRadius: '8px' }}>{error}</div>}
            {success && <div style={{ color: colors.success, fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: colors.successBg, borderRadius: '8px' }}>{success}</div>}
          </form>
        </div>

        {/* Spread / Quote Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Live Quote */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>{symbol ? `${symbol.toUpperCase()} Quote` : 'Live Quote'}</div>
            {quote ? (
              <div>
                {/* Spread visualization */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: colors.success, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Bid</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: colors.success }}>{formatPrice(quote.bp)}</div>
                      <div style={{ fontSize: '0.7rem', color: colors.muted }}>{quote.bs.toLocaleString()} shares</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
                      <div style={{ fontSize: '0.6rem', color: colors.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Spread</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.accent }}>{formatPrice(spread)}</div>
                      <div style={{ fontSize: '0.65rem', color: colors.muted }}>{spreadPct.toFixed(3)}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', color: colors.danger, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Ask</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: colors.danger }}>{formatPrice(quote.ap)}</div>
                      <div style={{ fontSize: '0.7rem', color: colors.muted }}>{quote.as.toLocaleString()} shares</div>
                    </div>
                  </div>

                  {/* Spread bar */}
                  <div style={{ position: 'relative', height: '6px', background: colors.surfaceLight, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: colors.successBg, borderRadius: '3px 0 0 3px' }} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: colors.dangerBg, borderRadius: '0 3px 3px 0' }} />
                  </div>
                </div>

                {/* Last trade */}
                {lastTrade && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderTop: `1px solid ${colors.borderLight}` }}>
                    <span style={{ fontSize: '0.65rem', color: colors.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Last Trade</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: colors.heading }}>{formatPrice(lastTrade.p)}</span>
                      <span style={{ fontSize: '0.7rem', color: colors.muted, marginLeft: '0.5rem' }}>{lastTrade.s} shs</span>
                    </div>
                  </div>
                )}

                {/* Mid price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderTop: `1px solid ${colors.borderLight}` }}>
                  <span style={{ fontSize: '0.65rem', color: colors.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mid Price</span>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: colors.accent }}>{formatPrice(midPrice)}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: colors.muted, fontSize: '0.85rem' }}>
                {symbol ? 'Loading quote...' : 'Enter a symbol to see live quote'}
              </div>
            )}
          </div>

          {/* Quick symbols */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Quick Select</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'SPY', 'QQQ', 'AMD', 'COIN', 'PLTR'].map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{
                  padding: '0.35rem 0.6rem',
                  background: symbol === s ? 'rgba(249,115,22,0.15)' : colors.surfaceLight,
                  border: `1px solid ${symbol === s ? colors.accent : colors.borderLight}`,
                  borderRadius: '8px',
                  color: symbol === s ? colors.accent : colors.muted,
                  fontSize: '0.7rem', fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.15s',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open Orders */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={cardTitleStyle}>Open Orders</div>
          <button onClick={loadOrders} style={buttonSecondary}>Refresh</button>
        </div>
        {orders.length === 0 ? (
          <div style={{ color: colors.muted, fontSize: '0.85rem' }}>No open orders</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Symbol', 'Side', 'Type', 'Qty', 'Filled', 'Status', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colors.heading }}>{order.symbol}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: order.side === 'buy' ? colors.success : colors.danger, textTransform: 'uppercase' }}>{order.side}</td>
                    <td style={tdStyle}>{order.type}</td>
                    <td style={{ ...tdStyle, color: colors.heading }}>{order.qty}</td>
                    <td style={{ ...tdStyle, color: colors.heading }}>{order.filled_qty}</td>
                    <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{order.status}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleCancel(order.id)} style={{
                        background: 'transparent', border: `1px solid ${colors.danger}`, borderRadius: '6px',
                        color: colors.danger, fontSize: '0.65rem',
                        padding: '0.25rem 0.5rem', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
