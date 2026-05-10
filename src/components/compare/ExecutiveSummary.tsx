'use client';

import type { AssetResult } from './types';
import { trailingCAGR, annualizedVolatility, maxDrawdownInWindow, CRISIS_WINDOWS } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
}

function fmtPct(n: number | null, digits = 1): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export default function ExecutiveSummary({ assets, benchmarkSymbol, benchmarkLabel }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;
  const isSingle = userPicks.length === 1;

  // Compute headline numbers per asset.
  const rows = userPicks.map((a, i) => {
    const hist = a.historical ?? [];
    const cagr10 = trailingCAGR(hist, 10);
    const cagr5 = trailingCAGR(hist, 5);
    const vol = annualizedVolatility(hist);
    const worstDd = CRISIS_WINDOWS
      .map(w => maxDrawdownInWindow(hist, w.start, w.end))
      .filter((x): x is { drawdown: number; peakDate: string; troughDate: string } => x !== null)
      .reduce<number>((min, d) => (d.drawdown < min ? d.drawdown : min), 0);
    return { asset: a, color: colorFor(i), cagr10, cagr5, vol, worstDd };
  });

  // Build comparison line.
  let comparisonLine = '';
  if (isSingle) {
    const me = rows[0];
    const benchHist = benchmark?.historical ?? [];
    const benchCagr10 = trailingCAGR(benchHist, 10);
    if (me.cagr10 !== null && benchCagr10 !== null) {
      const diff = (me.cagr10 - benchCagr10) * 100;
      const direction = diff >= 0 ? 'beat' : 'trailed';
      comparisonLine = `Over the last 10 years, ${me.asset.symbol} ${direction} the ${benchmarkLabel} by ${Math.abs(diff).toFixed(1)} pts/yr.`;
    }
  } else if (rows.length >= 2) {
    const valid = rows.filter(r => r.cagr10 !== null) as (typeof rows[number] & { cagr10: number })[];
    if (valid.length >= 2) {
      const sorted = [...valid].sort((a, b) => b.cagr10 - a.cagr10);
      const top = sorted[0];
      const bottom = sorted[sorted.length - 1];
      const diff = (top.cagr10 - bottom.cagr10) * 100;
      comparisonLine = `${top.asset.symbol} led with ${(top.cagr10 * 100).toFixed(1)}%/yr over 10y — ${diff.toFixed(1)} pts ahead of ${bottom.asset.symbol}.`;
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isSingle ? `${userPicks[0].symbol} — at a glance` : 'Comparison summary'}
        </h2>
        {benchmark && (
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            Benchmarked against {benchmarkLabel}
          </span>
        )}
      </div>

      {comparisonLine && (
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{comparisonLine}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rows.map(r => (
          <div
            key={r.asset.symbol}
            className="rounded-xl p-3"
            style={{ background: 'var(--bg-tertiary)', borderTop: `2px solid ${r.color}` }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{r.asset.symbol}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.asset.profile?.quoteType ?? ''}</span>
            </div>
            <div className="space-y-1 text-xs">
              <Stat label="10y CAGR" value={fmtPct(r.cagr10)} />
              <Stat label="5y CAGR"  value={fmtPct(r.cagr5)} />
              <Stat label="Volatility" value={fmtPct(r.vol)} />
              <Stat label="Worst crisis" value={r.worstDd === 0 ? '—' : fmtPct(r.worstDd)} />
            </div>
          </div>
        ))}

        {isSingle && benchmark && (
          <div
            className="rounded-xl p-3"
            style={{ background: 'var(--bg-tertiary)', borderTop: `2px solid ${BENCHMARK_COLOR}` }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {benchmark.symbol}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Benchmark</span>
            </div>
            <div className="space-y-1 text-xs">
              <Stat label="10y CAGR" value={fmtPct(trailingCAGR(benchmark.historical ?? [], 10))} />
              <Stat label="5y CAGR"  value={fmtPct(trailingCAGR(benchmark.historical ?? [], 5))} />
              <Stat label="Volatility" value={fmtPct(annualizedVolatility(benchmark.historical ?? []))} />
              <Stat label="Worst crisis" value={(() => {
                const w = CRISIS_WINDOWS
                  .map(c => maxDrawdownInWindow(benchmark.historical ?? [], c.start, c.end))
                  .filter((x): x is { drawdown: number; peakDate: string; troughDate: string } => x !== null)
                  .reduce<number>((min, d) => (d.drawdown < min ? d.drawdown : min), 0);
                return w === 0 ? '—' : fmtPct(w);
              })()} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }} className="font-medium">{value}</span>
    </div>
  );
}
