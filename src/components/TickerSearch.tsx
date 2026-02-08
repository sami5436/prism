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
        const items = query.length === 0 ? cachedTickers : results;
        if (!showDropdown || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(items[selectedIndex].symbol);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const displayItems = query.length === 0 ? cachedTickers : results;

    return (
        <div className="relative w-full">
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
                placeholder="Search ticker or company..."
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg transition-colors"
                style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                }}
            />

            {showDropdown && displayItems.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-2 rounded-lg overflow-hidden"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                    {query.length === 0 && (
                        <div className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>Popular</div>
                    )}
                    {displayItems.map((result, index) => (
                        <button
                            key={result.symbol}
                            onClick={() => handleSelect(result.symbol)}
                            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
                            style={{
                                background: index === selectedIndex ? 'var(--bg-tertiary)' : 'transparent',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = index === selectedIndex ? 'var(--bg-tertiary)' : 'transparent'}
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.symbol}</span>
                                <span className="text-sm truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{result.name}</span>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.exchange}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
