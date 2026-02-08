'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResult } from '@/types/stock';

interface TickerSearchProps {
    onSelect: (symbol: string) => void;
    isLoading?: boolean;
}

export default function TickerSearch({ onSelect, isLoading }: TickerSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [cachedTickers, setCachedTickers] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [searching, setSearching] = useState(false);
    const [hasCached, setHasCached] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const searchTickers = useCallback(async (q: string) => {
        if (q.length < 1) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const loadCachedTickers = useCallback(async () => {
        if (hasCached) return;
        try {
            const res = await fetch('/api/tickers');
            const data = await res.json();
            setCachedTickers(data.results || []);
            setHasCached(true);
        } catch (error) {
            console.error('Failed to load cached tickers:', error);
        }
    }, [hasCached]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchTickers(query);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, searchTickers]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (symbol: string) => {
        setQuery(symbol);
        setShowDropdown(false);
        onSelect(symbol);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const items = query.length === 0 ? cachedTickers : results;
            setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const items = query.length === 0 ? cachedTickers : results;
            handleSelect(items[selectedIndex].symbol);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <div className="relative w-full max-w-xl mx-auto">
            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => {
                        setShowDropdown(true);
                        loadCachedTickers();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search stocks... (e.g., AAPL, MSFT, GOOGL)"
                    disabled={isLoading}
                    className="w-full px-6 py-4 bg-slate-800 text-white placeholder-slate-400 rounded-xl border border-slate-600 focus:outline-none focus:border-slate-400 transition-colors text-lg"
                />

                {/* Search icon / spinner */}
                <div className="absolute right-4">
                    {searching || isLoading ? (
                        <svg className="w-6 h-6 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {showDropdown && (query.length === 0 ? cachedTickers : results).length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden"
                >
                    {query.length === 0 && cachedTickers.length > 0 && (
                        <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-700/30">Popular Tickers</div>
                    )}
                    {(query.length === 0 ? cachedTickers : results).map((result, index) => (
                        <button
                            key={result.symbol}
                            onClick={() => handleSelect(result.symbol)}
                            className={`w-full px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer ${index === selectedIndex
                                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20'
                                : 'hover:bg-slate-800/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-cyan-400 font-bold text-lg">{result.symbol}</span>
                                <span className="text-slate-400 text-sm truncate max-w-[200px]">{result.name}</span>
                            </div>
                            <span className="text-xs text-slate-500 uppercase">{result.exchange}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
