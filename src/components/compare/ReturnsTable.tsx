'use client';

import { useMemo, useState } from 'react';
import { type AssetResult, pointsFor } from './types';
import { trailingCAGR } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';
import SortHeader, { compareValues, type SortDir } from './SortHeader';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
}

const PERIODS = [1, 3, 5, 10, 15] as const;
type SortKey = 'symbol' | (typeof PERIODS)[number];

function fmtPct(n: number | null, digits = 1): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export default function ReturnsTable({ assets, benchmarkSymbol, benchmarkLabel }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

  const baseRows = useMemo(() => [
    ...userPicks.map((a, i) => ({ asset: a, color: colorFor(i), isBench: false, label: a.symbol })),
    ...(benchmark ? [{ asset: benchmark, color: BENCHMARK_COLOR, isBench: true, label: `${benchmark.symbol} (${benchmarkLabel})` }] : []),
  ], [userPicks, benchmark, benchmarkLabel]);

  // Precompute CAGRs once per render. Uses the total-return series (price +
  // reinvested dividends) so SCHD-style dividend-heavy funds aren't understated.
  const enriched = useMemo(() => baseRows.map(r => {
    const totalSeries = pointsFor(r.asset, 'total');
    return {
      ...r,
      cagrs: PERIODS.reduce<Record<number, number | null>>((acc, p) => {
        acc[p] = trailingCAGR(totalSeries, p);
        return acc;
      }, {}),
    };
  }), [baseRows]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return enriched;
    const arr = [...enriched];
    arr.sort((a, b) => {
      if (sortKey === 'symbol') return compareValues(a.asset.symbol, b.asset.symbol, sortDir);
      return compareValues(a.cagrs[sortKey], b.cagrs[sortKey], sortDir);
    });
    return arr;
  }, [enriched, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Numeric columns default to desc (highest first); alpha defaults to asc.
      setSortDir(key === 'symbol' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Total return (CAGR)</h2>
        <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>CAGR</span> is the steady yearly rate that turns your starting value into your ending value. These numbers include <span style={{ color: 'var(--text-secondary)' }}>reinvested dividends</span>, so dividend-heavy funds (e.g. SCHD) aren&apos;t understated. The Income breakdown panel below splits each fund&apos;s CAGR into price vs. dividends.
        </p>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2 pr-4 font-normal">
                <SortHeader
                  active={sortKey === 'symbol'}
                  direction={sortDir}
                  onClick={() => handleSort('symbol')}
                  align="left"
                >
                  Asset
                </SortHeader>
              </th>
              {PERIODS.map(p => (
                <th key={p} className="text-right py-2 px-3 font-normal whitespace-nowrap">
                  <SortHeader
                    active={sortKey === p}
                    direction={sortDir}
                    onClick={() => handleSort(p)}
                    align="right"
                  >
                    {p}y
                  </SortHeader>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(r => (
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
                  const v = r.cagrs[p];
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
