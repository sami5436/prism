'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchResult } from '@/types/stock';
import { colorFor } from './colors';

interface AssetPickerProps {
  selected: string[];
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  maxSelected?: number;
  loading?: boolean;
}

interface Suggestion {
  symbol: string;
  name: string;
  family: string;
  blurb: string;
}

// Spread across Vanguard / Schwab / Fidelity / index-style options.
const SUGGESTIONS: Suggestion[] = [
  { symbol: 'VOO',   name: 'Vanguard S&P 500 ETF',          family: 'Vanguard', blurb: 'Largest 500 US companies, 0.03% fee.' },
  { symbol: 'VTI',   name: 'Vanguard Total Stock Market',    family: 'Vanguard', blurb: 'Whole US stock market in one fund.' },
  { symbol: 'QQQ',   name: 'Invesco Nasdaq 100',             family: 'Invesco',  blurb: 'Top 100 non-financial Nasdaq names.' },
  { symbol: 'SCHD',  name: 'Schwab US Dividend Equity',      family: 'Schwab',   blurb: '100 high-quality US dividend payers.' },
  { symbol: 'FXAIX', name: 'Fidelity 500 Index Fund',        family: 'Fidelity', blurb: 'S&P 500 mutual fund, 0.015% fee.' },
  { symbol: 'VXUS',  name: 'Vanguard Total International',   family: 'Vanguard', blurb: 'Developed + emerging markets ex-US.' },
];

export default function AssetPicker({
  selected,
  onAdd,
  onRemove,
  maxSelected = 6,
  loading,
}: AssetPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSelected = (sym: string) => selected.some(s => s.toUpperCase() === sym.toUpperCase());
  const atCap = selected.length >= maxSelected;

  const handlePick = (sym: string) => {
    if (atCap || isSelected(sym)) return;
    onAdd(sym.toUpperCase());
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((sym, i) => (
            <span
              key={sym}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: `${colorFor(i)}1f`,
                border: `1px solid ${colorFor(i)}55`,
                color: 'var(--text-primary)',
              }}
            >
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: colorFor(i) }}
              />
              {sym}
              <button
                onClick={() => onRemove(sym)}
                aria-label={`Remove ${sym}`}
                className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="9" y2="9" />
                  <line x1="9" y1="3" x2="3" y2="9" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder={
            atCap
              ? `Limit reached (${maxSelected})`
              : selected.length === 0
                ? 'Search ETFs, mutual funds, indices…'
                : 'Add another asset to compare…'
          }
          disabled={loading || atCap}
          className="w-full px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
        {showDropdown && query.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {searching && (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>Searching…</div>
            )}
            {!searching && results.length === 0 && (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No matches.</div>
            )}
            {results.map(r => {
              const taken = isSelected(r.symbol);
              return (
                <button
                  key={r.symbol}
                  onClick={() => handlePick(r.symbol)}
                  disabled={taken || atCap}
                  className="w-full px-4 py-3 flex items-center justify-between transition-colors text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  onMouseEnter={(e) => { if (!taken && !atCap) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{r.name}</span>
                  </div>
                  <span className="text-xs ml-2 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {taken ? 'Added' : r.type}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div>
        <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Popular picks</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => {
            const taken = isSelected(s.symbol);
            return (
              <button
                key={s.symbol}
                onClick={() => handlePick(s.symbol)}
                disabled={taken || atCap || loading}
                title={s.blurb}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: taken ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: taken ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
              >
                <span className="font-semibold mr-1.5">{s.symbol}</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.family}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
