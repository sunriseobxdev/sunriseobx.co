'use client';
import { cardStyle, cardTitleStyle, inputStyle, labelStyle, buttonPrimary, buttonSecondary, badgeStyle, colors, tableStyle, thStyle, tdStyle, pageTitle, sectionGap } from '@/lib/desk-styles';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TickerSearch from '@/components/TickerSearch';

export default function ChartPage() {
  return <Suspense><ChartInner /></Suspense>;
}

function ChartInner() {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'SPY');
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Clear previous widget
    widgetRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol.toUpperCase(),
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: colors.surface,
      gridColor: 'rgba(201, 168, 76, 0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: [
        'STD;SMA',
        'STD;RSI',
      ],
      overrides: {
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': colors.surface,
        'paneProperties.vertGridProperties.color': 'rgba(201, 168, 76, 0.04)',
        'paneProperties.horzGridProperties.color': 'rgba(201, 168, 76, 0.04)',
        'scalesProperties.textColor': '#5a5040',
        'scalesProperties.lineColor': 'rgba(201, 168, 76, 0.1)',
        'mainSeriesProperties.candleStyle.upColor': '#4caf50',
        'mainSeriesProperties.candleStyle.downColor': '#e05555',
        'mainSeriesProperties.candleStyle.borderUpColor': '#4caf50',
        'mainSeriesProperties.candleStyle.borderDownColor': '#e05555',
        'mainSeriesProperties.candleStyle.wickUpColor': '#4caf50',
        'mainSeriesProperties.candleStyle.wickDownColor': '#e05555',
        'volumePaneSize': 'medium',
      },
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    widgetRef.current.appendChild(wrapper);
    widgetRef.current.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  // Calculate widget height to fill available space
  const [widgetHeight, setWidgetHeight] = useState(500);
  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Subtract search bar (~50px) and attribution (~20px) and padding
        setWidgetHeight(Math.max(300, rect.height - 80));
      } else {
        // Fallback: use viewport minus header/nav
        const vh = window.innerHeight;
        const isMobile = window.innerWidth < 768;
        setWidgetHeight(Math.max(300, vh - (isMobile ? 180 : 160)));
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
      {/* Symbol Search */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.5rem 0',
        flexShrink: 0,
      }}>
        <div style={{ width: 'min(220px, 45vw)' }}>
          <TickerSearch value={symbol} onChange={setSymbol} placeholder="Symbol" />
        </div>
        <span style={{
          fontFamily: 'inherit',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          color: colors.borderLight,
          textTransform: 'uppercase',
        }}>
          {symbol.toUpperCase()}
        </span>
      </div>

      {/* TradingView Widget — explicit pixel height for iframe to fill */}
      <div style={{
        height: `${widgetHeight}px`,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: '4px',
        overflow: 'hidden',
        background: colors.surface,
      }}>
        <div
          ref={widgetRef}
          className="tradingview-widget-container"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      {/* Attribution */}
      <div style={{
        fontFamily: 'inherit',
        fontSize: '0.6rem',
        color: colors.body,
        textAlign: 'right',
        opacity: 0.5,
        flexShrink: 0,
      }}>
        Chart powered by TradingView
      </div>
    </div>
  );
}
