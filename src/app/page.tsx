'use client';

import { useState, useCallback } from 'react';
import TickerSearch from '@/components/TickerSearch';
import StockHeader from '@/components/StockHeader';
import PriceChart from '@/components/PriceChart';
import VolumeChart from '@/components/VolumeChart';
import IndicatorsPanel from '@/components/IndicatorsPanel';
import AISummaryCard from '@/components/AISummary';
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
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - clickable home button */}
            <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-xl font-black text-white">P</span>
              </div>
              <h1 className="text-xl font-bold text-white">Prism</h1>
            </a>

            {/* Search in header when stock is loaded */}
            {stockData && (
              <div className="hidden md:block w-96">
                <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section when no stock is loaded */}
        {!stockData && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
            {/* Hero text */}
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-white">
                Stock Intelligence
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl">
                Analyze any stock with powerful technical indicators, real-time charts,
                and AI-powered insights to guide your trading decisions.
              </p>
            </div>

            {/* Search */}
            <div className="w-full max-w-2xl">
              <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
              <FeatureCard
                icon="chart"
                title="Technical Indicators"
                description="SMA, EMA, RSI, MACD, Bollinger Bands and more"
              />
              <FeatureCard
                icon="trending"
                title="Interactive Charts"
                description="Visualize price action with customizable overlays"
              />
              <FeatureCard
                icon="cpu"
                title="AI Analysis"
                description="Get instant bullish/bearish signals and summaries"
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6 stagger-children">
            <div className="h-40 skeleton rounded-2xl" />
            <div className="h-[400px] skeleton rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 skeleton rounded-2xl" />
              <div className="h-64 skeleton rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <div className="text-6xl text-amber-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Something went wrong</h3>
              <p className="text-slate-400">{error}</p>
            </div>
            <div className="w-full max-w-xl">
              <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* Stock dashboard */}
        {stockData && !isLoading && (
          <div className="space-y-6 stagger-children">
            {/* Mobile search */}
            <div className="md:hidden">
              <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
            </div>

            {/* Stock header */}
            <StockHeader quote={stockData.quote} />

            {/* Main content grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left column - Charts */}
              <div className="xl:col-span-2 space-y-6">
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

              {/* Right column - AI Summary & Volume */}
              <div className="space-y-6">
                <AISummaryCard analysis={stockData.analysis} />
                <VolumeChart
                  historical={stockData.historical}
                  indicators={stockData.indicators}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            Data provided by Yahoo Finance. For informational purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const renderIcon = () => {
    switch (icon) {
      case 'chart':
        return (
          <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'trending':
        return (
          <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'cpu':
        return (
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group cursor-pointer">
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-colors">
        <div className="mb-3">{renderIcon()}</div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}
