'use client';

import { useEffect, useMemo, useState } from 'react';

interface StrikeLevel {
  strike: number;
  callOI: number;
  putOI: number;
  callVolume: number;
  putVolume: number;
  distancePct: number;
}

interface LevelsPayload {
  underlyingPrice: number;
  expirationsUsed: string[];
  dteRange: { min: number; max: number };
  strikes: StrikeLevel[];
}

interface Props {
  ticker: string;
  minDte: number;
  maxDte: number;
}

const fmtDollar = (v: number) => `$${v.toFixed(2)}`;
const fmtInt = (v: number) => v.toLocaleString();
const fmtSignedPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;

export default function PriceLevelsPanel({ ticker, minDte, maxDte }: Props) {
  const [data, setData] = useState<LevelsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    if (minDte > maxDte) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const qs = new URLSearchParams({
      minDte: String(minDte),
      maxDte: String(maxDte),
    });

    fetch(`/api/options/${ticker}/levels?${qs}`)
      .then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to load');
        return j as LevelsPayload;
      })
      .then(j => { if (!cancelled) setData(j); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ticker, minDte, maxDte]);

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Open Interest by Strike
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data
            ? `${data.expirationsUsed.length} expirations · ±15% of spot ${fmtDollar(data.underlyingPrice)}`
            : 'Per-strike call & put OI around spot.'}
        </p>
      </div>

      {loading && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading price levels…</p>
      )}
      {error && !loading && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
      )}

      {data && !loading && (
        <>
          {data.strikes.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No OI within ±15% of spot in the {data.dteRange.min}–{data.dteRange.max} day window.
            </p>
          ) : (
            <StrikeLadder strikes={data.strikes} spot={data.underlyingPrice} />
          )}
        </>
      )}
    </div>
  );
}

function StrikeLadder({ strikes, spot }: { strikes: StrikeLevel[]; spot: number }) {
  const ordered = useMemo(
    () => strikes.slice().sort((a, b) => b.strike - a.strike),
    [strikes],
  );

  const maxOI = useMemo(
    () => ordered.reduce((m, s) => Math.max(m, s.callOI, s.putOI), 0),
    [ordered],
  );

  const spotIdx = ordered.findIndex(s => s.strike <= spot);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
      <div
        className="grid items-center text-[10px] uppercase tracking-wider px-3 py-2"
        style={{
          gridTemplateColumns: '1fr 80px 1fr',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="text-right pr-3">Puts</div>
        <div className="text-center">Strike</div>
        <div className="pl-3">Calls</div>
      </div>

      {ordered.map((s, i) => (
        <div key={s.strike}>
          {i === spotIdx && <SpotRow spot={spot} />}
          <LadderRow strike={s} maxOI={maxOI} />
        </div>
      ))}
      {spotIdx === -1 && <SpotRow spot={spot} />}
    </div>
  );
}

function LadderRow({ strike, maxOI }: { strike: StrikeLevel; maxOI: number }) {
  const putW = maxOI > 0 ? (strike.putOI / maxOI) * 100 : 0;
  const callW = maxOI > 0 ? (strike.callOI / maxOI) * 100 : 0;
  const aboveSpot = strike.distancePct >= 0;

  return (
    <div
      className="grid items-center px-3 py-1.5 text-xs"
      style={{
        gridTemplateColumns: '1fr 80px 1fr',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-end gap-2 pr-3">
        <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {strike.putOI > 0 ? fmtInt(strike.putOI) : ''}
        </span>
        <div className="relative h-3 flex-1 max-w-[240px]">
          <div
            className="absolute right-0 top-0 h-full rounded-l-sm"
            style={{ width: `${putW}%`, background: '#ef4444', opacity: 0.75 }}
          />
        </div>
      </div>

      <div className="text-center">
        <div className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {fmtDollar(strike.strike)}
        </div>
        <div className="text-[10px] tabular-nums" style={{ color: aboveSpot ? '#22c55e' : '#ef4444' }}>
          {fmtSignedPct(strike.distancePct)}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-3">
        <div className="relative h-3 flex-1 max-w-[240px]">
          <div
            className="absolute left-0 top-0 h-full rounded-r-sm"
            style={{ width: `${callW}%`, background: '#22c55e', opacity: 0.75 }}
          />
        </div>
        <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {strike.callOI > 0 ? fmtInt(strike.callOI) : ''}
        </span>
      </div>
    </div>
  );
}

function SpotRow({ spot }: { spot: number }) {
  return (
    <div
      className="grid items-center px-3 py-1"
      style={{
        gridTemplateColumns: '1fr 80px 1fr',
        background: 'rgba(59,130,246,0.06)',
        borderTop: '1px dashed #3b82f6',
        borderBottom: '1px dashed #3b82f6',
      }}
    >
      <div className="h-px" />
      <div
        className="text-center text-[10px] font-semibold uppercase tracking-wider tabular-nums"
        style={{ color: '#3b82f6' }}
      >
        Spot {fmtDollar(spot)}
      </div>
      <div className="h-px" />
    </div>
  );
}
