'use client';

import { useState, useCallback, useEffect } from 'react';
import TickerSearch from '@/components/TickerSearch';
import StockHeader from '@/components/StockHeader';
import PriceChart from '@/components/PriceChart';
import VolumeChart from '@/components/VolumeChart';
import IndicatorsPanel from '@/components/IndicatorsPanel';
import QuarterlyReturnsPanel from '@/components/QuarterlyReturnsPanel';
import AISummaryCard from '@/components/AISummary';
import NewsPanel from '@/components/NewsPanel';
import AnalystRatingsPanel from '@/components/AnalystRatingsPanel';
import ThemeToggle from '@/components/ThemeToggle';
import ModuleNav from '@/components/shared/ModuleNav';
import Link from 'next/link';
import { StockData } from '@/types/stock';

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}
interface AnalystData {
  currentPrice: number | null;
  targetMean: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  targetMedian: number | null;
  numAnalysts: number | null;
  recommendationKey: string | null;
  recommendationMean: number | null;
  trend: {
    strongBuy: number; buy: number; hold: number; sell: number; strongSell: number;
  } | null;
}

export default function IndicatorsPage() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<'1mo' | '3mo' | '6mo' | '1y' | '2y'>('1y');
  const [currentTicker, setCurrentTicker] = useState<string>('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analyst, setAnalyst] = useState<AnalystData | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  useEffect(() => {
    if (!currentTicker) return;
    let cancelled = false;
    setSentimentLoading(true);
    setNews([]);
    setAnalyst(null);
    fetch(`/api/stock/${currentTicker}/sentiment`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('sentiment fetch failed'))))
      .then((j) => {
        if (cancelled) return;
        setNews(j.news ?? []);
        setAnalyst(j.analyst ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setNews([]);
          setAnalyst(null);
        }
      })
      .finally(() => { if (!cancelled) setSentimentLoading(false); });
    return () => { cancelled = true; };
  }, [currentTicker]);

  const fetchStockData = useCallback(async (ticker: string, period: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stock/${ticker}?period=${period}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch stock data');
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
    if (currentTicker) fetchStockData(currentTicker, period);
  }, [currentTicker, fetchStockData]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{ background: 'var(--bg-primary)', opacity: 0.95, borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Prism.
            </Link>
            <ModuleNav />
          </div>
          <div className="flex items-center gap-4">
            {stockData && (
              <div className="hidden sm:block w-64">
                <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Indicators
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
            Price action, RSI, MACD, moving averages, Bollinger Bands, and an AI-generated summary.
          </p>
        </div>

        {!stockData && !isLoading && !error && (
          <div className="max-w-sm">
            <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
          </div>
        )}

        {isLoading && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
                style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }}
              />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>{currentTicker}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full text-center">
              <p className="text-red-400 mb-6">{error}</p>
              <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
            </div>
          </div>
        )}

        {stockData && !isLoading && (
          <div className="space-y-6">
            <div className="sm:hidden">
              <TickerSearch onSelect={handleTickerSelect} isLoading={isLoading} />
            </div>
            <StockHeader quote={stockData.quote} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <NewsPanel items={news} loading={sentimentLoading} />
              </div>
              <AnalystRatingsPanel data={analyst} loading={sentimentLoading} />
            </div>
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
                <QuarterlyReturnsPanel
                  historical={stockData.historical}
                  earnings={stockData.earnings ?? []}
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
        )}
      </div>
    </main>
  );
}
