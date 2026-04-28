'use client';

interface Trend {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface Analyst {
  currentPrice: number | null;
  targetMean: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  targetMedian: number | null;
  numAnalysts: number | null;
  recommendationKey: string | null;
  recommendationMean: number | null;
  trend: Trend | null;
}

interface Props {
  data: Analyst | null;
  loading?: boolean;
}

const usd = (v: number | null) =>
  v == null ? '—' : `$${v.toFixed(2)}`;

const recoLabel = (k: string | null): string => {
  if (!k) return '—';
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const recoColor = (mean: number | null): string => {
  if (mean == null) return 'var(--text-secondary)';
  if (mean <= 2.0) return '#22c55e';   // buy / strong buy
  if (mean <= 3.0) return 'var(--text-secondary)'; // hold
  return '#ef4444';                    // sell territory
};

const SEGMENTS: { key: keyof Trend; label: string; color: string }[] = [
  { key: 'strongBuy', label: 'Strong Buy', color: '#16a34a' },
  { key: 'buy',       label: 'Buy',        color: '#22c55e' },
  { key: 'hold',      label: 'Hold',       color: '#9ca3af' },
  { key: 'sell',      label: 'Sell',       color: '#f97316' },
  { key: 'strongSell',label: 'Strong Sell',color: '#ef4444' },
];

export default function AnalystRatingsPanel({ data, loading }: Props) {
  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Analyst Ratings
        </h3>
        {data?.numAnalysts != null && (
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {data.numAnalysts} analysts
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : !data ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No analyst data available.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Mean Target" value={usd(data.targetMean)} />
            <Stat label="High" value={usd(data.targetHigh)} />
            <Stat label="Low" value={usd(data.targetLow)} />
          </div>

          {data.targetMean != null && data.currentPrice != null && data.currentPrice > 0 && (
            <TargetRange
              current={data.currentPrice}
              low={data.targetLow ?? data.targetMean}
              mean={data.targetMean}
              high={data.targetHigh ?? data.targetMean}
            />
          )}

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Consensus
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: recoColor(data.recommendationMean) }}
            >
              {recoLabel(data.recommendationKey)}
              {data.recommendationMean != null && (
                <span className="ml-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  ({data.recommendationMean.toFixed(2)})
                </span>
              )}
            </span>
          </div>

          {data.trend && <DistributionBar trend={data.trend} />}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-base font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function TargetRange({
  current, low, mean, high,
}: { current: number; low: number; mean: number; high: number }) {
  const min = Math.min(low, current);
  const max = Math.max(high, current);
  const span = Math.max(1e-6, max - min);
  const pos = (v: number) => `${((v - min) / span) * 100}%`;
  const diffPct = ((mean - current) / current) * 100;

  return (
    <div>
      <div className="relative h-2 rounded-full" style={{ background: 'var(--border-color)' }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full"
          style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})`, background: 'rgba(59,130,246,0.35)' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded"
          style={{ left: pos(mean), background: '#3b82f6' }}
          title={`Mean target: $${mean.toFixed(2)}`}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4"
          style={{ left: pos(current), background: 'var(--text-primary)' }}
          title={`Current: $${current.toFixed(2)}`}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        <span>${low.toFixed(0)}</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          now ${current.toFixed(2)} → mean ${mean.toFixed(2)} ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
        </span>
        <span>${high.toFixed(0)}</span>
      </div>
    </div>
  );
}

function DistributionBar({ trend }: { trend: Trend }) {
  const total = SEGMENTS.reduce((s, seg) => s + (trend[seg.key] || 0), 0);
  if (total === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex h-2 rounded-full overflow-hidden">
        {SEGMENTS.map((seg) => {
          const v = trend[seg.key] || 0;
          if (v === 0) return null;
          return (
            <div
              key={seg.key}
              style={{
                width: `${(v / total) * 100}%`,
                background: seg.color,
              }}
              title={`${seg.label}: ${v}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {SEGMENTS.map((seg) => {
          const v = trend[seg.key] || 0;
          if (v === 0) return null;
          return (
            <span key={seg.key} className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: seg.color }} />
              {seg.label} {v}
            </span>
          );
        })}
      </div>
    </div>
  );
}
