'use client';

import { useMemo, useState } from 'react';
import { type AssetResult, pointsFor } from './types';
import { CRISIS_WINDOWS, maxDrawdownInWindow } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';
import SortHeader, { compareValues, type SortDir } from './SortHeader';

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
  // sortKey: null = chronological CRISIS_WINDOWS order; 'crisis' = alpha by name; otherwise = asset symbol.
  const [sortKey, setSortKey] = useState<'crisis' | string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

  const cols = useMemo(() => [
    ...userPicks.map((a, i) => ({ asset: a, color: colorFor(i), isBench: false, label: a.symbol })),
    ...(benchmark ? [{ asset: benchmark, color: BENCHMARK_COLOR, isBench: true, label: benchmark.symbol }] : []),
  ], [userPicks, benchmark]);

  // Precompute drawdowns per (window, column) so sorting doesn't recalc.
  // Total-return basis (reinvested dividends) keeps drawdowns consistent
  // with the rest of the page.
  const drawdowns = useMemo(() => {
    const out: Record<string, Record<string, number | null>> = {};
    for (const w of CRISIS_WINDOWS) {
      out[w.id] = {};
      for (const c of cols) {
        const series = pointsFor(c.asset, 'total');
        const r = maxDrawdownInWindow(series, w.start, w.end);
        out[w.id][c.asset.symbol] = r?.drawdown ?? null;
      }
    }
    return out;
  }, [cols]);

  const sortedWindows = useMemo(() => {
    if (!sortKey) return CRISIS_WINDOWS;
    const arr = [...CRISIS_WINDOWS];
    if (sortKey === 'crisis') {
      arr.sort((a, b) => compareValues(a.label, b.label, sortDir));
    } else {
      arr.sort((a, b) => compareValues(drawdowns[a.id][sortKey], drawdowns[b.id][sortKey], sortDir));
    }
    return arr;
  }, [sortKey, sortDir, drawdowns]);

  const handleSort = (key: 'crisis' | string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // For asset columns, asc means most-negative first (worst drawdown at top).
      // For the crisis name column, asc is alphabetical.
      setSortDir('asc');
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>How it held up in crashes</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Peak-to-trough decline within each window. Click a column to sort.</p>
        </div>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2 pr-4 font-normal">
                <SortHeader active={sortKey === 'crisis'} direction={sortDir} onClick={() => handleSort('crisis')} align="left">
                  Crisis
                </SortHeader>
              </th>
              {cols.map(c => (
                <th key={c.asset.symbol} className="text-right py-2 px-3 font-normal whitespace-nowrap">
                  <SortHeader active={sortKey === c.asset.symbol} direction={sortDir} onClick={() => handleSort(c.asset.symbol)} align="right">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                    </span>
                  </SortHeader>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedWindows.map(w => (
              <tr key={w.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="py-3 pr-4">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{w.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.blurb}</div>
                </td>
                {cols.map(c => {
                  const dd = drawdowns[w.id][c.asset.symbol];
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
