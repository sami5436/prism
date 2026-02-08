'use client';

import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { HistoricalDataPoint, TechnicalIndicators } from '@/types/stock';

interface IndicatorsPanelProps {
    historical: HistoricalDataPoint[];
    indicators: TechnicalIndicators;
}

export default function IndicatorsPanel({ historical, indicators }: IndicatorsPanelProps) {
    const rsiData = historical.slice(-60).map((d, i) => ({
        date: d.date,
        rsi: indicators.rsi[historical.length - 60 + i],
    }));

    const macdData = historical.slice(-60).map((d, i) => {
        const idx = historical.length - 60 + i;
        return {
            date: d.date,
            macd: indicators.macd.macd[idx],
            signal: indicators.macd.signal[idx],
            histogram: indicators.macd.histogram[idx],
        };
    });

    const latestRsi = indicators.rsi[indicators.rsi.length - 1];
    const latestMacd = indicators.macd.macd[indicators.macd.macd.length - 1];
    const latestSignal = indicators.macd.signal[indicators.macd.signal.length - 1];

    const getRsiStatus = (rsi: number) => {
        if (isNaN(rsi)) return { text: 'N/A', color: 'text-gray-400' };
        if (rsi > 70) return { text: 'Overbought', color: 'text-red-500' };
        if (rsi < 30) return { text: 'Oversold', color: 'text-green-500' };
        return { text: 'Neutral', color: 'text-gray-400' };
    };

    const getMacdStatus = () => {
        if (isNaN(latestMacd) || isNaN(latestSignal)) return { text: 'N/A', color: 'text-gray-400' };
        if (latestMacd > latestSignal) return { text: 'Bullish', color: 'text-green-500' };
        return { text: 'Bearish', color: 'text-red-500' };
    };

    const rsiStatus = getRsiStatus(latestRsi);
    const macdStatus = getMacdStatus();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* RSI */}
            <div className="border border-gray-800 rounded bg-gray-900 p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-white font-medium">RSI (14)</h3>
                        <p className="text-gray-500 text-xs">Relative Strength Index</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-white">
                            {isNaN(latestRsi) ? 'N/A' : latestRsi.toFixed(1)}
                        </p>
                        <p className={`text-xs ${rsiStatus.color}`}>{rsiStatus.text}</p>
                    </div>
                </div>

                {/* RSI Gauge */}
                <div className="mb-3">
                    <div className="relative h-2 bg-gray-700 rounded">
                        {!isNaN(latestRsi) && (
                            <div
                                className="absolute top-0 h-full w-1 bg-white rounded"
                                style={{ left: `${latestRsi}%` }}
                            />
                        )}
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-600">
                        <span>0</span>
                        <span>30</span>
                        <span>70</span>
                        <span>100</span>
                    </div>
                </div>

                <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={rsiData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280', fontSize: 9 }}
                                tickFormatter={(date) => new Date(date).getDate().toString()}
                                interval="preserveStartEnd"
                            />
                            <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
                            <Line type="monotone" dataKey="rsi" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* MACD */}
            <div className="border border-gray-800 rounded bg-gray-900 p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-white font-medium">MACD</h3>
                        <p className="text-gray-500 text-xs">Moving Average Convergence Divergence</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-white">
                            {isNaN(latestMacd) ? 'N/A' : latestMacd.toFixed(2)}
                        </p>
                        <p className={`text-xs ${macdStatus.color}`}>{macdStatus.text}</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-3 text-xs text-gray-500">
                    <span>— MACD</span>
                    <span>— Signal</span>
                    <span>▪ Histogram</span>
                </div>

                <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={macdData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280', fontSize: 9 }}
                                tickFormatter={(date) => new Date(date).getDate().toString()}
                                interval="preserveStartEnd"
                            />
                            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 9 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '4px',
                                }}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                            <Bar dataKey="histogram" fill="#6b7280" opacity={0.4} />
                            <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                            <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
