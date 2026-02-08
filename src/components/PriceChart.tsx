'use client';

import { useState } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { HistoricalDataPoint, TechnicalIndicators } from '@/types/stock';

interface PriceChartProps {
    historical: HistoricalDataPoint[];
    indicators: TechnicalIndicators;
    onPeriodChange: (period: '1mo' | '3mo' | '6mo' | '1y' | '2y') => void;
    currentPeriod: string;
}

type OverlayType = 'sma20' | 'sma50' | 'sma200' | 'ema12' | 'ema26' | 'bollinger';

export default function PriceChart({
    historical,
    indicators,
    onPeriodChange,
    currentPeriod
}: PriceChartProps) {
    const [activeOverlays, setActiveOverlays] = useState<Set<OverlayType>>(
        new Set(['sma20', 'sma50'])
    );

    const toggleOverlay = (overlay: OverlayType) => {
        const newOverlays = new Set(activeOverlays);
        if (newOverlays.has(overlay)) {
            newOverlays.delete(overlay);
        } else {
            newOverlays.add(overlay);
        }
        setActiveOverlays(newOverlays);
    };

    // Prepare chart data
    const chartData = historical.map((d, i) => ({
        date: d.date,
        close: d.close,
        high: d.high,
        low: d.low,
        sma20: indicators.sma20[i],
        sma50: indicators.sma50[i],
        sma200: indicators.sma200[i],
        ema12: indicators.ema12[i],
        ema26: indicators.ema26[i],
        bbUpper: indicators.bollingerBands.upper[i],
        bbMiddle: indicators.bollingerBands.middle[i],
        bbLower: indicators.bollingerBands.lower[i],
    }));

    const periods = [
        { value: '1mo', label: '1M' },
        { value: '3mo', label: '3M' },
        { value: '6mo', label: '6M' },
        { value: '1y', label: '1Y' },
        { value: '2y', label: '2Y' },
    ];

    const overlays = [
        { id: 'sma20' as const, label: 'SMA 20', color: '#06b6d4' },
        { id: 'sma50' as const, label: 'SMA 50', color: '#f59e0b' },
        { id: 'sma200' as const, label: 'SMA 200', color: '#10b981' },
        { id: 'ema12' as const, label: 'EMA 12', color: '#ec4899' },
        { id: 'ema26' as const, label: 'EMA 26', color: '#14b8a6' },
        { id: 'bollinger' as const, label: 'BB', color: '#0ea5e9' },
    ];

    const latestPrice = historical[historical.length - 1]?.close || 0;

    return (
        <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-teal-500/5 to-emerald-500/5" />

            <div className="relative p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/30 rounded-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-white">Price Chart</h2>

                    {/* Period selector */}
                    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => onPeriodChange(p.value as '1mo' | '3mo' | '6mo' | '1y' | '2y')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${currentPeriod === p.value
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overlay toggles */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {overlays.map((overlay) => (
                        <button
                            key={overlay.id}
                            onClick={() => toggleOverlay(overlay.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 border cursor-pointer ${activeOverlays.has(overlay.id)
                                ? 'border-transparent'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                            style={{
                                backgroundColor: activeOverlays.has(overlay.id)
                                    ? `${overlay.color}30`
                                    : 'transparent',
                                color: activeOverlays.has(overlay.id) ? overlay.color : undefined,
                            }}
                        >
                            {overlay.label}
                        </button>
                    ))}
                </div>

                {/* Chart */}
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                tickFormatter={(date) => {
                                    const d = new Date(date);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                domain={['auto', 'auto']}
                                tickFormatter={(value) => `$${value.toFixed(0)}`}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={((value: number | undefined, name: string | undefined) => [
                                    `$${(value ?? 0).toFixed(2)}`,
                                    name === 'close' ? 'Price' : (name ?? '').toUpperCase(),
                                ]) as never}
                            />

                            {/* Bollinger Bands */}
                            {activeOverlays.has('bollinger') && (
                                <>
                                    <Area
                                        type="monotone"
                                        dataKey="bbUpper"
                                        stroke="#0ea5e9"
                                        strokeWidth={1}
                                        fill="url(#bbGradient)"
                                        strokeDasharray="3 3"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="bbLower"
                                        stroke="#0ea5e9"
                                        strokeWidth={1}
                                        dot={false}
                                        strokeDasharray="3 3"
                                    />
                                </>
                            )}

                            {/* Price line with gradient fill */}
                            <Area
                                type="monotone"
                                dataKey="close"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                fill="url(#priceGradient)"
                            />

                            {/* Moving averages */}
                            {activeOverlays.has('sma20') && (
                                <Line type="monotone" dataKey="sma20" stroke="#06b6d4" strokeWidth={1.5} dot={false} opacity={0.8} />
                            )}
                            {activeOverlays.has('sma50') && (
                                <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} opacity={0.8} />
                            )}
                            {activeOverlays.has('sma200') && (
                                <Line type="monotone" dataKey="sma200" stroke="#10b981" strokeWidth={1.5} dot={false} opacity={0.8} />
                            )}
                            {activeOverlays.has('ema12') && (
                                <Line type="monotone" dataKey="ema12" stroke="#ec4899" strokeWidth={1.5} dot={false} opacity={0.8} />
                            )}
                            {activeOverlays.has('ema26') && (
                                <Line type="monotone" dataKey="ema26" stroke="#14b8a6" strokeWidth={1.5} dot={false} opacity={0.8} />
                            )}

                            <ReferenceLine y={latestPrice} stroke="#94a3b8" strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
