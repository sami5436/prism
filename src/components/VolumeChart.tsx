'use client';

import { HistoricalDataPoint, TechnicalIndicators } from '@/types/stock';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

interface VolumeChartProps {
    historical: HistoricalDataPoint[];
    indicators: TechnicalIndicators;
}

export default function VolumeChart({ historical, indicators }: VolumeChartProps) {
    const recentData = historical.slice(-30);

    const chartData = recentData.map((point) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: point.volume,
        isUp: point.close >= point.open,
    }));

    const formatVolume = (vol: number) => {
        if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
        if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
        if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
        return vol.toString();
    };

    // Get the last value of volumeSma for the average
    const volumeSmaArray = indicators.volumeSma;
    const avgVolume = volumeSmaArray[volumeSmaArray.length - 1] || 0;
    const currentVolume = historical[historical.length - 1]?.volume || 0;
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

    return (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Volume</h3>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {volumeRatio >= 1.5 ? 'High' : volumeRatio <= 0.5 ? 'Low' : 'Normal'}
                </span>
            </div>

            <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#666', fontSize: 10 }}
                            axisLine={{ stroke: '#333' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fill: '#666', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatVolume}
                            width={45}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                            }}
                            formatter={(value: number | undefined) => [formatVolume(value ?? 0), 'Volume']}
                        />
                        <ReferenceLine y={avgVolume} stroke="#666" strokeDasharray="3 3" />
                        <Bar
                            dataKey="volume"
                            fill="#666"
                            radius={[2, 2, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>20-day avg: {formatVolume(avgVolume)}</span>
                <span>Current: {formatVolume(currentVolume)} ({volumeRatio.toFixed(1)}x)</span>
            </div>
        </div>
    );
}
