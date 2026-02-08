'use client';

import { AnalysisSummary } from '@/types/stock';

interface AISummaryProps {
    analysis: AnalysisSummary;
}

export default function AISummaryCard({ analysis }: AISummaryProps) {
    const getDirectionStyle = () => {
        switch (analysis.direction) {
            case 'bullish':
                return { color: 'text-green-500', label: 'BULLISH' };
            case 'bearish':
                return { color: 'text-red-500', label: 'BEARISH' };
            default:
                return { color: 'text-gray-400', label: 'NEUTRAL' };
        }
    };

    const style = getDirectionStyle();

    return (
        <div className="border border-gray-800 rounded bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Summary</h3>
                <span className={`text-sm font-medium ${style.color}`}>{style.label}</span>
            </div>

            <p className="text-gray-400 text-sm mb-4">{analysis.summary}</p>

            <div className="space-y-2 text-sm">
                {analysis.signals.slice(0, 3).map((signal, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className={signal.signal === 'bullish' ? 'text-green-500' : signal.signal === 'bearish' ? 'text-red-500' : 'text-gray-500'}>
                            •
                        </span>
                        <span className="text-gray-400">{signal.indicator}: {signal.reason}</span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-600 mt-4">
                Analysis is for informational purposes only.
            </p>
        </div>
    );
}
