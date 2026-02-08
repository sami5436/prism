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
    const chartData = historical.map((d, i) => ({
        date: d.date,
        volume: d.volume,
        volumeSma: indicators.volumeSma[i],
    }));

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
        <div className="border border-gray-800 rounded bg-gray-900 p-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-white font-medium">Volume</h3>
                    <p className="text-gray-500 text-xs">20-day average</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatVolume(latestVolume)}</p>
                    <p className={`text-xs ${volumeRatio > 1.2 ? 'text-green-500' : volumeRatio < 0.8 ? 'text-red-500' : 'text-gray-400'}`}>
                        {volumeRatio > 1 ? '+' : ''}{((volumeRatio - 1) * 100).toFixed(0)}% vs avg
                    </p>
                </div>
            </div>

            <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 9 }}
                            tickFormatter={(date) => {
                                const d = new Date(date);
                                return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                            interval="preserveStartEnd"
                        />
                        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 9 }} tickFormatter={formatVolume} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '4px',
                            }}
                            labelStyle={{ color: '#9ca3af' }}
                            formatter={((value: number | undefined) => [formatVolume(value ?? 0), 'Volume']) as never}
                        />
                        <Bar dataKey="volume" fill="#6b7280" opacity={0.6} radius={[2, 2, 0, 0]} />
                        <ReferenceLine y={latestAvgVol} stroke="#f59e0b" strokeDasharray="5 5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                <span>▪ Volume</span>
                <span>--- 20-Day Avg</span>
            </div>
        </div>
    );
}
