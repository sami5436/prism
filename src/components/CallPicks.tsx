'use client';

import { useEffect, useState } from 'react';
import DocsLink from '@/components/shared/DocsLink';

interface CallPick {
  contractSymbol: string;
  strike: number;
  expiration: string;
  dte: number;
  bid: number;
  ask: number;
  mid: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  premiumYield?: number;
  annualizedYield?: number;
  breakeven?: number;
  pctMoveNeeded?: number;
  score: number;
}

interface Payload {
  underlyingPrice: number;
  expirationsScanned: string[];
  dteRange: { min: number; max: number };
  sells: CallPick[];
  buys: CallPick[];
}

interface Props {
  ticker: string;
  minDte: number;
  maxDte: number;
}

const fmtDollar = (v: number) => `$${v.toFixed(2)}`;
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function CallPicks({ ticker, minDte, maxDte }: Props) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    if (minDte > maxDte) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams({
      minDte: String(minDte),
      maxDte: String(maxDte),
    });

    fetch(`/api/options/${ticker}/call-picks?${qs}`)
      .then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to load');
        return j as Payload;
      })
      .then(j => { if (!cancelled) setData(j); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ticker, minDte, maxDte]);

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <h3 className="text-base font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          Buy Candidates
          <DocsLink to="screener-math" label="How candidates are scored" />
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data
            ? `${data.expirationsScanned.length} expirations · Δ 0.40–0.65 · OI ≥ 100`
            : 'Near-ATM calls, filtered by liquidity.'}
        </p>
      </div>

      {loading && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Scanning contracts…</p>
      )}

      {error && !loading && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{error}</p>
      )}

      {!data && !loading && !error && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>No picks available.</p>
      )}

      {data && <PicksTable rows={data.buys} />}
    </div>
  );
}

function PicksTable({ rows }: { rows: CallPick[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        No contracts matched the filters in this DTE range.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <Th>Strike</Th>
            <Th>Exp</Th>
            <Th>DTE</Th>
            <Th>Ask</Th>
            <Th>Δ</Th>
            <Th>B/E</Th>
            <Th>Move</Th>
            <Th>OI</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.contractSymbol}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-color)' : undefined }}
            >
              <Td bold>{fmtDollar(r.strike)}</Td>
              <Td>{r.expiration.slice(5)}</Td>
              <Td>{r.dte}d</Td>
              <Td>{fmtDollar(r.ask)}</Td>
              <Td>{r.delta.toFixed(2)}</Td>
              <Td>{r.breakeven != null ? fmtDollar(r.breakeven) : '—'}</Td>
              <Td accent="#3b82f6">{r.pctMoveNeeded != null ? fmtPct(r.pctMoveNeeded) : '—'}</Td>
              <Td>{r.openInterest.toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-2 px-3 font-medium uppercase tracking-wider text-[10px]"
        style={{ color: 'var(--text-muted)' }}>
      {children}
    </th>
  );
}

function Td({ children, bold, accent }: { children: React.ReactNode; bold?: boolean; accent?: string }) {
  return (
    <td className="py-1.5 px-3 tabular-nums"
        style={{
          color: accent ?? (bold ? 'var(--text-primary)' : 'var(--text-secondary)'),
          fontWeight: bold || accent ? 600 : 400,
        }}>
      {children}
    </td>
  );
}
