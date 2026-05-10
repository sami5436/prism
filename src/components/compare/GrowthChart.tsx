'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { type AssetResult, pointsFor } from './types';
import { alignedGrowthSeries } from '@/lib/compareMath';
import { colorFor, BENCHMARK_COLOR } from './colors';

interface Props {
  assets: AssetResult[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
  initialValue?: number;
}

const RANGES = [
  { label: '1Y', years: 1 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: 'Max', years: 30 },
] as const;

export default function GrowthChart({
  assets,
  benchmarkSymbol,
  benchmarkLabel,
  initialValue = 10_000,
}: Props) {
  const [rangeYears, setRangeYears] = useState<number>(10);

  const chartData = useMemo(() => {
    const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol && (a.historical?.length ?? 0) > 0);
    const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

    // Total-return series: dividends reinvested. Otherwise SCHD-style funds
    // look artificially flat compared to growth funds in this chart.
    const allSeries = [
      ...userPicks.map(a => ({ id: a.symbol, points: pointsFor(a, 'total') })),
      ...(benchmark && (benchmark.historical?.length ?? 0) > 0
        ? [{ id: benchmark.symbol, points: pointsFor(benchmark, 'total') }]
        : []),
    ];

    if (allSeries.length === 0) return [];

    // Trim each series to the requested range, anchored to the latest data
    // point we have (not Date.now, which would be unstable across renders).
    let latestMs = 0;
    for (const s of allSeries) {
      const last = s.points[s.points.length - 1]?.date;
      if (last) {
        const ms = new Date(last + 'T00:00:00Z').getTime();
        if (ms > latestMs) latestMs = ms;
      }
    }
    const cutoffMs = latestMs - rangeYears * 365.25 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(cutoffMs).toISOString().split('T')[0];
    const trimmed = allSeries.map(s => ({
      id: s.id,
      points: s.points.filter(p => p.date >= cutoff),
    }));

    const aligned = alignedGrowthSeries(trimmed, initialValue, 400);
    return aligned.map(row => ({ date: row.date, ...row.values }));
  }, [assets, benchmarkSymbol, rangeYears, initialValue]);

  const userPicks = assets.filter(a => a.symbol !== benchmarkSymbol && (a.historical?.length ?? 0) > 0);
  const benchmark = benchmarkSymbol ? assets.find(a => a.symbol === benchmarkSymbol) : null;

  const seriesMeta = [
    ...userPicks.map((a, i) => ({ id: a.symbol, color: colorFor(i), label: a.symbol })),
    ...(benchmark ? [{ id: benchmark.symbol, color: BENCHMARK_COLOR, label: `${benchmark.symbol} (${benchmarkLabel})` }] : []),
  ];

  const last = chartData[chartData.length - 1];

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>${initialValue.toLocaleString()} invested</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total return — dividends reinvested.</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setRangeYears(r.years)}
              className="px-2.5 py-1 text-xs rounded cursor-pointer"
              style={{
                background: rangeYears === r.years ? 'var(--bg-tertiary)' : 'transparent',
                color: rangeYears === r.years ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(d: string) => {
                const dt = new Date(d);
                return rangeYears <= 1
                  ? `${dt.getMonth() + 1}/${dt.getDate()}`
                  : `${dt.toLocaleString('en-US', { month: 'short' })} '${String(dt.getFullYear()).slice(2)}`;
              }}
              minTickGap={30}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={v => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--text-muted)' }}
              formatter={(value: unknown, name: unknown) => [
                `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {seriesMeta.map(s => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.id === benchmarkSymbol ? 1.5 : 2}
                strokeDasharray={s.id === benchmarkSymbol ? '4 3' : undefined}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {last && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {seriesMeta.map(s => {
            const v = (last as Record<string, number | string>)[s.id];
            const ending = typeof v === 'number' ? v : null;
            const gain = ending !== null ? ending - initialValue : null;
            return (
              <div key={s.id} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-1.5 mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="truncate">{s.id}</span>
                </div>
                <div className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {ending !== null ? `$${ending.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                </div>
                {gain !== null && (
                  <div className="tabular-nums text-[11px]" style={{ color: gain >= 0 ? 'var(--bs-positive)' : 'var(--bs-critical)' }}>
                    {gain >= 0 ? '+' : ''}${Math.abs(gain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
