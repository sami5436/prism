'use client';

import { StockQuote } from '@/types/stock';

interface StockHeaderProps {
    quote: StockQuote;
}

export default function StockHeader({ quote }: StockHeaderProps) {
    const isPositive = quote.change >= 0;

    const formatNumber = (num: number) => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return num.toLocaleString();
    };

    const formatVolume = (vol: number) => {
        if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
        if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
        if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
        return vol.toLocaleString();
    };

    return (
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{quote.symbol}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{quote.exchange}</span>
                    </div>
                    <h1 className="text-lg" style={{ color: 'var(--text-secondary)' }}>{quote.name}</h1>
                </div>

                <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        ${quote.price.toFixed(2)}
                    </span>
                    <span className={`text-lg font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Open</span>
                        <p style={{ color: 'var(--text-primary)' }}>${quote.open.toFixed(2)}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>High</span>
                        <p className="text-green-500">${quote.high.toFixed(2)}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Low</span>
                        <p className="text-red-500">${quote.low.toFixed(2)}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Prev Close</span>
                        <p style={{ color: 'var(--text-primary)' }}>${quote.previousClose.toFixed(2)}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Volume</span>
                        <p style={{ color: 'var(--text-primary)' }}>{formatVolume(quote.volume)}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Mkt Cap</span>
                        <p style={{ color: 'var(--text-primary)' }}>{formatNumber(quote.marketCap)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
