'use client';

import { useState } from 'react';

interface TickerInputProps {
  onSubmit: (ticker: string) => void;
  isBusy: boolean;
  error?: string | null;
}

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'TSLA', 'META', 'BRK-B'];

export default function TickerInput({ onSubmit, isBusy, error }: TickerInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!isBusy && trimmed) onSubmit(trimmed);
  };

  const handleQuick = (ticker: string) => {
    if (!isBusy) {
      setValue(ticker);
      onSubmit(ticker);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          placeholder="e.g. AAPL"
          maxLength={5}
          disabled={isBusy}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 px-4 py-3 rounded-lg text-sm font-mono font-semibold tracking-widest outline-none transition-colors uppercase"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bs-card-border)',
          }}
          id="bs-ticker-input"
        />
        <button
          type="submit"
          disabled={isBusy || !value.trim()}
          className="px-5 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--bs-accent)', color: 'var(--bg-primary)' }}
          id="bs-ticker-submit"
        >
          Analyze
        </button>
      </form>

      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm bs-fade-in"
          style={{ background: 'var(--bs-critical-bg)', color: 'var(--bs-critical)' }}
        >
          {error}
        </div>
      )}

      {/* Quick-select popular tickers */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_TICKERS.map(ticker => (
          <button
            key={ticker}
            onClick={() => handleQuick(ticker)}
            disabled={isBusy}
            className="px-3 py-1.5 rounded-md text-xs font-mono font-semibold tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bs-accent-dim)]"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--bs-accent)',
              border: '1px solid var(--bs-accent-border)',
            }}
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  );
}
