'use client';

import type { AssetResult } from './types';
import { trailingCAGR } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
}

const PERIODS = [1, 3, 5, 10, 15] as const;

function fmtPct(n: number | null, digits = 1): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export default function ReturnsTable({ assets, benchmarkSymbol, benchmarkLabel }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

  const rows = [
    ...userPicks.map((a, i) => ({ asset: a, color: colorFor(i), isBench: false, label: a.symbol })),
    ...(benchmark ? [{ asset: benchmark, color: BENCHMARK_COLOR, isBench: true, label: `${benchmark.symbol} (${benchmarkLabel})` }] : []),
  ];

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Annualized return (CAGR)</h2>
        <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>CAGR (Compound Annual Growth Rate)</span> is the steady yearly rate that turns the starting price into the ending price over the period. A 10y CAGR of 12% means the fund grew <em>as if</em> it returned 12% every year, even though the real year-to-year ride was bumpier.
        </p>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2 pr-4 font-normal">Asset</th>
              {PERIODS.map(p => (
                <th key={p} className="text-right py-2 px-3 font-normal whitespace-nowrap">{p}y</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.asset.symbol} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: r.color }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.asset.symbol}</span>
                    {r.isBench && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        Benchmark
                      </span>
                    )}
                  </div>
                </td>
                {PERIODS.map(p => {
                  const v = trailingCAGR(r.asset.historical ?? [], p);
                  const positive = v !== null && v > 0;
                  return (
                    <td key={p} className="text-right py-3 px-3 tabular-nums whitespace-nowrap" style={{ color: v === null ? 'var(--text-muted)' : positive ? 'var(--bs-positive)' : 'var(--bs-critical)' }}>
                      {fmtPct(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        Past performance only — does not predict future returns.
      </p>
    </div>
  );
}
