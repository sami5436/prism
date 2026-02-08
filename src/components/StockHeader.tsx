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
        <div className="border border-gray-800 rounded bg-gray-900 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white">{quote.symbol}</span>
                        <span className="text-gray-400">{quote.exchange}</span>
                    </div>
                    <h1 className="text-lg text-gray-300">{quote.name}</h1>
                </div>

                <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-white">
                        ${quote.price.toFixed(2)}
                    </span>
                    <span className={`text-lg font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Open</span>
                        <p className="text-white">${quote.open.toFixed(2)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">High</span>
                        <p className="text-green-500">${quote.high.toFixed(2)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Low</span>
                        <p className="text-red-500">${quote.low.toFixed(2)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Prev Close</span>
                        <p className="text-white">${quote.previousClose.toFixed(2)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Volume</span>
                        <p className="text-white">{formatVolume(quote.volume)}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Mkt Cap</span>
                        <p className="text-white">{formatNumber(quote.marketCap)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
