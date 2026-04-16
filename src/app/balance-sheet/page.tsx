'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TickerSearch from '@/components/TickerSearch';
import ProcessingState from '@/components/balance-sheet/ProcessingState';
import { analyzeByTicker } from '@/lib/balanceSheetApi';
import { BalanceSheetResult } from '@/types/balanceSheet';

export default function BalanceSheetPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback(async (ticker: string) => {
    setError(null);
    setIsProcessing(true);
    try {
      const response = await analyzeByTicker(ticker);
      if (!response.success || !response.data) {
        setError(response.error || 'Analysis failed');
        setIsProcessing(false);
        return;
      }
      const data: BalanceSheetResult = response.data;
      sessionStorage.setItem('bs-result', JSON.stringify(data));
      sessionStorage.setItem('bs-filename', ticker);
      router.push('/balance-sheet/results');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  }, [router]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Balance Sheet
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--text-secondary)' }}>
            Key line items, financial ratios, and risk flags from SEC filings.
          </p>
        </div>

        {/* Ticker search */}
        <div className="max-w-sm mb-8">
          <TickerSearch onSelect={handleSelect} isLoading={isProcessing} />
        </div>

        {/* Error */}
        {error && (
          <div
            className="max-w-sm mb-6 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'var(--bs-critical-bg)', color: 'var(--bs-critical)' }}
          >
            {error}
          </div>
        )}

        {/* Processing */}
        {isProcessing ? (
          <ProcessingState />
        ) : (
          /* Empty state */
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--bs-accent-dim)' }}
            >
              <svg className="w-6 h-6" style={{ color: 'var(--bs-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Search a company to load its balance sheet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Try AAPL, MSFT, NVDA, or any SEC-listed company
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
