'use client';

import { AnalysisSummary } from '@/types/stock';

interface AISummaryProps {
    analysis: AnalysisSummary;
}

export default function AISummaryCard({ analysis }: AISummaryProps) {
    const getDirectionConfig = () => {
        switch (analysis.direction) {
            case 'bullish':
                return {
                    iconType: 'bullish',
                    gradient: 'from-emerald-500 to-cyan-500',
                    bgGradient: 'from-emerald-500/10 via-cyan-500/5 to-transparent',
                    textColor: 'text-emerald-400',
                    borderColor: 'border-emerald-500/30',
                    label: 'BULLISH',
                };
            case 'bearish':
                return {
                    iconType: 'bearish',
                    gradient: 'from-rose-500 to-amber-500',
                    bgGradient: 'from-rose-500/10 via-amber-500/5 to-transparent',
                    textColor: 'text-rose-400',
                    borderColor: 'border-rose-500/30',
                    label: 'BEARISH',
                };
            default:
                return {
                    iconType: 'neutral',
                    gradient: 'from-slate-500 to-cyan-500',
                    bgGradient: 'from-slate-500/10 via-cyan-500/5 to-transparent',
                    textColor: 'text-cyan-400',
                    borderColor: 'border-slate-500/30',
                    label: 'NEUTRAL',
                };
        }
    };

    const config = getDirectionConfig();

    const getSignalIndicator = (signal: 'bullish' | 'bearish' | 'neutral') => {
        switch (signal) {
            case 'bullish': return <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />;
            case 'bearish': return <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />;
            default: return <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />;
        }
    };

    const renderDirectionIcon = () => {
        switch (config.iconType) {
            case 'bullish':
                return (
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            case 'bearish':
                return (
                    <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
        }
    };

    return (
        <div className="relative rounded-2xl overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`} />

            <div className={`relative p-6 bg-slate-900/60 backdrop-blur-xl border ${config.borderColor} rounded-2xl`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {renderDirectionIcon()}
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Analysis</h2>
                            <p className="text-slate-400 text-sm">Technical indicator interpretation</p>
                        </div>
                    </div>

                    {/* Direction badge */}
                    <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${config.gradient}`}>
                        <span className="text-lg font-black text-white tracking-wider">{config.label}</span>
                    </div>
                </div>

                {/* Confidence meter */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Confidence</span>
                        <span className={`text-lg font-bold ${config.textColor}`}>{analysis.confidence}%</span>
                    </div>
                    <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-700`}
                            style={{ width: `${analysis.confidence}%` }}
                        />
                    </div>
                </div>

                {/* Summary text */}
                <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Signal breakdown */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Signal Breakdown
                    </h3>
                    <div className="space-y-2">
                        {analysis.signals.map((signal, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-slate-800/20 rounded-lg border border-slate-700/20 hover:border-slate-600/40 transition-colors"
                            >
                                <span className="text-lg">{getSignalIndicator(signal.signal)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white">{signal.indicator}</p>
                                    <p className="text-sm text-slate-400 truncate">{signal.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 pt-4 border-t border-slate-700/30">
                    <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        This analysis is for informational purposes only. Not financial advice.
                    </p>
                </div>
            </div>
        </div>
    );
}
