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
        <div className="relative overflow-hidden rounded-2xl">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isPositive
                    ? 'from-emerald-500/10 via-cyan-500/5 to-transparent'
                    : 'from-rose-500/10 via-fuchsia-500/5 to-transparent'
                }`} />

            <div className="relative p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/30 rounded-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Main info */}
                    <div className="flex items-center gap-6">
                        {/* Symbol badge */}
                        <div className={`relative p-4 rounded-xl ${isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                            }`}>
                            <div className={`absolute inset-0 rounded-xl ${isPositive
                                    ? 'bg-gradient-to-br from-emerald-400/20 to-cyan-400/20'
                                    : 'bg-gradient-to-br from-rose-400/20 to-fuchsia-400/20'
                                } blur-sm`} />
                            <span className={`relative text-3xl font-black tracking-tight ${isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {quote.symbol}
                            </span>
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-white">{quote.name}</h1>
                            <p className="text-slate-400 text-sm">{quote.exchange}</p>
                        </div>
                    </div>

                    {/* Price info */}
                    <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-black text-white tracking-tight">
                            ${quote.price.toFixed(2)}
                        </span>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                            }`}>
                            <span className={`text-xl font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPositive ? '+' : ''}{quote.change.toFixed(2)}
                            </span>
                            <span className={`text-lg font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="mt-6 pt-6 border-t border-slate-700/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <StatItem label="Open" value={`$${quote.open.toFixed(2)}`} />
                        <StatItem label="High" value={`$${quote.high.toFixed(2)}`} highlight="emerald" />
                        <StatItem label="Low" value={`$${quote.low.toFixed(2)}`} highlight="rose" />
                        <StatItem label="Prev Close" value={`$${quote.previousClose.toFixed(2)}`} />
                        <StatItem label="Volume" value={formatVolume(quote.volume)} />
                        <StatItem label="Mkt Cap" value={formatNumber(quote.marketCap)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({
    label,
    value,
    highlight
}: {
    label: string;
    value: string;
    highlight?: 'emerald' | 'rose';
}) {
    return (
        <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-semibold ${highlight === 'emerald' ? 'text-emerald-400' :
                    highlight === 'rose' ? 'text-rose-400' :
                        'text-white'
                }`}>
                {value}
            </p>
        </div>
    );
}
