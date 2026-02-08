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

    const chartData = historical.map((d, i) => ({
        date: d.date,
        close: d.close,
        sma20: indicators.sma20[i],
        sma50: indicators.sma50[i],
        sma200: indicators.sma200[i],
        ema12: indicators.ema12[i],
        ema26: indicators.ema26[i],
        bbUpper: indicators.bollingerBands.upper[i],
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
        { id: 'sma20' as const, label: 'SMA20', color: '#3b82f6' },
        { id: 'sma50' as const, label: 'SMA50', color: '#f59e0b' },
        { id: 'sma200' as const, label: 'SMA200', color: '#10b981' },
        { id: 'ema12' as const, label: 'EMA12', color: '#ec4899' },
        { id: 'ema26' as const, label: 'EMA26', color: '#8b5cf6' },
        { id: 'bollinger' as const, label: 'BB', color: '#6b7280' },
    ];

    const latestPrice = historical[historical.length - 1]?.close || 0;

    return (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-medium" style={{ color: 'var(--text-primary)' }}>Price</h2>

                <div className="flex gap-1">
                    {periods.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => onPeriodChange(p.value as '1mo' | '3mo' | '6mo' | '1y' | '2y')}
                            className="px-2 py-1 text-xs rounded cursor-pointer"
                            style={{
                                background: currentPeriod === p.value ? 'var(--bg-tertiary)' : 'transparent',
                                color: currentPeriod === p.value ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {overlays.map((overlay) => (
                    <button
                        key={overlay.id}
                        onClick={() => toggleOverlay(overlay.id)}
                        className="px-2 py-1 text-xs rounded cursor-pointer"
                        style={{
                            backgroundColor: activeOverlays.has(overlay.id) ? `${overlay.color}40` : 'transparent',
                            borderColor: activeOverlays.has(overlay.id) ? overlay.color : 'var(--border-color)',
                            borderWidth: 1,
                            color: activeOverlays.has(overlay.id) ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                    >
                        {overlay.label}
                    </button>
                ))}
            </div>

            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />

                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            tickFormatter={(date) => {
                                const d = new Date(date);
                                return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                            interval="preserveStartEnd"
                        />

                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                            }}
                            labelStyle={{ color: 'var(--text-muted)' }}
                            formatter={((value: number | undefined, name: string | undefined) => [
                                `$${(value ?? 0).toFixed(2)}`,
                                name === 'close' ? 'Price' : (name ?? '').toUpperCase(),
                            ]) as never}
                        />

                        {activeOverlays.has('bollinger') && (
                            <>
                                <Line type="monotone" dataKey="bbUpper" stroke="#6b7280" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="bbLower" stroke="#6b7280" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                            </>
                        )}

                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="#3b82f620"
                        />

                        {activeOverlays.has('sma20') && (
                            <Line type="monotone" dataKey="sma20" stroke="#3b82f6" strokeWidth={1} dot={false} />
                        )}
                        {activeOverlays.has('sma50') && (
                            <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1} dot={false} />
                        )}
                        {activeOverlays.has('sma200') && (
                            <Line type="monotone" dataKey="sma200" stroke="#10b981" strokeWidth={1} dot={false} />
                        )}
                        {activeOverlays.has('ema12') && (
                            <Line type="monotone" dataKey="ema12" stroke="#ec4899" strokeWidth={1} dot={false} />
                        )}
                        {activeOverlays.has('ema26') && (
                            <Line type="monotone" dataKey="ema26" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                        )}

                        <ReferenceLine y={latestPrice} stroke="#9ca3af" strokeDasharray="5 5" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
