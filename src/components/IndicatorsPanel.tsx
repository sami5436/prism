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
    // RSI data
    const rsiData = historical.slice(-60).map((d, i) => ({
        date: d.date,
        rsi: indicators.rsi[historical.length - 60 + i],
    }));

    // MACD data
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
        if (isNaN(rsi)) return { text: 'N/A', color: 'text-slate-400' };
        if (rsi > 70) return { text: 'Overbought', color: 'text-rose-400' };
        if (rsi < 30) return { text: 'Oversold', color: 'text-emerald-400' };
        if (rsi > 60) return { text: 'Bullish', color: 'text-emerald-400' };
        if (rsi < 40) return { text: 'Bearish', color: 'text-rose-400' };
        return { text: 'Neutral', color: 'text-slate-400' };
    };

    const getMacdStatus = () => {
        if (isNaN(latestMacd) || isNaN(latestSignal)) return { text: 'N/A', color: 'text-slate-400' };
        if (latestMacd > latestSignal) return { text: 'Bullish', color: 'text-emerald-400' };
        return { text: 'Bearish', color: 'text-rose-400' };
    };

    const rsiStatus = getRsiStatus(latestRsi);
    const macdStatus = getMacdStatus();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RSI Card */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-teal-500/5" />

                <div className="relative p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/30 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">RSI (14)</h3>
                            <p className="text-slate-400 text-sm">Relative Strength Index</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-white">
                                {isNaN(latestRsi) ? 'N/A' : latestRsi.toFixed(1)}
                            </p>
                            <p className={`text-sm font-medium ${rsiStatus.color}`}>{rsiStatus.text}</p>
                        </div>
                    </div>

                    {/* RSI Gauge */}
                    <div className="mb-4">
                        <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div className="absolute inset-0 flex">
                                <div className="h-full w-[30%] bg-gradient-to-r from-emerald-500/30 to-emerald-500/20" />
                                <div className="h-full w-[40%] bg-slate-600/30" />
                                <div className="h-full w-[30%] bg-gradient-to-r from-rose-500/20 to-rose-500/30" />
                            </div>
                            {!isNaN(latestRsi) && (
                                <div
                                    className="absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/50 transition-all duration-500"
                                    style={{ left: `${latestRsi}%` }}
                                />
                            )}
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                            <span>0</span>
                            <span>30</span>
                            <span>50</span>
                            <span>70</span>
                            <span>100</span>
                        </div>
                    </div>

                    {/* RSI Chart */}
                    <div className="h-[150px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={rsiData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 9 }}
                                    tickFormatter={(date) => new Date(date).getDate().toString()}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 9 }}
                                />
                                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                                <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* MACD Card */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />

                <div className="relative p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/30 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">MACD</h3>
                            <p className="text-slate-400 text-sm">Moving Average Convergence Divergence</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                                {isNaN(latestMacd) ? 'N/A' : latestMacd.toFixed(2)}
                            </p>
                            <p className={`text-sm font-medium ${macdStatus.color}`}>{macdStatus.text}</p>
                        </div>
                    </div>

                    {/* MACD Legend */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-cyan-500" />
                            <span className="text-xs text-slate-400">MACD</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-amber-500" />
                            <span className="text-xs text-slate-400">Signal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-teal-500/50 rounded-sm" />
                            <span className="text-xs text-slate-400">Histogram</span>
                        </div>
                    </div>

                    {/* MACD Chart */}
                    <div className="h-[170px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={macdData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 9 }}
                                    tickFormatter={(date) => new Date(date).getDate().toString()}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 9 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                    }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                                <Bar
                                    dataKey="histogram"
                                    fill="#14b8a6"
                                    opacity={0.5}
                                />
                                <Line type="monotone" dataKey="macd" stroke="#06b6d4" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
