'use client';

import { useMemo } from 'react';
import {
  Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { HistoricalDataPoint } from '@/types/stock';

interface Props {
  historical: HistoricalDataPoint[];
}

interface Quarter {
  key: string;        // "2025-Q1"
  label: string;      // "Q1 2025"
  startDate: string;
  endDate: string;
  open: number;       // first close of the quarter
  close: number;      // last close of the quarter
  high: number;
  low: number;
  change: number;     // close - open
  changePct: number;  // (close - open) / open
}

const fmt = (v: number) => `$${v.toFixed(2)}`;
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
const fmtSigned = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;
const fmtMonth = (d: string) => {
  const [y, m] = d.split('-');
  return `${m}/${y.slice(2)}`;
};

function quarterOf(dateStr: string): { key: string; label: string; q: number; year: number } {
  const [yStr, mStr] = dateStr.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const q = Math.floor((month - 1) / 3) + 1;
  return { key: `${year}-Q${q}`, label: `Q${q} ${year}`, q, year };
}

function buildQuarters(historical: HistoricalDataPoint[]): Quarter[] {
  if (!historical.length) return [];
  const buckets = new Map<string, HistoricalDataPoint[]>();
  for (const bar of historical) {
    const { key } = quarterOf(bar.date);
    const arr = buckets.get(key);
    if (arr) arr.push(bar);
    else buckets.set(key, [bar]);
  }
  const quarters: Quarter[] = [];
  for (const [key, bars] of buckets) {
    bars.sort((a, b) => a.date.localeCompare(b.date));
    const first = bars[0];
    const last = bars[bars.length - 1];
    const high = bars.reduce((m, b) => Math.max(m, b.high), -Infinity);
    const low = bars.reduce((m, b) => Math.min(m, b.low), Infinity);
    const { label } = quarterOf(first.date);
    quarters.push({
      key,
      label,
      startDate: first.date,
      endDate: last.date,
      open: first.close,
      close: last.close,
      high,
      low,
      change: last.close - first.close,
      changePct: first.close > 0 ? (last.close - first.close) / first.close : 0,
    });
  }
  return quarters.sort((a, b) => a.key.localeCompare(b.key));
}

export default function QuarterlyReturnsPanel({ historical }: Props) {
  const chartData = useMemo(
    () => historical.map(b => ({ date: b.date, close: b.close })),
    [historical],
  );

  const quarters = useMemo(() => buildQuarters(historical), [historical]);

  // Vertical line + star marker at the first trading day of each quarter
  // (excluding the very first bar, which already anchors the chart's left edge).
  const quarterMarkers = useMemo(
    () => quarters.slice(1).map(q => ({ date: q.startDate, price: q.open })),
    [quarters],
  );

  if (!historical.length) {
    return (
      <div className="rounded-lg p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No price history available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
          Quarterly Returns
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Close price by calendar quarter · dashed lines = quarter start
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
              formatter={((value: number | undefined) => [fmt(value ?? 0), 'Close']) as any}
            />
            <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={1.5} fill="url(#priceFill)" />
            {quarterMarkers.map(m => (
              <ReferenceLine
                key={`l-${m.date}`}
                x={m.date}
                stroke="#f59e0b"
                strokeDasharray="2 3"
                strokeOpacity={0.45}
              />
            ))}
            {quarterMarkers.map(m => (
              <ReferenceDot
                key={`s-${m.date}`}
                x={m.date}
                y={m.price}
                r={7}
                shape={renderStar}
                ifOverflow="extendDomain"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {quarters.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Not enough history to break into quarters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <Th align="left">Quarter</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>High</Th>
                <Th>Low</Th>
                <Th>Δ $</Th>
                <Th>Δ %</Th>
              </tr>
            </thead>
            <tbody>
              {quarters.slice().reverse().map((q, i, arr) => {
                const positive = q.change >= 0;
                const color = positive ? '#22c55e' : '#ef4444';
                return (
                  <tr
                    key={q.key}
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : undefined }}
                  >
                    <Td align="left" bold>{q.label}</Td>
                    <Td>{fmt(q.open)}</Td>
                    <Td>{fmt(q.close)}</Td>
                    <Td>{fmt(q.high)}</Td>
                    <Td>{fmt(q.low)}</Td>
                    <Td color={color}>{fmtSigned(q.change)}</Td>
                    <Td color={color} bold>{fmtPct(q.changePct)}</Td>
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

/** 5-point star centered at (cx, cy). recharts passes positioning props. */
function renderStar(props: any) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return <g />;
  const outer = 6;
  const inner = outer / 2.5;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return (
    <polygon
      points={points.join(' ')}
      fill="#f59e0b"
      stroke="var(--bg-secondary)"
      strokeWidth={1.25}
    />
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
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  bold?: boolean;
  color?: string;
}) {
  return (
    <td
      className="py-1.5 px-3 tabular-nums"
      style={{
        textAlign: align,
        color: color ?? (bold ? 'var(--text-primary)' : 'var(--text-secondary)'),
        fontWeight: bold ? 600 : 400,
      }}
    >
      {children}
    </td>
  );
}
