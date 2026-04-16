'use client';

import { useState } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isBusy: boolean;
}

export default function UrlInput({ onSubmit, isBusy }: UrlInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="https://www.sec.gov/Archives/edgar/…/filing.htm"
        disabled={isBusy}
        className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--bs-card-border)',
        }}
        id="bs-url-input"
      />
      <button
        type="submit"
        disabled={isBusy || !value.trim()}
        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--bs-accent)',
          color: 'var(--bg-primary)',
        }}
        id="bs-url-submit"
      >
        Analyze URL
      </button>
    </form>
  );
}
