'use client';

import { useState } from 'react';
import type { AssetResult } from './types';
import type { FundHolding, SectorWeight } from '@/lib/yahooFinance';
import { colorFor } from './colors';
import DocsLink from '@/components/shared/DocsLink';

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

// "consumer_cyclical" -> "Consumer Cyclical"
function formatSectorKey(k: string): string {
  return k
    .split('_')
    .map(part => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

export default function AssetDetailCards({ assets, benchmarkSymbol }: Props) {
  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol);
  if (userPicks.length === 0) return null;

  const isSingle = userPicks.length === 1;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
        Asset details
        <DocsLink to="compare-detail" label="What the asset cards show" />
      </h2>
      <div className={`grid grid-cols-1 ${isSingle ? '' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {userPicks.map((a, i) => (
          <AssetCard
            key={a.symbol}
            asset={a}
            color={colorFor(i)}
            isSingle={isSingle}
          />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ asset: a, color, isSingle }: { asset: AssetResult; color: string; isSingle: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const p = a.profile;
  const q = a.quote;
  const change = q?.changePercent ?? 0;

  const holdings = p?.holdings ?? [];
  const sectors = p?.sectorWeightings ?? [];
  const expandable = holdings.length > 0 || sectors.length > 0;

  const toggle = () => {
    if (expandable) setExpanded(e => !e);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!expandable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded(x => !x);
    }
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderTop: `3px solid ${color}` }}
    >
      {/* Click target wraps the summary section only — not the expanded body
          so users can select text in the holdings list without collapsing. */}
      <div
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? expanded : undefined}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={expandable ? 'cursor-pointer' : ''}
      >
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{a.symbol}</div>
            {expandable && <Chevron up={expanded} />}
          </div>
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

        <div className={`grid ${isSingle ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-x-4 gap-y-2 text-sm`}>
          <Row label="Expense ratio" value={fmtPct(p?.expenseRatio, 2)} />
          <Row label="Yield" value={fmtPct(p?.yieldPct, 2)} />
          <Row label="AUM" value={fmtUsd(p?.totalAssets)} />
          <Row label="Inception" value={p?.inceptionDate ?? '—'} />
          <Row label="Beta" value={p?.beta?.toFixed(2) ?? '—'} />
          <Row label="YTD" value={fmtPct(p?.ytdReturn, 1)} />
          <Row label="Holdings" value={holdings.length > 0 ? `${holdings.length}` : '—'} />
          <Row
            label="Top 10 weight"
            value={
              holdings.length > 0
                ? `${(holdings.slice(0, 10).reduce((s, h) => s + h.percent, 0) * 100).toFixed(0)}%`
                : '—'
            }
          />
        </div>

        {expandable && !expanded && (
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            Click to see top holdings{sectors.length > 0 ? ' and sector mix' : ''}.
          </p>
        )}
      </div>

      {expandable && expanded && (
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
          {holdings.length > 0 && (
            <Holdings list={holdings} accent={color} />
          )}
          {sectors.length > 0 && (
            <SectorMix list={sectors} accent={color} dense={holdings.length > 0} />
          )}
        </div>
      )}
    </div>
  );
}

function Holdings({ list, accent }: { list: FundHolding[]; accent: string }) {
  // Cap at 10. Compute "other" = remainder of fund not in top-10.
  const top = list.slice(0, 10);
  const topSum = top.reduce((s, h) => s + h.percent, 0);
  const other = Math.max(0, 1 - topSum);
  const max = Math.max(...top.map(h => h.percent));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top holdings</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {(topSum * 100).toFixed(1)}% of fund
        </span>
      </div>
      <ul className="space-y-2">
        {top.map(h => (
          <li key={`${h.symbol ?? h.name}-${h.percent}`} className="text-sm">
            <div className="flex items-baseline justify-between gap-3 mb-0.5">
              <div className="flex items-baseline gap-2 min-w-0">
                {h.symbol && (
                  <span className="font-semibold text-xs tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>
                    {h.symbol}
                  </span>
                )}
                <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{h.name}</span>
              </div>
              <span className="tabular-nums text-xs shrink-0" style={{ color: 'var(--text-primary)' }}>
                {(h.percent * 100).toFixed(2)}%
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(h.percent / max) * 100}%`,
                  background: accent,
                }}
              />
            </div>
          </li>
        ))}
        {other > 0.001 && (
          <li className="text-xs flex items-baseline justify-between pt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Remaining holdings</span>
            <span className="tabular-nums">{(other * 100).toFixed(1)}%</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function SectorMix({ list, accent, dense }: { list: SectorWeight[]; accent: string; dense?: boolean }) {
  const max = Math.max(...list.map(s => s.percent));
  return (
    <div className={dense ? 'mt-5' : ''}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Sector mix</h3>
      <ul className="space-y-1.5">
        {list.map(s => (
          <li key={s.sector}>
            <div className="flex items-baseline justify-between text-xs mb-0.5">
              <span style={{ color: 'var(--text-secondary)' }}>{formatSectorKey(s.sector)}</span>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{(s.percent * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(s.percent / max) * 100}%`, background: accent, opacity: 0.7 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: 'var(--text-muted)',
        transform: up ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease',
      }}
      aria-hidden
    >
      <polyline points="3 5 7 9 11 5" />
    </svg>
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
