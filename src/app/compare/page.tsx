'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import ModuleNav from '@/components/shared/ModuleNav';
import AssetPicker from '@/components/compare/AssetPicker';
import ExecutiveSummary from '@/components/compare/ExecutiveSummary';
import ReturnsTable from '@/components/compare/ReturnsTable';
import GrowthChart from '@/components/compare/GrowthChart';
import MonteCarloPanel from '@/components/compare/MonteCarloPanel';
import DrawdownsTable from '@/components/compare/DrawdownsTable';
import IncomeBreakdown from '@/components/compare/IncomeBreakdown';
import AssetDetailCards from '@/components/compare/AssetDetailCards';
import type { CompareResponse } from '@/components/compare/types';

const STORAGE_KEY = 'prism:compare:selected';

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate selected from localStorage so refresh keeps the comparison.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
          setSelected(parsed.slice(0, 6));
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // ignore
    }
  }, [selected, hydrated]);

  const fetchData = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const path = symbols.map(s => encodeURIComponent(s)).join(',');
      const res = await fetch(`/api/compare/${path}?years=25`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to load comparison');
      setData(j as CompareResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when selection changes (post-hydration only).
  useEffect(() => {
    if (!hydrated) return;
    fetchData(selected);
  }, [selected, hydrated, fetchData]);

  const handleAdd = useCallback((sym: string) => {
    setSelected(prev => (prev.includes(sym) ? prev : [...prev, sym]));
  }, []);
  const handleRemove = useCallback((sym: string) => {
    setSelected(prev => prev.filter(s => s !== sym));
  }, []);
  const handleClear = useCallback(() => setSelected([]), []);

  const validAssets = useMemo(
    () => (data?.assets ?? []).filter(a => !a.error && (a.historical?.length ?? 0) > 0),
    [data],
  );
  const userAssets = useMemo(
    () => validAssets.filter(a => a.symbol !== data?.benchmarkSymbol),
    [validAssets, data?.benchmarkSymbol],
  );

  const erroredSymbols = useMemo(
    () => (data?.assets ?? []).filter(a => a.error || (a.historical?.length ?? 0) === 0).map(a => a.symbol),
    [data],
  );

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{ background: 'var(--bg-primary)', opacity: 0.95, borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Prism.
            </Link>
            <ModuleNav />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="pt-20 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header / picker */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Compare
          </h1>
          <p className="text-sm sm:text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
            Stack ETFs, mutual funds, and indices side by side. Long-term returns, drawdowns through real crises, and projection cones.
          </p>

          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <AssetPicker
              selected={selected}
              onAdd={handleAdd}
              onRemove={handleRemove}
              loading={loading}
            />
            {selected.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{selected.length} of 6 selected</span>
                <button
                  onClick={handleClear}
                  className="hover:underline cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* States */}
        {!hydrated || (loading && !data) ? (
          <LoadingState />
        ) : selected.length === 0 ? (
          <EmptyState />
        ) : error ? (
          <ErrorState message={error} />
        ) : data && validAssets.length === 0 ? (
          <ErrorState message="No data could be loaded for the selected symbols." />
        ) : data && userAssets.length > 0 ? (
          <div className="space-y-6">
            {erroredSymbols.length > 0 && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--bs-warning-bg)', color: 'var(--bs-warning)', border: '1px solid var(--bs-warning)' }}
              >
                Couldn&apos;t load data for: {erroredSymbols.join(', ')}.
              </div>
            )}

            <ExecutiveSummary
              assets={validAssets}
              benchmarkSymbol={data.benchmarkSymbol}
              benchmarkLabel={data.benchmarkLabel}
            />

            <GrowthChart
              assets={validAssets}
              benchmarkSymbol={data.benchmarkSymbol}
              benchmarkLabel={data.benchmarkLabel}
              initialValue={10_000}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReturnsTable
                assets={validAssets}
                benchmarkSymbol={data.benchmarkSymbol}
                benchmarkLabel={data.benchmarkLabel}
              />
              <MonteCarloPanel
                assets={validAssets}
                benchmarkSymbol={data.benchmarkSymbol}
                initialValue={10_000}
              />
            </div>

            <IncomeBreakdown
              assets={validAssets}
              benchmarkSymbol={data.benchmarkSymbol}
              years={10}
            />

            <DrawdownsTable
              assets={validAssets}
              benchmarkSymbol={data.benchmarkSymbol}
              benchmarkLabel={data.benchmarkLabel}
            />

            <AssetDetailCards
              assets={validAssets}
              benchmarkSymbol={data.benchmarkSymbol}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-8 sm:p-12 text-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <div className="max-w-md mx-auto">
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(168,162,255,0.1)' }}
        >
          <svg className="w-6 h-6" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l3 0m6 0l-3-9m3 9l3 9m0-9l3-9m-3 9l3 9M3 12h18" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Pick something to compare
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tap a popular pick above, or search for any ETF, mutual fund, or index. Add up to six. The S&amp;P 500 is shown as a benchmark automatically.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="rounded-2xl p-6 h-40 animate-pulse"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bs-critical)' }}
    >
      <p style={{ color: 'var(--bs-critical)' }}>{message}</p>
    </div>
  );
}
