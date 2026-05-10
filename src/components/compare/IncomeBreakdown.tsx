'use client';

import { useMemo } from 'react';
import { type AssetResult, pointsFor } from './types';
import { trailingCAGR } from '@/lib/compareMath';
import { colorFor } from './colors';
import DocsLink from '@/components/shared/DocsLink';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  /** Period (years) over which to decompose. */
  years?: number;
}

function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export default function IncomeBreakdown({ assets, benchmarkSymbol, years = 10 }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);

  const rows = useMemo(() => userPicks.map((a, i) => {
    const priceCagr = trailingCAGR(pointsFor(a, 'price'), years);
    const totalCagr = trailingCAGR(pointsFor(a, 'total'), years);
    const dividendContribution = priceCagr !== null && totalCagr !== null
      ? totalCagr - priceCagr
      : null;
    return {
      asset: a,
      color: colorFor(i),
      priceCagr,
      totalCagr,
      dividendContribution,
      yieldPct: a.profile?.yieldPct ?? null,
    };
  }), [userPicks, years]);

  if (rows.length === 0) return null;

  // Bar widths use the larger of (price, total) across all rows so they're comparable.
  const maxAbs = rows.reduce((m, r) => {
    const t = r.totalCagr === null ? 0 : Math.abs(r.totalCagr);
    return t > m ? t : m;
  }, 0.001);

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-5 max-w-2xl">
        <h2 className="text-lg font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          Income breakdown — where the {years}y CAGR came from
          <DocsLink to="compare-income" label="How price/dividend split is computed" />
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Splits each fund&apos;s total return into <span style={{ color: 'var(--text-secondary)' }}>price appreciation</span> (capital gains) and <span style={{ color: 'var(--bs-positive)' }}>reinvested dividends</span>. Useful for income-tilted funds (SCHD, VYM) where a meaningful share of the return shows up as cash payouts, not chart-ticks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(r => {
          const priceFrac = r.priceCagr === null ? 0 : Math.abs(r.priceCagr) / maxAbs;
          const divFrac   = r.dividendContribution === null ? 0 : Math.abs(r.dividendContribution) / maxAbs;
          const dividendShare = r.totalCagr && r.dividendContribution !== null
            ? r.dividendContribution / r.totalCagr
            : null;

          return (
            <div
              key={r.asset.symbol}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-tertiary)', borderLeft: `3px solid ${r.color}` }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.asset.symbol}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {dividendShare !== null && r.dividendContribution !== null && r.dividendContribution > 0
                    ? `${(dividendShare * 100).toFixed(0)}% from dividends`
                    : ''}
                </span>
              </div>

              <Bar
                label="Price appreciation"
                value={r.priceCagr}
                fraction={priceFrac}
                color="var(--text-secondary)"
              />
              <Bar
                label="Reinvested dividends"
                value={r.dividendContribution}
                fraction={divFrac}
                color="var(--bs-positive)"
                positiveOnly
              />

              <div className="mt-3 pt-3 flex items-baseline justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total return ({years}y CAGR)</span>
                <span className="font-semibold tabular-nums" style={{ color: r.totalCagr !== null && r.totalCagr >= 0 ? 'var(--bs-positive)' : 'var(--bs-critical)' }}>
                  {fmtPct(r.totalCagr)}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Current yield (TTM)</span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmtPct(r.yieldPct, 2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  fraction,
  color,
  positiveOnly,
}: {
  label: string;
  value: number | null;
  fraction: number;
  color: string;
  positiveOnly?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  const display = value === null
    ? '—'
    : positiveOnly && value <= 0
      ? '0.0%'
      : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;

  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{display}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
