'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TickerInput from '@/components/balance-sheet/TickerInput';
import UploadZone from '@/components/balance-sheet/UploadZone';
import UrlInput from '@/components/balance-sheet/UrlInput';
import ProcessingState from '@/components/balance-sheet/ProcessingState';
import {
  analyzeByTicker,
  uploadBalanceSheet,
  analyzeBalanceSheetUrl,
  validateFile,
  validateUrl,
} from '@/lib/balanceSheetApi';
import { BalanceSheetResult, UploadStatus } from '@/types/balanceSheet';

export default function BalanceSheetPage() {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [, setResult] = useState<BalanceSheetResult | null>(null);

  const handleResult = useCallback(
    (data: BalanceSheetResult, sourceLabel: string) => {
      setResult(data);
      setStatus('success');
      sessionStorage.setItem('bs-result', JSON.stringify(data));
      sessionStorage.setItem('bs-filename', sourceLabel);
      router.push('/balance-sheet/results');
    },
    [router]
  );

  const handleTickerSubmit = useCallback(
    async (ticker: string) => {
      setError(null);
      setStatus('processing');
      try {
        const response = await analyzeByTicker(ticker);
        if (!response.success || !response.data) {
          setError(response.error || 'Analysis failed');
          setStatus('error');
          return;
        }
        handleResult(response.data, ticker);
      } catch {
        setError('Something went wrong. Please try again.');
        setStatus('error');
      }
    },
    [handleResult]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setStatus('error');
        return;
      }
      setError(null);
      setStatus('processing');
      try {
        const response = await uploadBalanceSheet(file);
        if (!response.success || !response.data) {
          setError(response.error || 'Analysis failed');
          setStatus('error');
          return;
        }
        handleResult(response.data, file.name);
      } catch {
        setError('Something went wrong. Please try again.');
        setStatus('error');
      }
    },
    [handleResult]
  );

  const handleUrlSubmit = useCallback(
    async (url: string) => {
      const validation = validateUrl(url);
      if (!validation.valid) {
        setError(validation.error || 'Invalid URL');
        setStatus('error');
        return;
      }
      setError(null);
      setStatus('processing');
      try {
        const response = await analyzeBalanceSheetUrl(url);
        if (!response.success || !response.data) {
          setError(response.error || 'Analysis failed');
          setStatus('error');
          return;
        }
        const label = (() => {
          try {
            const u = new URL(url);
            return u.pathname.split('/').pop() || u.hostname;
          } catch {
            return url;
          }
        })();
        handleResult(response.data, label);
      } catch {
        setError('Something went wrong fetching that URL. Please try again.');
        setStatus('error');
      }
    },
    [handleResult]
  );

  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setResult(null);
  };

  const isBusy = status === 'uploading' || status === 'processing';

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-10 bs-fade-in">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: 'var(--bs-accent-dim)',
              color: 'var(--bs-accent)',
              border: '1px solid var(--bs-accent-border)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--bs-accent)' }} />
            Balance Sheet
          </div>

          <h1
            className="text-3xl sm:text-5xl font-semibold tracking-tight mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Analyze a<br className="sm:hidden" /> Balance Sheet
          </h1>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Enter a ticker to pull live data directly from SEC EDGAR, or upload an XBRL filing.
          </p>
        </div>

        {/* Processing */}
        {status === 'processing' ? (
          <ProcessingState />
        ) : (
          <div className="bs-fade-in bs-stagger-2 space-y-8">

            {/* ── Primary: Ticker lookup ── */}
            <div
              className="p-5 rounded-xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bs-card-border)' }}
            >
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                Ticker symbol · live EDGAR data
              </p>
              <TickerInput
                onSubmit={handleTickerSubmit}
                isBusy={isBusy}
                error={status === 'error' ? error : null}
              />
            </div>

            {/* ── Secondary: File upload ── */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'var(--bs-card-border)' }} />
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  or upload a filing
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--bs-card-border)' }} />
              </div>
              <UploadZone
                onFileSelect={handleFileSelect}
                isUploading={isBusy}
                error={status === 'error' && !error?.toLowerCase().includes('ticker') ? error : null}
              />
            </div>

            {/* ── Tertiary: URL ── */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'var(--bs-card-border)' }} />
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  or paste a filing URL
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--bs-card-border)' }} />
              </div>
              <UrlInput onSubmit={handleUrlSubmit} isBusy={isBusy} />
            </div>
          </div>
        )}

        {/* Error with retry */}
        {status === 'error' && (
          <div className="text-center mt-6 bs-fade-in">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              id="bs-retry-button"
            >
              Try again
            </button>
          </div>
        )}

        {/* Supported formats */}
        <div className="mt-12 bs-fade-in bs-stagger-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { format: 'Ticker', desc: 'Live EDGAR data' },
              { format: 'iXBRL', desc: 'SEC 10-Q/10-K' },
              { format: 'XBRL', desc: 'Structured filings' },
              { format: 'XML', desc: 'Financial data' },
            ].map(item => (
              <div
                key={item.format}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bs-card-border)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bs-accent-dim)', color: 'var(--bs-accent)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.format}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What you'll get */}
        <div className="mt-12 bs-fade-in bs-stagger-4">
          <h2 className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--text-muted)' }}>
            What you&apos;ll get
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Key line items extracted',
              'Financial ratios computed',
              'Multi-period comparison',
              'Risk flags highlighted',
            ].map(item => (
              <div
                key={item}
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--bs-card-border)' }}
              >
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--bs-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
