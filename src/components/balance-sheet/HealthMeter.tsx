'use client';

export type ZoneTone = 'danger' | 'tight' | 'healthy' | 'conservative';

export interface Zone {
  from: number;
  to: number;
  tone: ZoneTone;
  name: string;
}

interface HealthMeterProps {
  value: number;
  range: [number, number];
  zones: Zone[];
  formatTick: (v: number) => string;
  openHigh?: boolean;
  openLow?: boolean;
}

const toneBg: Record<ZoneTone, string> = {
  danger: 'rgba(248, 113, 113, 0.40)',
  tight: 'rgba(251, 191, 36, 0.40)',
  healthy: 'rgba(52, 211, 153, 0.40)',
  conservative: 'rgba(148, 163, 184, 0.20)',
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pct = (v: number, [min, max]: [number, number]) =>
  max === min ? 0 : ((clamp(v, min, max) - min) / (max - min)) * 100;

export function activeZone(value: number, zones: Zone[]): Zone | null {
  for (const z of zones) {
    if (value >= z.from && value <= z.to) return z;
  }
  if (zones.length && value < zones[0].from) return zones[0];
  if (zones.length && value > zones[zones.length - 1].to) return zones[zones.length - 1];
  return null;
}

export default function HealthMeter({
  value,
  range,
  zones,
  formatTick,
  openHigh,
  openLow,
}: HealthMeterProps) {
  const [min, max] = range;
  const span = Math.max(1e-9, max - min);
  const markerLeft = pct(value, range);

  const interiorTicks = Array.from(new Set(zones.flatMap(z => [z.from, z.to])))
    .filter(t => t > min + span * 0.03 && t < max - span * 0.03)
    .sort((a, b) => a - b);

  return (
    <div className="w-full select-none">
      <div className="relative h-2 rounded-full" style={{ background: 'var(--border-color)' }}>
        {zones.map((z, i) => {
          const fromC = clamp(z.from, min, max);
          const toC = clamp(z.to, min, max);
          if (toC <= fromC) return null;
          const left = ((fromC - min) / span) * 100;
          const width = ((toC - fromC) / span) * 100;
          const isFirst = i === 0;
          const isLast = i === zones.length - 1;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: toneBg[z.tone],
                borderTopLeftRadius: isFirst ? 9999 : 0,
                borderBottomLeftRadius: isFirst ? 9999 : 0,
                borderTopRightRadius: isLast ? 9999 : 0,
                borderBottomRightRadius: isLast ? 9999 : 0,
              }}
            />
          );
        })}
        {interiorTicks.map((t, i) => (
          <div
            key={`tick-${i}`}
            className="absolute top-0 bottom-0 w-px opacity-50"
            style={{ left: `${pct(t, range)}%`, background: 'var(--bs-card-bg)' }}
          />
        ))}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${markerLeft}%`,
            width: 12,
            height: 12,
            background: 'var(--text-primary)',
            border: '2px solid var(--bs-card-bg)',
            boxShadow: '0 0 0 1px var(--text-primary)',
          }}
        />
      </div>

      <div
        className="relative h-4 mt-1.5 text-[10px] tabular-nums"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="absolute left-0">
          {openLow ? '≤' : ''}
          {formatTick(min)}
        </span>
        {interiorTicks.map((t, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${pct(t, range)}%` }}
          >
            {formatTick(t)}
          </span>
        ))}
        <span className="absolute right-0">
          {formatTick(max)}
          {openHigh ? '+' : ''}
        </span>
      </div>
    </div>
  );
}
