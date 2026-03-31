'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Ticker {
  symbol: string;
  name: string;
  sector: string;
}

interface TickerSearchProps {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
}

export default function TickerSearch({ value, onChange, placeholder = 'Search ticker...' }: TickerSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Ticker[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setQuery(value); }, [value]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await apiFetch(`/api/market/tickers?q=${encodeURIComponent(q)}`);
      setResults((data || []).slice(0, 12));
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    setOpen(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(val), 200);
  }

  function handleSelect(symbol: string) {
    setQuery(symbol);
    setOpen(false);
    onChange(symbol);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { if (query.trim()) { setOpen(true); search(query); } }}
        onKeyDown={e => {
          if (e.key === 'Enter') { setOpen(false); onChange(query.toUpperCase()); }
        }}
        placeholder={placeholder}
        autoComplete="off"
        style={{
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
        }}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#141414',
          border: '1px solid #333',
          borderTop: 'none',
          borderRadius: '0 0 3px 3px',
          maxHeight: '260px',
          overflowY: 'auto',
          zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {results.map(t => (
            <button
              key={t.symbol}
              onClick={() => handleSelect(t.symbol)}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.8rem',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #1a1a1a',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-gold)',
                minWidth: '50px',
              }}>
                {t.symbol}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: 'var(--color-text)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {t.name}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.6rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.05em',
              }}>
                {t.sector}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && loading && results.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#141414', border: '1px solid #333', borderTop: 'none',
          padding: '0.6rem 0.8rem', color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)', fontSize: '0.75rem', zIndex: 50,
        }}>
          Searching...
        </div>
      )}
    </div>
  );
}
