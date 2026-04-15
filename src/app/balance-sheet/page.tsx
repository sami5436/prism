'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/balance-sheet/UploadZone';
import ProcessingState from '@/components/balance-sheet/ProcessingState';
import { uploadBalanceSheet, validateFile } from '@/lib/balanceSheetApi';
import { BalanceSheetResult, UploadStatus } from '@/types/balanceSheet';

export default function BalanceSheetPage() {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [, setResult] = useState<BalanceSheetResult | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate first
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setStatus('uploading');

    try {
      setStatus('processing');
      const response = await uploadBalanceSheet(file);

      if (!response.success || !response.data) {
        setError(response.error || 'Analysis failed');
        setStatus('error');
        return;
      }

      setResult(response.data);
      setStatus('success');

      // Store result for the results page
      sessionStorage.setItem('bs-result', JSON.stringify(response.data));
      sessionStorage.setItem('bs-filename', file.name);

      // Navigate to results
      router.push('/balance-sheet/results');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  }, [router]);

  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setResult(null);
  };

  const isUploading = status === 'uploading' || status === 'processing';

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
            Balance Sheet Analyzer
          </div>

          <h1
            className="text-3xl sm:text-5xl font-semibold tracking-tight mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Analyze a<br className="sm:hidden" /> Balance Sheet
          </h1>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Upload a filing to extract key line items, compute ratios, and surface insights.
          </p>
        </div>

        {/* Upload or Processing */}
        {status === 'processing' ? (
          <ProcessingState />
        ) : (
          <div className="bs-fade-in bs-stagger-2">
            <UploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              error={error}
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                format: 'PDF',
                desc: 'Annual reports, 10-K filings',
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                format: 'XBRL',
                desc: 'SEC structured filings',
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
              },
              {
                format: 'XML',
                desc: 'Structured financial data',
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                ),
              },
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
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.format}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.desc}
                  </p>
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
              'YoY change detection',
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
