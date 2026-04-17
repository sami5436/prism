'use client';

import { useEffect, useMemo, useState } from 'react';

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
}

const DEFAULT_MIN_DTE = 15;
const DEFAULT_MAX_DTE = 60;

const PRESETS: { label: string; min: number; max: number }[] = [
  { label: 'Weekly', min: 0, max: 14 },
  { label: 'Monthly', min: 15, max: 60 },
  { label: 'Quarterly', min: 45, max: 120 },
  { label: 'LEAPS-ish', min: 120, max: 365 },
];

const fmtDollar = (v: number) => `$${v.toFixed(2)}`;
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function CallPicks({ ticker }: Props) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minDte, setMinDte] = useState<number>(DEFAULT_MIN_DTE);
  const [maxDte, setMaxDte] = useState<number>(DEFAULT_MAX_DTE);

  // Debounce: only refetch after the user stops adjusting the range for 400ms.
  const [appliedMin, setAppliedMin] = useState(DEFAULT_MIN_DTE);
  const [appliedMax, setAppliedMax] = useState(DEFAULT_MAX_DTE);
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedMin(minDte);
      setAppliedMax(maxDte);
    }, 400);
    return () => clearTimeout(t);
  }, [minDte, maxDte]);

  const rangeInvalid = minDte > maxDte;

  useEffect(() => {
    if (!ticker) return;
    if (appliedMin > appliedMax) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams({
      minDte: String(appliedMin),
      maxDte: String(appliedMax),
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
  }, [ticker, appliedMin, appliedMax]);

  const activePreset = useMemo(
    () => PRESETS.find(p => p.min === minDte && p.max === maxDte)?.label ?? 'Custom',
    [minDte, maxDte],
  );

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Call Picks
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data
              ? `Underlying ${fmtDollar(data.underlyingPrice)} · scanned ${data.expirationsScanned.length} expirations · delta via Black-Scholes`
              : 'Delta computed via Black-Scholes from each contract’s IV.'}
          </p>
        </div>

        <DteControl
          min={minDte}
          max={maxDte}
          onChangeMin={setMinDte}
          onChangeMax={setMaxDte}
          activePreset={activePreset}
          onPreset={(p) => { setMinDte(p.min); setMaxDte(p.max); }}
          invalid={rangeInvalid}
        />
      </div>

      {rangeInvalid && (
        <p className="text-xs mb-3" style={{ color: '#f59e0b' }}>
          Min DTE must be less than or equal to Max DTE.
        </p>
      )}

      {loading && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Scanning contracts…</p>
      )}

      {error && !loading && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{error}</p>
      )}

      {!data && !loading && !error && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>No picks available.</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PickSection
              title="To Sell (collect premium)"
              subtitle={`OTM, Δ 0.15–0.35, ${data.dteRange.min}–${data.dteRange.max} DTE. Ranked by annualized yield × P(OTM).`}
              accent="#22c55e"
              rows={data.sells}
              mode="sell"
            />
            <PickSection
              title="To Buy (bet on upside)"
              subtitle={`Near-ATM, Δ 0.40–0.65, ${data.dteRange.min}–${data.dteRange.max} DTE. Ranked by leverage per % move required.`}
              accent="#3b82f6"
              rows={data.buys}
              mode="buy"
            />
          </div>

          <p className="text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Screener output, not advice. All filters require OI ≥ 100 for liquidity. Delta is a Black-Scholes
            estimate using the contract&apos;s IV and a 4.5% risk-free rate. Verify with your broker before trading.
          </p>
        </>
      )}
    </div>
  );
}

function DteControl({
  min,
  max,
  onChangeMin,
  onChangeMax,
  activePreset,
  onPreset,
  invalid,
}: {
  min: number;
  max: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  activePreset: string;
  onPreset: (p: { min: number; max: number }) => void;
  invalid: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    border: `1px solid ${invalid ? '#f59e0b' : 'var(--border-color)'}`,
    color: 'var(--text-primary)',
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          DTE
        </span>
        <input
          type="number"
          min={0}
          max={730}
          value={min}
          onChange={(e) => onChangeMin(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 text-xs tabular-nums rounded-md px-2 py-1 outline-none"
          style={inputStyle}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
        <input
          type="number"
          min={0}
          max={730}
          value={max}
          onChange={(e) => onChangeMax(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 text-xs tabular-nums rounded-md px-2 py-1 outline-none"
          style={inputStyle}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => {
          const active = activePreset === p.label;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onPreset(p)}
              className="text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              style={{
                background: active ? 'var(--bs-accent-dim, rgba(59,130,246,0.12))' : 'transparent',
                border: `1px solid ${active ? 'var(--bs-accent, #3b82f6)' : 'var(--border-color)'}`,
                color: active ? 'var(--bs-accent, #3b82f6)' : 'var(--text-muted)',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PickSection({
  title,
  subtitle,
  accent,
  rows,
  mode,
}: {
  title: string;
  subtitle: string;
  accent: string;
  rows: CallPick[];
  mode: 'sell' | 'buy';
}) {
  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: `1px solid ${accent}33` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      </div>
      <p className="text-[11px] mb-3 leading-snug" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>

      {rows.length === 0 ? (
        <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
          No contracts matched the filters. Try again after market open or pick a more active ticker.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <Th>Strike</Th>
                <Th>Exp</Th>
                <Th>DTE</Th>
                <Th>{mode === 'sell' ? 'Bid' : 'Ask'}</Th>
                <Th>Δ</Th>
                {mode === 'sell' ? (
                  <>
                    <Th>Yield</Th>
                    <Th>Ann.</Th>
                  </>
                ) : (
                  <>
                    <Th>B/E</Th>
                    <Th>Move</Th>
                  </>
                )}
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
                  <Td>{fmtDollar(mode === 'sell' ? r.bid : r.ask)}</Td>
                  <Td>{r.delta.toFixed(2)}</Td>
                  {mode === 'sell' ? (
                    <>
                      <Td>{r.premiumYield != null ? fmtPct(r.premiumYield) : '—'}</Td>
                      <Td accent={accent}>{r.annualizedYield != null ? fmtPct(r.annualizedYield) : '—'}</Td>
                    </>
                  ) : (
                    <>
                      <Td>{r.breakeven != null ? fmtDollar(r.breakeven) : '—'}</Td>
                      <Td accent={accent}>{r.pctMoveNeeded != null ? fmtPct(r.pctMoveNeeded) : '—'}</Td>
                    </>
                  )}
                  <Td>{r.openInterest.toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-1.5 pr-2 font-medium uppercase tracking-wider text-[10px]"
        style={{ color: 'var(--text-muted)' }}>
      {children}
    </th>
  );
}

function Td({ children, bold, accent }: { children: React.ReactNode; bold?: boolean; accent?: string }) {
  return (
    <td className="py-1.5 pr-2 tabular-nums"
        style={{
          color: accent ?? (bold ? 'var(--text-primary)' : 'var(--text-secondary)'),
          fontWeight: bold || accent ? 600 : 400,
        }}>
      {children}
    </td>
  );
}
