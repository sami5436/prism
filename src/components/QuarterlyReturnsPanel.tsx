'use client';

import { useMemo } from 'react';
import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { HistoricalDataPoint, EarningsReport } from '@/types/stock';

interface Props {
  historical: HistoricalDataPoint[];
  earnings: EarningsReport[];
}

interface Bucket {
  key: string;        // earnings date that closes the bucket, or "in-progress"
  label: string;      // "1Q2025" from Yahoo, or "In progress"
  startDate: string;
  endDate: string;
  open: number;
  close: number;
  high: number;
  low: number;
  change: number;
  changePct: number;
  isInProgress: boolean;
}

const fmt = (v: number) => `$${v.toFixed(2)}`;
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
const fmtSigned = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;
const fmtMonth = (d: string) => {
  const [y, m] = d.split('-');
  return `${m}/${y.slice(2)}`;
};

/**
 * Build buckets of price action keyed to fiscal-quarter-end dates from Yahoo's
 * earningsHistory. Each bucket spans bars in (prevEarnings, thisEarnings]; trailing
 * bars after the most recent earnings date form an "in-progress" bucket.
 *
 * Note: Yahoo anchors earningsHistory on the fiscal quarter-end (not the announcement
 * date), so the bucket boundary is the period close — close enough to align tables/markers
 * to the company's actual reporting cycle (e.g., Apple's fiscal Q1 ends in December).
 */
