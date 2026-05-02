'use client';

import { useState, useCallback } from 'react';
import TickerSearch from '@/components/TickerSearch';
import OptionsChain from '@/components/OptionsChain';
import IVRankPanel from '@/components/IVRankPanel';
import PriceLevelsPanel from '@/components/PriceLevelsPanel';
import CallPicks from '@/components/CallPicks';
import DteRangeControl, { DTE_DEFAULT, DteRange } from '@/components/DteRangeControl';

export default function OptionsPage() {
  const [ticker, setTicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [dte, setDte] = useState<DteRange>(DTE_DEFAULT);

  const handleSelect = useCallback((t: string) => {
    setIsLoading(true);
    setTicker(t);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const rangeValid = dte.min <= dte.max;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Options
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
            Volatility, open interest, and call candidates by expiration window.
          </p>
        </div>

        <div className="max-w-sm mb-8">
          <TickerSearch onSelect={handleSelect} isLoading={isLoading} />
        </div>

        {ticker ? (
          <div className="space-y-6">
            <div id="iv-rank-panel" className="scroll-mt-24">
              <IVRankPanel ticker={ticker} />
            </div>
            <div id="chain-panel" className="scroll-mt-24">
              <OptionsChain ticker={ticker} />
            </div>

            <div
              className="pt-6 mt-2"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    By DTE Window
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Aggregate OI and buy candidates filtered by days to expiration
                  </p>
                </div>
                <DteRangeControl value={dte} onChange={setDte} />
              </div>

              {rangeValid && (
                <div className="space-y-6">
                  <div id="oi-levels" className="scroll-mt-24">
                    <PriceLevelsPanel ticker={ticker} minDte={dte.min} maxDte={dte.max} />
                  </div>
                  <div id="buy-candidates" className="scroll-mt-24">
                    <CallPicks ticker={ticker} minDte={dte.min} maxDte={dte.max} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(34,197,94,0.08)' }}
            >
              <svg className="w-6 h-6" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Search a ticker to load the options chain
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Try AAPL, TSLA, SPY, or any US-listed equity
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
