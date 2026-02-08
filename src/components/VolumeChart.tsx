'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { HistoricalDataPoint, TechnicalIndicators } from '@/types/stock';

interface VolumeChartProps {
    historical: HistoricalDataPoint[];
    indicators: TechnicalIndicators;
}

export default function VolumeChart({ historical, indicators }: VolumeChartProps) {
    // Prepare chart data with color based on price change
    const chartData = historical.map((d, i) => {
        const prevClose = i > 0 ? historical[i - 1].close : d.open;
        const isUp = d.close >= prevClose;
        return {
            date: d.date,
            volume: d.volume,
            volumeSma: indicators.volumeSma[i],
            color: isUp ? '#10b981' : '#ef4444',
        };
    });

    const latestVolume = historical[historical.length - 1]?.volume || 0;
    const latestAvgVol = indicators.volumeSma[indicators.volumeSma.length - 1] || 0;
    const volumeRatio = latestAvgVol > 0 ? latestVolume / latestAvgVol : 1;

    const formatVolume = (vol: number) => {
        if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
        if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
        if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
        return vol.toString();
    };

    return (
        <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent" />

            <div className="relative p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/30 rounded-2xl">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Volume Analysis</h2>
                        <p className="text-slate-400 text-sm">20-day average comparison</p>
                    </div>

                    {/* Volume stats */}
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{formatVolume(latestVolume)}</p>
                        <p className={`text-sm font-medium ${volumeRatio > 1.2 ? 'text-emerald-400' :
                            volumeRatio < 0.8 ? 'text-rose-400' :
                                'text-slate-400'
                            }`}>
                            {volumeRatio > 1 ? '+' : ''}{((volumeRatio - 1) * 100).toFixed(0)}% vs avg
                        </p>
                    </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />

                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                tickFormatter={(date) => {
                                    const d = new Date(date);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                tickFormatter={formatVolume}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={((value: number | undefined, name: string | undefined) => [
                                    formatVolume(value ?? 0),
                                    name === 'volume' ? 'Volume' : 'Avg Volume',
                                ]) as never}
                            />

                            <Bar
                                dataKey="volume"
                                fill="#8b5cf6"
                                opacity={0.8}
                                radius={[2, 2, 0, 0]}
                            />

                            {/* Average volume line */}
                            <ReferenceLine y={latestAvgVol} stroke="#f59e0b" strokeDasharray="5 5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-violet-500" />
                        <span className="text-xs text-slate-400">Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }} />
                        <span className="text-xs text-slate-400">20-Day Avg</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
