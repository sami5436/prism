'use client';

import { useEffect, useState } from 'react';

interface IVRankData {
  currentHV: number;
  hv52wLow: number;
  hv52wHigh: number;
  hvRank: number;
  hvPercentile: number;
  currentIV: number | null;
  ivHvRatio: number | null;
  interpretation: 'rich' | 'cheap' | 'neutral' | 'insufficient_data';
  series: { date: string; hv: number }[];
}

interface Props {
  ticker: string;
}

const INTERP_META: Record<string, { label: string; color: string; blurb: string }> = {
  rich: {
    label: 'Options look rich',
    color: '#22c55e',
    blurb: 'Implied vol is trading well above realized — premium sellers (short calls, credit spreads) have an edge. Long calls are expensive here.',
  },
  cheap: {
    label: 'Options look cheap',
    color: '#3b82f6',
    blurb: 'Implied vol is trading below or near realized — buying premium (long calls/puts) is relatively inexpensive. Selling premium earns less cushion.',
  },
  neutral: {
    label: 'Neutral pricing',
    color: 'var(--text-secondary)',
    blurb: 'IV is roughly in line with realized vol. No strong edge for buying or selling premium on volatility alone.',
  },
  insufficient_data: {
    label: 'Insufficient history',
    color: 'var(--text-muted)',
    blurb: 'Not enough price history to compute a 1-year volatility range for this ticker.',
  },
};

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export default function IVRankPanel({ ticker }: Props) {
  const [data, setData] = useState<IVRankData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/options/${ticker}/iv-rank`)
      .then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to load');
        return j as IVRankData;
      })
      .then(j => { if (!cancelled) setData(j); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Computing volatility stats…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error || 'No volatility data available.'}</p>
      </div>
    );
  }

  const meta = INTERP_META[data.interpretation];
  const rankColor = data.hvRank >= 70 ? '#22c55e' : data.hvRank <= 30 ? '#3b82f6' : 'var(--text-secondary)';

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Volatility Rank
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            HV-based proxy · trailing 1 year
          </p>
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{ background: 'rgba(255,255,255,0.03)', color: meta.color, border: `1px solid ${meta.color}33` }}
        >
          {meta.label}
        </span>
      </div>

      {/* Primary stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Stat label="HV Rank" value={`${data.hvRank.toFixed(0)}`} suffix="/100" valueColor={rankColor} />
        <Stat label="HV Percentile" value={`${data.hvPercentile.toFixed(0)}`} suffix="%" />
        <Stat
          label="Current IV (ATM)"
          value={data.currentIV != null ? pct(data.currentIV) : '—'}
        />
        <Stat
          label="IV / HV Ratio"
          value={data.ivHvRatio != null ? `${data.ivHvRatio.toFixed(2)}x` : '—'}
          valueColor={
            data.ivHvRatio == null ? undefined
              : data.ivHvRatio >= 1.3 ? '#22c55e'
              : data.ivHvRatio <= 0.9 ? '#3b82f6'
              : undefined
          }
        />
      </div>

      {/* HV range visualization */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>52w Low: {pct(data.hv52wLow)}</span>
          <span>Current HV: <span style={{ color: 'var(--text-primary)' }}>{pct(data.currentHV)}</span></span>
          <span>52w High: {pct(data.hv52wHigh)}</span>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: 0,
              width: `${Math.max(2, Math.min(100, data.hvRank))}%`,
              background: `linear-gradient(90deg, #3b82f6 0%, ${rankColor} 100%)`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3"
            style={{
              left: `${Math.max(0, Math.min(100, data.hvRank))}%`,
              background: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {meta.blurb}
      </p>

      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Note: Yahoo does not provide historical implied volatility. This panel ranks today&apos;s 30-day realized
        volatility against the trailing year as a proxy, and compares current ATM IV to current HV to estimate
        the volatility risk premium.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  valueColor,
}: {
  label: string;
  value: string;
  suffix?: string;
  valueColor?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums" style={{ color: valueColor ?? 'var(--text-primary)' }}>
        {value}
        {suffix && <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
      </p>
    </div>
  );
}