function buildBuckets(historical: HistoricalDataPoint[], earnings: EarningsReport[]): Bucket[] {
  if (!historical.length) return [];
  const sortedHist = [...historical].sort((a, b) => a.date.localeCompare(b.date));
  const sortedEarn = [...earnings]
    .filter(e => e.date >= sortedHist[0].date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const buckets: Bucket[] = [];

  let cursor = 0; // index into sortedHist
  let prevEnd: string | null = null;

  const sliceTo = (endDateInclusive: string) => {
    const start = cursor;
    while (cursor < sortedHist.length && sortedHist[cursor].date <= endDateInclusive) {
      cursor++;
    }
    return sortedHist.slice(start, cursor);
  };

  for (const e of sortedEarn) {
    const bars = sliceTo(e.date);
    if (!bars.length) continue;
    const first = bars[0];
    const last = bars[bars.length - 1];
    const high = bars.reduce((m, b) => Math.max(m, b.high), -Infinity);
    const low = bars.reduce((m, b) => Math.min(m, b.low), Infinity);
    buckets.push({
      key: e.date,
      label: e.period || `Q ending ${e.date}`,
      startDate: first.date,
      endDate: last.date,
      open: first.close,
      close: last.close,
      high,
      low,
      change: last.close - first.close,
      changePct: first.close > 0 ? (last.close - first.close) / first.close : 0,
      isInProgress: false,
    });
    prevEnd = e.date;
  }

  // Trailing bars past the last earnings date form an in-progress bucket.
  if (cursor < sortedHist.length) {
    const bars = sortedHist.slice(cursor);
    const first = bars[0];
    const last = bars[bars.length - 1];
    const high = bars.reduce((m, b) => Math.max(m, b.high), -Infinity);
    const low = bars.reduce((m, b) => Math.min(m, b.low), Infinity);
    buckets.push({
      key: 'in-progress',
      label: 'In progress',
      startDate: first.date,
      endDate: last.date,
      open: first.close,
      close: last.close,
      high,
      low,
      change: last.close - first.close,
      changePct: first.close > 0 ? (last.close - first.close) / first.close : 0,
      isInProgress: true,
    });
  }

  void prevEnd;
  return buckets;
}

export default function QuarterlyReturnsPanel({ historical, earnings }: Props) {
  const chartData = useMemo(
    () => historical.map(b => ({ date: b.date, close: b.close })),
    [historical],
  );

  const buckets = useMemo(() => buildBuckets(historical, earnings), [historical, earnings]);

  // Mark each earnings boundary that falls within the visible window. Snap to the
  // nearest available trading day so the dot lands on the price line.
  const earningsMarkers = useMemo(() => {
    if (!historical.length || !earnings.length) return [];
    const startDate = historical[0].date;
    const endDate = historical[historical.length - 1].date;
    const byDate = new Map(historical.map(b => [b.date, b.close]));
    return earnings
      .filter(e => e.date >= startDate && e.date <= endDate)
      .map(e => {
        if (byDate.has(e.date)) return { date: e.date, price: byDate.get(e.date)!, period: e.period };
        // Snap to nearest trading day in history.
        const target = new Date(e.date).getTime();
        const snapped = historical.reduce((best, b) => {
          const dBest = Math.abs(new Date(best.date).getTime() - target);
          const dCurr = Math.abs(new Date(b.date).getTime() - target);
          return dCurr < dBest ? b : best;
        }, historical[0]);
        return { date: snapped.date, price: snapped.close, period: e.period };
      });
  }, [historical, earnings]);

  if (!historical.length) {
    return (
      <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No price history available.</p>
      </div>
    );
  }

  const earningsAvailable = earnings.length > 0;

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
          Returns by Fiscal Quarter
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {earningsAvailable
            ? 'Close price bucketed between consecutive earnings reports · markers = fiscal-quarter-end'
            : 'Earnings history unavailable for this ticker'}
        </p>
      </div>

      <div className="mb-4" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v) => `$${Math.round(v)}`}
              width={48}
              domain={['auto', 'auto']}
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
              formatter={(value) => [fmt(typeof value === 'number' ? value : 0), 'Close']}
            />
            <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={1.5} fill="url(#priceFill)" />
            {earningsMarkers.map(m => (
              <ReferenceLine
                key={`l-${m.date}`}
                x={m.date}
                stroke="#f59e0b"
                strokeDasharray="2 3"
                strokeOpacity={0.45}
              />
            ))}
            {earningsMarkers.map(m => (
              <ReferenceDot
                key={`s-${m.date}`}
                x={m.date}
                y={m.price}
                r={5}
                fill="#f59e0b"
                stroke="var(--bg-secondary)"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!earningsAvailable ? (
        <p className="text-xs px-2 py-3" style={{ color: 'var(--text-muted)' }}>
          Yahoo did not return earnings history for this ticker, so we can&apos;t bucket returns by fiscal quarter here.
        </p>
      ) : buckets.length === 0 ? (
        <p className="text-xs px-2 py-3" style={{ color: 'var(--text-muted)' }}>
          No earnings dates fall within the current price window. Try a longer time range.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <Th align="left">Period</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>High</Th>
                <Th>Low</Th>
                <Th>Δ $</Th>
                <Th>Δ %</Th>
              </tr>
            </thead>
            <tbody>
              {buckets.slice().reverse().map((b, i, arr) => {
                const positive = b.change >= 0;
                const color = positive ? '#22c55e' : '#ef4444';
                return (
                  <tr
                    key={b.key}
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : undefined }}
                  >
                    <Td align="left" bold muted={b.isInProgress}>
                      {b.label}
                      <span className="ml-2 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {b.startDate} → {b.endDate}
                      </span>
                    </Td>
                    <Td>{fmt(b.open)}</Td>
                    <Td>{fmt(b.close)}</Td>
                    <Td>{fmt(b.high)}</Td>
                    <Td>{fmt(b.low)}</Td>
                    <Td color={color}>{fmtSigned(b.change)}</Td>
                    <Td color={color} bold>{fmtPct(b.changePct)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className="py-2 px-3 font-medium uppercase tracking-wider text-[10px]"
      style={{ color: 'var(--text-muted)', textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'right',
  bold,
  color,
  muted,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  bold?: boolean;
  color?: string;
  muted?: boolean;
}) {
  return (
    <td
      className="py-1.5 px-3 tabular-nums"
      style={{
        textAlign: align,
        color: color ?? (muted ? 'var(--text-muted)' : bold ? 'var(--text-primary)' : 'var(--text-secondary)'),
        fontWeight: bold ? 600 : 400,
      }}
    >
      {children}
    </td>
  );
}
