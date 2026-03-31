'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import EarningsCalendar from '@/components/EarningsCalendar';

interface IndexQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Mover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

interface Sector {
  name: string;
  count: number;
}

interface Ticker {
  symbol: string;
  name: string;
  sector: string;
  marketCap: string;
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.8rem',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '3px',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.85rem',
  outline: 'none',
  transition: 'border-color 0.3s ease',
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

export default function MarketPage() {
  return <Suspense><MarketInner /></Suspense>;
}

function MarketInner() {
  const searchParams = useSearchParams();
  const sectorParam = searchParams.get('sector') || '';

  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState(sectorParam);
  const [loading, setLoading] = useState(true);
  const [tickersLoading, setTickersLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [indicesData, moversData, sectorsData] = await Promise.all([
          apiFetch('/api/market/overview'),
          apiFetch('/api/market/movers'),
          apiFetch('/api/market/sectors'),
        ]);
        setIndices(indicesData?.indices || indicesData || []);
        setGainers(moversData?.gainers || []);
        setLosers(moversData?.losers || []);
        setSectors(sectorsData?.sectors || sectorsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const loadTickers = useCallback(async (q: string, sector: string) => {
    setTickersLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (sector) params.set('sector', sector);
      const qs = params.toString();
      const data = await apiFetch(`/api/market/tickers${qs ? `?${qs}` : ''}`);
      setTickers(data?.tickers || data || []);
    } catch (err) {
      console.error('Failed to load tickers', err);
    } finally {
      setTickersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickers('', sectorParam);
  }, [loadTickers, sectorParam]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTickers(value, sectorFilter);
    }, 300);
  }

  function handleSectorFilterChange(value: string) {
    setSectorFilter(value);
    loadTickers(search, value);
  }

  if (error) {
    return (
      <div style={{ color: '#e05555', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Section 1: Market Indices */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Market Indices</div>
        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
            gap: '0.75rem',
          }}>
            {indices.map((idx) => (
              <Link
                key={idx.symbol}
                href={`/desk/market/${idx.symbol}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#0d0d0d',
                  border: '1px solid #222',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold-dark)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#222'; }}
                >
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.3rem',
                  }}>
                    {idx.symbol}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '0.2rem',
                  }}>
                    {formatPrice(idx.price)}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    color: changeColor(idx.changePercent),
                  }}>
                    {formatChange(idx.change)} ({formatPercent(idx.changePercent)})
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Top Movers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
        gap: '1rem',
      }}>
        {/* Gainers */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Top Gainers</div>
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
              Loading...
            </div>
          ) : gainers.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
              No data available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {gainers.map((m) => (
                <Link
                  key={m.symbol}
                  href={`/desk/market/${m.symbol}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.4rem',
                    borderBottom: '1px solid #1a1a1a',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(76, 175, 80, 0.05)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        flexShrink: 0,
                        width: '55px',
                      }}>
                        {m.symbol}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {m.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text)',
                      }}>
                        {formatPrice(m.price)}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#4caf50',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}>
                        {formatPercent(m.changePercent)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Losers */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Top Losers</div>
          {loading ? (
            <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
              Loading...
            </div>
          ) : losers.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
              No data available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {losers.map((m) => (
                <Link
                  key={m.symbol}
                  href={`/desk/market/${m.symbol}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.4rem',
                    borderBottom: '1px solid #1a1a1a',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(224, 85, 85, 0.05)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        flexShrink: 0,
                        width: '55px',
                      }}>
                        {m.symbol}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {m.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text)',
                      }}>
                        {formatPrice(m.price)}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#e05555',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}>
                        {formatPercent(m.changePercent)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Sector Browser */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Sectors</div>
        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : sectors.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            No sectors available
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))',
            gap: '0.6rem',
          }}>
            {sectors.map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  const newSector = sectorFilter === s.name ? '' : s.name;
                  handleSectorFilterChange(newSector);
                }}
                style={{
                  background: sectorFilter === s.name ? getSectorColor(s.name) : '#0d0d0d',
                  border: `1px solid ${sectorFilter === s.name ? 'var(--color-gold-dark)' : '#222'}`,
                  borderRadius: '4px',
                  padding: '0.6rem 0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold-dark)'; }}
                onMouseLeave={(e) => { if (sectorFilter !== s.name) (e.currentTarget as HTMLElement).style.borderColor = '#222'; }}
              >
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text)',
                  marginBottom: '0.2rem',
                }}>
                  {s.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                }}>
                  {s.count} ticker{s.count !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Earnings Calendar */}
      <EarningsCalendar />

      {/* Section 5: All Tickers */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>All Tickers</div>

        {/* Search + Filter */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.2rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by symbol or name..."
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#333'; }}
            />
          </div>
          <div style={{ flex: '0 1 200px' }}>
            <select
              value={sectorFilter}
              onChange={(e) => handleSectorFilterChange(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">All Sectors</option>
              {sectors.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ticker Grid */}
        {tickersLoading ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            Loading tickers...
          </div>
        ) : tickers.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
            No tickers found
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
            gap: '0.6rem',
          }}>
            {tickers.map((t) => (
              <Link
                key={t.symbol}
                href={`/desk/market/${t.symbol}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#0d0d0d',
                  border: '1px solid #222',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                  height: '100%',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-gold-dark)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#222'; }}
                >
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-gold)',
                    marginBottom: '0.3rem',
                  }}>
                    {t.symbol}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {t.name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {t.sector && (
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text)',
                        background: getSectorColor(t.sector),
                        padding: '0.15rem 0.4rem',
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                      }}>
                        {t.sector}
                      </span>
                    )}
                    {t.marketCap && (
                      <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-muted)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                      }}>
                        {t.marketCap}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
