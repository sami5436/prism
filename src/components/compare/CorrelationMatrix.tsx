'use client';

import { useMemo } from 'react';
import { type AssetResult, pointsFor } from './types';
import { correlationMatrix } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
  lookbackYears?: number;
}

/**
 * Background shade for a correlation cell. Diverging red/green scale:
 *   +1  → strong red    (highly correlated, "same bet")
 *    0  → neutral
 *   -1  → strong green  (good diversification)
 */
function corrColor(c: number | null): string {
  if (c === null || !Number.isFinite(c)) return 'transparent';
  const intensity = Math.min(1, Math.abs(c)) * 0.45;
  if (c >= 0) return `rgba(248, 113, 113, ${intensity})`; // red
  return `rgba(52, 211, 153, ${intensity})`;              // green
}

function fmt(c: number | null): string {
  if (c === null || !Number.isFinite(c)) return '—';
  return c.toFixed(2);
}

export default function CorrelationMatrix({
  assets,
  benchmarkSymbol,
  benchmarkLabel,
  lookbackYears = 5,
}: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol && (a.historical?.length ?? 0) > 30);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

  const series = useMemo(() => {
    const out = userPicks.map((a, i) => ({
      id: a.symbol,
      label: a.symbol,
      color: colorFor(i),
      points: pointsFor(a, 'total'),
      isBench: false,
    }));
    if (benchmark && (benchmark.historical?.length ?? 0) > 30) {
      out.push({
        id: benchmark.symbol,
        label: benchmark.symbol,
        color: BENCHMARK_COLOR,
        points: pointsFor(benchmark, 'total'),
        isBench: true,
      });
    }
    return out;
  }, [userPicks, benchmark]);

  const { matrix, ids, observationCount, windowStart, windowEnd } = useMemo(
    () => correlationMatrix(
      series.map(s => ({ id: s.id, points: s.points })),
      lookbackYears,
    ),
    [series, lookbackYears],
  );

  // Need at least two series for a matrix to mean anything.
  if (series.length < 2) return null;

  const yearsCovered = windowStart && windowEnd
    ? ((new Date(windowEnd).getTime() - new Date(windowStart).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)
    : null;

  const idMeta = new Map(series.map(s => [s.id, s]));
  const userIdSet = new Set(userPicks.map(a => a.symbol));
  const benchIdx = benchmark ? ids.indexOf(benchmark.symbol) : -1;

  // Off-diagonal pairs of user picks only (exclude benchmark↔pick — those go in
  // the dedicated "vs benchmark" list below).
  const userPairs: { a: string; b: string; c: number }[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (!userIdSet.has(ids[i]) || !userIdSet.has(ids[j])) continue;
      const c = matrix[i]?.[j];
      if (typeof c === 'number' && Number.isFinite(c)) {
        userPairs.push({ a: ids[i], b: ids[j], c });
      }
    }
  }

  const sortedPairs = [...userPairs].sort((a, b) => b.c - a.c);
  const highest = sortedPairs[0] ?? null;
  const lowest = sortedPairs[sortedPairs.length - 1] ?? null;
  const avgPair = userPairs.length > 0
    ? userPairs.reduce((s, p) => s + p.c, 0) / userPairs.length
    : null;
  const redundantCount = userPairs.filter(p => p.c >= 0.85).length;
  const independentCount = userPairs.filter(p => p.c < 0.4).length;

  // vs-benchmark per user pick.
  const vsBench: { id: string; c: number | null }[] = [];
  if (benchIdx >= 0) {
    for (const id of userPicks.map(a => a.symbol)) {
      const i = ids.indexOf(id);
      if (i < 0) {
        vsBench.push({ id, c: null });
      } else {
        const c = matrix[i]?.[benchIdx];
        vsBench.push({ id, c: typeof c === 'number' ? c : null });
      }
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-5 max-w-2xl">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Correlation matrix</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          How closely each pair of funds <em>moves together</em> on a week-by-week basis. <span style={{ color: 'var(--bs-critical)' }}>Red</span> = highly correlated (essentially the same bet), <span style={{ color: 'var(--bs-positive)' }}>green</span> = independent or opposing. Anything <span style={{ color: 'var(--text-secondary)' }}>above ~0.85</span> means you&apos;re mostly doubling up. Computed from total-return weekly logs over the common history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
        {/* Matrix */}
        <div>
          <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
            <table className="text-sm" style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 font-normal text-xs" style={{ color: 'var(--text-muted)' }}></th>
                  {ids.map(id => {
                    const m = idMeta.get(id);
                    return (
                      <th key={id} className="px-2 py-2 text-xs font-medium whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: m?.color ?? 'transparent' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{m?.label ?? id}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ids.map((rowId, i) => {
                  const m = idMeta.get(rowId);
                  return (
                    <tr key={rowId}>
                      <td className="pr-3 py-1 whitespace-nowrap text-xs">
                        <div className="inline-flex items-center gap-1.5">
                          <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: m?.color ?? 'transparent' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{m?.label ?? rowId}</span>
                        </div>
                      </td>
                      {ids.map((colId, j) => {
                        const c = matrix[i]?.[j] ?? null;
                        const isDiag = i === j;
                        return (
                          <td
                            key={`${rowId}-${colId}`}
                            className="text-center px-2 py-2 tabular-nums rounded-md"
                            style={{
                              background: isDiag ? 'var(--bg-tertiary)' : corrColor(c),
                              color: isDiag ? 'var(--text-muted)' : 'var(--text-primary)',
                              minWidth: '60px',
                              fontWeight: c !== null && c >= 0.85 && !isDiag ? 600 : 400,
                            }}
                            title={isDiag ? '' : `${rowId} vs ${colId}`}
                          >
                            {fmt(c)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded" style={{ background: corrColor(0.95) }} />
              <span>Same bet (≥0.85)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded" style={{ background: corrColor(0.55) }} />
              <span>Related (0.4–0.85)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded" style={{ background: corrColor(0.15) }} />
              <span>Mostly independent (&lt; 0.4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded" style={{ background: corrColor(-0.5) }} />
              <span>Inverse</span>
            </div>
          </div>

          {(yearsCovered || observationCount > 0) && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {observationCount} weekly observations
              {yearsCovered ? ` over ${yearsCovered}y` : ''}
              {windowStart && windowEnd ? ` (${windowStart} → ${windowEnd}).` : '.'}
            </p>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="rounded-xl p-4 space-y-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Pairwise stats
            </h3>
            {userPairs.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Add a second pick to see pairwise correlations.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <SummaryRow label="Pairs measured" value={`${userPairs.length}`} />
                <SummaryRow
                  label="Average"
                  value={avgPair !== null ? avgPair.toFixed(2) : '—'}
                  valueStyle={{ color: avgPair !== null && avgPair >= 0.85 ? 'var(--bs-critical)' : avgPair !== null && avgPair < 0.4 ? 'var(--bs-positive)' : 'var(--text-primary)' }}
                />
                <SummaryRow
                  label="Highest pair"
                  value={highest ? `${highest.a} ↔ ${highest.b}` : '—'}
                  hint={highest ? highest.c.toFixed(2) : undefined}
                  hintStyle={{ color: highest && highest.c >= 0.85 ? 'var(--bs-critical)' : 'var(--text-primary)' }}
                />
                <SummaryRow
                  label="Lowest pair"
                  value={lowest ? `${lowest.a} ↔ ${lowest.b}` : '—'}
                  hint={lowest ? lowest.c.toFixed(2) : undefined}
                  hintStyle={{ color: lowest && lowest.c < 0.4 ? 'var(--bs-positive)' : 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          {userPairs.length > 0 && (
            <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Diversification
              </h3>
              <div className="space-y-2 text-sm">
                <SummaryRow
                  label="Same-bet pairs (≥0.85)"
                  value={`${redundantCount}`}
                  valueStyle={{ color: redundantCount > 0 ? 'var(--bs-critical)' : 'var(--text-primary)' }}
                />
                <SummaryRow
                  label="Independent pairs (<0.4)"
                  value={`${independentCount}`}
                  valueStyle={{ color: independentCount > 0 ? 'var(--bs-positive)' : 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          {benchmark && vsBench.length > 0 && (
            <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                vs {benchmarkLabel}
              </h3>
              <ul className="space-y-1.5 text-sm">
                {vsBench.map(({ id, c }, i) => (
                  <li key={id} className="flex items-baseline justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span aria-hidden className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: colorFor(i) }} />
                      <span className="truncate" style={{ color: 'var(--text-primary)' }}>{id}</span>
                    </div>
                    <span
                      className="tabular-nums shrink-0 ml-2"
                      style={{ color: c !== null && c >= 0.85 ? 'var(--bs-critical)' : c !== null && c < 0.4 ? 'var(--bs-positive)' : 'var(--text-primary)' }}
                    >
                      {fmt(c)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  hint,
  valueStyle,
  hintStyle,
}: {
  label: string;
  value: string;
  hint?: string;
  valueStyle?: React.CSSProperties;
  hintStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-right">
        <span className="tabular-nums" style={{ color: 'var(--text-primary)', ...valueStyle }}>{value}</span>
        {hint && (
          <span className="ml-1.5 text-xs tabular-nums" style={hintStyle ?? { color: 'var(--text-muted)' }}>{hint}</span>
        )}
      </span>
    </div>
  );
}
