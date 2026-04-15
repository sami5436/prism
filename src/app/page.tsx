'use client';

import { useState, useCallback } from 'react';
import TickerSearch from '@/components/TickerSearch';
import StockHeader from '@/components/StockHeader';
import PriceChart from '@/components/PriceChart';
import VolumeChart from '@/components/VolumeChart';
import IndicatorsPanel from '@/components/IndicatorsPanel';
import AISummaryCard from '@/components/AISummary';
import OptionsChain from '@/components/OptionsChain';
import ThemeToggle from '@/components/ThemeToggle';
import ModuleNav from '@/components/shared/ModuleNav';
import { StockData } from '@/types/stock';

export default function Home() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<'1mo' | '3mo' | '6mo' | '1y' | '2y'>('1y');
  const [currentTicker, setCurrentTicker] = useState<string>('');

  const fetchStockData = useCallback(async (ticker: string, period: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stock/${ticker}?period=${period}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stock data');
      }

      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTickerSelect = useCallback((ticker: string) => {
    setCurrentTicker(ticker);
    fetchStockData(ticker, currentPeriod);
  }, [currentPeriod, fetchStockData]);

  const handlePeriodChange = useCallback((period: '1mo' | '3mo' | '6mo' | '1y' | '2y') => {
    setCurrentPeriod(period);
    if (currentTicker) {
      fetchStockData(currentTicker, period);
    }
  }, [currentTicker, fetchStockData]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ background: 'var(--bg-primary)', opacity: 0.95, borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Prism.
              </a>
              <ModuleNav />
            </div>

            <div className="flex items-center gap-4">
              {stockData && (
                <div className="w-64">
                  <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16">
        {/* Landing page */}
        {!stockData && !isLoading && !error && (
          <div className="min-h-[90vh] flex flex-col items-center px-4 sm:px-6 pt-20 sm:pt-28">
            <div className="max-w-3xl w-full text-center">
              {/* Brand hero */}
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
                Prism.
              </h1>
              <p className="text-lg md:text-xl font-light mb-16 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Your toolkit for stock analysis and financial intelligence.
              </p>

              {/* Module cards — symmetric grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20 text-left">
                {/* Stock Analysis module */}
                <div
                  className="rounded-2xl p-6 sm:p-8 flex flex-col"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    minHeight: '320px',
                  }}
                >
                  {/* Module icon + label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(168, 162, 255, 0.1)' }}
                    >
                      <svg className="w-5 h-5" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Stock Analysis
                      </h2>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Technical indicators & signals</p>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {[
                      'RSI, MACD, SMA & Bollinger Bands',
                      'Interactive price & volume charts',
                      'Algorithmic signal analysis',
                      'Full options chain data',
                    ].map(feat => (
                      <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* Inline ticker search */}
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Search a ticker to begin</p>
                    <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
                  </div>
                </div>

                {/* Balance Sheet Analyzer module */}
                <div
                  className="rounded-2xl p-6 sm:p-8 flex flex-col"
                  style={{
                    background: 'var(--bs-card-bg)',
                    border: '1px solid var(--bs-accent-border)',
                    minHeight: '320px',
                  }}
                >
                  {/* Module icon + label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bs-accent-dim)' }}
                    >
                      <svg className="w-5 h-5" style={{ color: 'var(--bs-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Balance Sheet
                      </h2>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload & analyze filings</p>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {[
                      'PDF, XBRL & XML file parsing',
                      'Key line item extraction',
                      'Financial ratio computation',
                      'Risk flagging & YoY detection',
                    ].map(feat => (
                      <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--bs-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href="/balance-sheet"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: 'var(--bs-accent)',
                      color: '#000',
                    }}
                    id="hub-bs-cta"
                  >
                    Upload a Balance Sheet
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Indicators Explainer */}
              <div className="pt-16 mt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
                <h2 className="text-2xl font-semibold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
                  Understanding the Indicators
                </h2>
                <p className="text-center max-w-xl mx-auto mb-12" style={{ color: 'var(--text-muted)' }}>
                  Technical indicators help identify trends and potential trading opportunities.
                  Here&apos;s what each one tells you.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                  {[
                    {
                      title: 'RSI (Relative Strength Index)',
                      desc: 'Measures momentum on a scale of 0-100. Above 70 suggests overbought (may drop), below 30 suggests oversold (may rise).',
                      analogy: 'Think of it like a speedometer—when it\u0027s too high, you might need to slow down.',
                    },
                    {
                      title: 'MACD',
                      desc: 'Shows the relationship between two moving averages. When MACD crosses above the signal line, it\u0027s bullish. Below is bearish.',
                      analogy: 'Like comparing a fast runner to a slow one—when the fast one pulls ahead, momentum is building.',
                    },
                    {
                      title: 'Moving Averages (SMA/EMA)',
                      desc: 'Smooth out price data to show trends. When price is above the average, the trend is up. SMA 50 and 200 crossovers are key signals.',
                      analogy: 'Like your GPA—it smooths out daily grades to show your overall performance trend.',
                    },
                    {
                      title: 'Bollinger Bands',
                      desc: 'Shows volatility with upper and lower bands. Price touching bands often reverses. Narrow bands suggest a big move is coming.',
                      analogy: 'Like guardrails on a road—price tends to stay between them and bounces back when it hits.',
                    },
                  ].map(item => (
                    <div key={item.title} className="p-6 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{item.analogy}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-6 rounded-xl max-w-3xl mx-auto" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Signal Summary</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Our algorithmic analysis combines all these indicators to give you a simple bullish,
                    bearish, or neutral signal. It evaluates RSI levels, MACD crossovers,
                    price position relative to moving averages, and volume patterns to
                    generate an overall market sentiment summary.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>{currentTicker}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="min-h-[80vh] flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
              <p className="text-red-400 mb-6">{error}</p>
              <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* Dashboard */}
        {stockData && !isLoading && (
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="space-y-6">
              <div className="md:hidden">
                <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
              </div>

              <StockHeader quote={stockData.quote} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <PriceChart
                    historical={stockData.historical}
                    indicators={stockData.indicators}
                    onPeriodChange={handlePeriodChange}
                    currentPeriod={currentPeriod}
                  />
                  <IndicatorsPanel
                    historical={stockData.historical}
                    indicators={stockData.indicators}
                  />
                </div>

                <div className="space-y-6">
                  <AISummaryCard analysis={stockData.analysis} />
                  <VolumeChart
                    historical={stockData.historical}
                    indicators={stockData.indicators}
                  />
                </div>
              </div>

              <OptionsChain ticker={currentTicker} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
