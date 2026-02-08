'use client';

import { useState, useCallback } from 'react';
import TickerSearch from '@/components/TickerSearch';
import StockHeader from '@/components/StockHeader';
import PriceChart from '@/components/PriceChart';
import VolumeChart from '@/components/VolumeChart';
import IndicatorsPanel from '@/components/IndicatorsPanel';
import AISummaryCard from '@/components/AISummary';
import ThemeToggle from '@/components/ThemeToggle';
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
            <a href="/" className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Prism.
            </a>

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
          <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24">
            <div className="max-w-2xl w-full text-center">
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
                Prism.
              </h1>
              <p className="text-xl md:text-2xl font-light mb-12" style={{ color: 'var(--text-secondary)' }}>
                Stock analysis, simplified.
              </p>

              <div className="max-w-md mx-auto mb-16">
                <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto text-sm mb-24">
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Technical</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>RSI, MACD, SMA</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Charts</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Interactive overlays</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Signals</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Algorithmic analysis</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                  <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>RSI (Relative Strength Index)</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                      Measures momentum on a scale of 0-100. Above 70 suggests overbought (may drop),
                      below 30 suggests oversold (may rise).
                    </p>
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      Think of it like a speedometer—when it&apos;s too high, you might need to slow down.
                    </p>
                  </div>

                  <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>MACD</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                      Shows the relationship between two moving averages. When MACD crosses above
                      the signal line, it&apos;s bullish. Below is bearish.
                    </p>
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      Like comparing a fast runner to a slow one—when the fast one pulls ahead, momentum is building.
                    </p>
                  </div>

                  <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Moving Averages (SMA/EMA)</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                      Smooth out price data to show trends. When price is above the average,
                      the trend is up. SMA 50 and 200 crossovers are key signals.
                    </p>
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      Like your GPA—it smooths out daily grades to show your overall performance trend.
                    </p>
                  </div>

                  <div className="p-6 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Bollinger Bands</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                      Shows volatility with upper and lower bands. Price touching bands often
                      reverses. Narrow bands suggest a big move is coming.
                    </p>
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      Like guardrails on a road—price tends to stay between them and bounces back when it hits.
                    </p>
                  </div>
                </div>

                <div className="mt-12 p-6 rounded-lg max-w-3xl mx-auto" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
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
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
