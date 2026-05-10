'use client';

import type { AssetResult } from './types';
import { CRISIS_WINDOWS, maxDrawdownInWindow } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
}

function fmtPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function shadeFor(dd: number | null): string {
  if (dd === null) return 'transparent';
  // Heat map from 0 (light) to -60% (dark red).
  const intensity = Math.min(1, Math.abs(dd) / 0.6);
  return `rgba(248, 113, 113, ${intensity * 0.22})`;
}

export default function DrawdownsTable({ assets, benchmarkSymbol, benchmarkLabel }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

  const cols = [
    ...userPicks.map((a, i) => ({ asset: a, color: colorFor(i), isBench: false, label: a.symbol })),
    ...(benchmark ? [{ asset: benchmark, color: BENCHMARK_COLOR, isBench: true, label: benchmark.symbol }] : []),
  ];

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>How it held up in crashes</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Peak-to-trough decline within each window. Lower is worse.</p>
        </div>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2 pr-4 font-normal">Crisis</th>
              {cols.map(c => (
                <th key={c.asset.symbol} className="text-right py-2 px-3 font-normal whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRISIS_WINDOWS.map(w => (
              <tr key={w.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="py-3 pr-4">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{w.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.blurb}</div>
                </td>
                {cols.map(c => {
                  const r = maxDrawdownInWindow(c.asset.historical ?? [], w.start, w.end);
                  const dd = r?.drawdown ?? null;
                  return (
                    <td
                      key={c.asset.symbol}
                      className="text-right py-3 px-3 tabular-nums whitespace-nowrap"
                      style={{ background: shadeFor(dd), color: dd === null ? 'var(--text-muted)' : 'var(--text-primary)' }}
                    >
                      {fmtPct(dd)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {benchmark && (
        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          {benchmark.symbol} ({benchmarkLabel}) shown for reference. Empty cells mean the fund didn&apos;t exist during that window.
        </p>
      )}
    </div>
  );
}
