'use client';

import { useMemo, useState } from 'react';
import { type AssetResult, pointsFor } from './types';
import { monteCarloCone } from '@/lib/compareMath';
import { colorFor } from './colors';
import SortHeader, { compareValues, type SortDir } from './SortHeader';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  initialValue?: number;
}

const HORIZONS = [5, 10, 15] as const;
type SortKey = 'years' | 'p10' | 'median' | 'p90';

function fmt(n: number | undefined | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

export default function MonteCarloPanel({ assets, benchmarkSymbol, initialValue = 10_000 }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol && (a.historical?.length ?? 0) > 30);

  const [activeSymbol, setActiveSymbol] = useState<string | null>(userPicks[0]?.symbol ?? null);

  const projections = useMemo(() => {
    return userPicks.map((a, i) => {
      // Sample from total returns so dividend-paying funds project correctly.
      const total = pointsFor(a, 'total');
      const byHorizon = HORIZONS.map(years => ({
        years,
        cone: monteCarloCone(total, initialValue, years, { paths: 1500, lookbackYears: 10, samplesOut: 4 }),
      }));
      return { asset: a, color: colorFor(i), byHorizon };
    });
  }, [userPicks, initialValue]);

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'years' ? 'asc' : 'desc');
    }
  };

  if (projections.length === 0) return null;

  const active = projections.find(p => p.asset.symbol === activeSymbol) ?? projections[0];

  const sortedHorizons = (() => {
    if (!sortKey) return active.byHorizon;
    const arr = [...active.byHorizon];
    arr.sort((a, b) => {
      if (sortKey === 'years') return compareValues(a.years, b.years, sortDir);
      const av = sortKey === 'p10' ? a.cone?.finalP10 : sortKey === 'median' ? a.cone?.finalMedian : a.cone?.finalP90;
      const bv = sortKey === 'p10' ? b.cone?.finalP10 : sortKey === 'median' ? b.cone?.finalMedian : b.cone?.finalP90;
      return compareValues(av ?? null, bv ?? null, sortDir);
    });
    return arr;
  })();

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Projection cone — ${initialValue.toLocaleString()} today
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            We run <span style={{ color: 'var(--text-secondary)' }}>1,500 simulated futures</span>, each one randomly resampling weeks from this fund&apos;s last 10 years. The table shows where $10K could land — <span style={{ color: 'var(--bs-critical)' }}>pessimistic</span> (only 10% of futures did worse), <span style={{ color: 'var(--text-secondary)' }}>median</span> (the middle outcome), and <span style={{ color: 'var(--bs-positive)' }}>optimistic</span> (only 10% did better). It&apos;s the <em>spread of plausible outcomes</em> if the future resembles the past — not a forecast.
          </p>
        </div>
        {projections.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {projections.map(p => (
              <button
                key={p.asset.symbol}
                onClick={() => setActiveSymbol(p.asset.symbol)}
                className="px-2.5 py-1 text-xs rounded transition-colors cursor-pointer"
                style={{
                  background: p.asset.symbol === active.asset.symbol ? `${p.color}22` : 'var(--bg-tertiary)',
                  border: p.asset.symbol === active.asset.symbol ? `1px solid ${p.color}55` : '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {p.asset.symbol}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <th className="text-left py-2 pr-4 font-normal">
                <SortHeader active={sortKey === 'years'} direction={sortDir} onClick={() => handleSort('years')} align="left">Horizon</SortHeader>
              </th>
              <th className="text-right py-2 px-3 font-normal whitespace-nowrap">
                <SortHeader active={sortKey === 'p10'} direction={sortDir} onClick={() => handleSort('p10')} align="right">Pessimistic (p10)</SortHeader>
              </th>
              <th className="text-right py-2 px-3 font-normal whitespace-nowrap">
                <SortHeader active={sortKey === 'median'} direction={sortDir} onClick={() => handleSort('median')} align="right">Median</SortHeader>
              </th>
              <th className="text-right py-2 px-3 font-normal whitespace-nowrap">
                <SortHeader active={sortKey === 'p90'} direction={sortDir} onClick={() => handleSort('p90')} align="right">Optimistic (p90)</SortHeader>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHorizons.map(h => {
              const c = h.cone;
              return (
                <tr key={h.years} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="py-3 pr-4">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{h.years} years</span>
                  </td>
                  <td className="text-right py-3 px-3 tabular-nums" style={{ color: 'var(--bs-critical)' }}>{fmt(c?.finalP10)}</td>
                  <td className="text-right py-3 px-3 tabular-nums font-semibold" style={{ color: active.color }}>{fmt(c?.finalMedian)}</td>
                  <td className="text-right py-3 px-3 tabular-nums" style={{ color: 'var(--bs-positive)' }}>{fmt(c?.finalP90)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        Doesn&apos;t account for fees, regime changes, or sequence-of-returns risk.
      </p>
    </div>
  );
}
