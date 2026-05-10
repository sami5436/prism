'use client';

import type { AssetResult } from './types';
import { colorFor } from './colors';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
}

function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtPrice(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

export default function AssetDetailCards({ assets, benchmarkSymbol }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  if (userPicks.length === 0) return null;

  const isSingle = userPicks.length === 1;

  return (
    <div className={`grid grid-cols-1 ${isSingle ? '' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
      {userPicks.map((a, i) => {
        const color = colorFor(i);
        const p = a.profile;
        const q = a.quote;
        const change = q?.changePercent ?? 0;
        return (
          <div
            key={a.symbol}
            className="rounded-2xl p-6"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderTop: `3px solid ${color}` }}
          >
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{a.symbol}</div>
              <div className="text-right shrink-0">
                <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmtPrice(q?.price)}</div>
                <div className="text-xs tabular-nums" style={{ color: change >= 0 ? 'var(--bs-positive)' : 'var(--bs-critical)' }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
              {p?.quoteType && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {p.quoteType}
                </span>
              )}
              {p?.family && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {p.family}
                </span>
              )}
              {p?.category && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {p.category}
                </span>
              )}
            </div>

            <div className={`grid ${isSingle ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-x-4 gap-y-2 text-sm`}>
              <Row label="Expense ratio" value={fmtPct(p?.expenseRatio, 2)} />
              <Row label="Yield" value={fmtPct(p?.yieldPct, 2)} />
              <Row label="AUM" value={fmtUsd(p?.totalAssets)} />
              <Row label="Inception" value={p?.inceptionDate ?? '—'} />
              <Row label="Beta" value={p?.beta?.toFixed(2) ?? '—'} />
              <Row label="YTD" value={fmtPct(p?.ytdReturn, 1)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
