'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

interface VolPoint { date: string; hv: number }
interface EarningsMarker { date: string; period: string }

interface IVRankData {
  currentHV: number;
  hv52wLow: number;
  hv52wHigh: number;
  hvRank: number;
  hvPercentile: number;
  currentIV: number | null;
  ivHvRatio: number | null;
  interpretation: 'rich' | 'cheap' | 'neutral' | 'insufficient_data';
  series: VolPoint[];
  fullSeries: VolPoint[];
  earnings: EarningsMarker[];
  ivExpiration: string | null;
  ivSource: 'quote' | 'last' | null;
}

interface Props {
  ticker: string;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtMonth = (d: string) => {
  const [y, m] = d.split('-');
  return `${m}/${y.slice(2)}`;
};

const RANGE_OPTIONS = [
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '2Y', days: 504 },
];

export default function IVRankPanel({ ticker }: Props) {
  const [data, setData] = useState<IVRankData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(252);
  const [pickedDate, setPickedDate] = useState<string>('');

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setPickedDate('');

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

  const chartSeries = useMemo(() => {
    if (!data) return [];
    return data.fullSeries.slice(-rangeDays);
  }, [data, rangeDays]);

  const visibleEarnings = useMemo(() => {
    if (!data || chartSeries.length === 0) return [];
    const startDate = chartSeries[0].date;
    const endDate = chartSeries[chartSeries.length - 1].date;
    const dateSet = new Set(chartSeries.map(p => p.date));
    return data.earnings
      .filter(e => e.date >= startDate && e.date <= endDate)
      .map(e => {
        // Snap to nearest trading day so the marker lands on the line.
        if (dateSet.has(e.date)) return e;
        const snapped = chartSeries.reduce((best, p) => {
          const dBest = Math.abs(new Date(best.date).getTime() - new Date(e.date).getTime());
          const dCurr = Math.abs(new Date(p.date).getTime() - new Date(e.date).getTime());
          return dCurr < dBest ? { date: p.date, hv: p.hv } : best;
        }, { date: chartSeries[0].date, hv: chartSeries[0].hv });
        return { ...e, date: snapped.date };
      });
  }, [data, chartSeries]);

  const earningsHvByDate = useMemo(() => {
    const map = new Map<string, number>();
    if (!data) return map;
    const seriesMap = new Map(data.fullSeries.map(p => [p.date, p.hv]));
    for (const e of visibleEarnings) {
      const hv = seriesMap.get(e.date);
      if (hv != null) map.set(e.date, hv);
    }
    return map;
  }, [data, visibleEarnings]);

  const pickedPoint = useMemo(() => {
    if (!data || !pickedDate) return null;
    // Snap user-picked date to nearest available trading day in the full series.
    const target = new Date(pickedDate).getTime();
    if (!Number.isFinite(target)) return null;
    let best = data.fullSeries[0];
    let bestDiff = Infinity;
    for (const p of data.fullSeries) {
      const diff = Math.abs(new Date(p.date).getTime() - target);
      if (diff < bestDiff) { best = p; bestDiff = diff; }
    }
    return best ?? null;
  }, [data, pickedDate]);

  const dateBounds = useMemo(() => {
    if (!data || data.fullSeries.length === 0) return null;
    return {
      min: data.fullSeries[0].date,
      max: data.fullSeries[data.fullSeries.length - 1].date,
    };
  }, [data]);

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

  const rankColor = data.hvRank >= 70 ? '#22c55e' : data.hvRank <= 30 ? '#3b82f6' : 'var(--text-secondary)';

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Volatility
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            HV (annualized 30d realized) over time · IV sampled from {data.ivExpiration ?? 'nearest'} expiration · ◆ = quarter-end
            {data.currentIV != null && <> · <span style={{ color: '#a855f7' }}>— —</span> current IV</>}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(opt => {
            const active = rangeDays === opt.days;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setRangeDays(opt.days)}
                className="text-[10px] px-2 py-1 rounded-md transition-colors cursor-pointer"
                style={{
                  background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: `1px solid ${active ? '#3b82f6' : 'var(--border-color)'}`,
                  color: active ? '#3b82f6' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat
          label="Current IV"
          value={data.currentIV != null ? pct(data.currentIV) : '—'}
          tag={data.ivSource === 'last' ? 'last trade' : null}
        />
        <Stat label="Current HV" value={pct(data.currentHV)} />
        <Stat
          label="IV / HV"
          value={data.ivHvRatio != null ? `${data.ivHvRatio.toFixed(2)}x` : '—'}
        />
      </div>

      <div className="mb-3">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hvFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickFormatter={fmtMonth}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
              labelFormatter={(d) => d as string}
              formatter={((value: number | undefined) => [pct(value ?? 0), 'HV']) as any}
            />
            <Area type="monotone" dataKey="hv" stroke="#3b82f6" strokeWidth={1.5} fill="url(#hvFill)" />
            {data.currentIV != null && (
              <ReferenceLine
                y={data.currentIV}
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `IV ${pct(data.currentIV)}`,
                  position: 'insideTopRight',
                  fill: '#a855f7',
                  fontSize: 10,
                }}
              />
            )}
            {visibleEarnings.map(e => (
              <ReferenceLine
                key={`l-${e.date}`}
                x={e.date}
                stroke="#f59e0b"
                strokeDasharray="2 3"
                strokeOpacity={0.5}
              />
            ))}
            {visibleEarnings.map(e => {
              const hv = earningsHvByDate.get(e.date);
              if (hv == null) return null;
              return (
                <ReferenceDot
                  key={`d-${e.date}`}
                  x={e.date}
                  y={hv}
                  r={4}
                  fill="#f59e0b"
                  stroke="var(--bg-secondary)"
                  strokeWidth={1.5}
                />
              );
            })}
            {pickedPoint && chartSeries.some(p => p.date === pickedPoint.date) && (
              <ReferenceDot
                x={pickedPoint.date}
                y={pickedPoint.hv}
                r={5}
                fill="#22c55e"
                stroke="var(--bg-secondary)"
                strokeWidth={1.5}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {dateBounds && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            HV on
          </label>
          <input
            type="date"
            value={pickedDate}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(e) => setPickedDate(e.target.value)}
            className="text-xs rounded-md px-2 py-1 outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          {pickedPoint ? (
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {pickedPoint.date} → <strong style={{ color: 'var(--text-primary)' }}>{pct(pickedPoint.hv)}</strong>
              <span className="ml-2" style={{ color: 'var(--text-muted)' }}>
                vs. now {pct(data.currentHV)} ({((pickedPoint.hv - data.currentHV) * 100).toFixed(1)} pts)
              </span>
            </span>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Pick any trading day in the last 2 years.
            </span>
          )}
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>52w Low {pct(data.hv52wLow)}</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            HV Rank <span className="tabular-nums font-semibold" style={{ color: rankColor }}>{data.hvRank.toFixed(0)}</span>
          </span>
          <span>52w High {pct(data.hv52wHigh)}</span>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3"
            style={{
              left: `${Math.max(0, Math.min(100, data.hvRank))}%`,
              background: 'var(--text-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tag }: { label: string; value: string; tag?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums flex items-baseline gap-1.5" style={{ color: 'var(--text-primary)' }}>
        {value}
        {tag && (
          <span
            className="text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
            }}
          >
            {tag}
          </span>
        )}
      </p>
    </div>
  );
}
