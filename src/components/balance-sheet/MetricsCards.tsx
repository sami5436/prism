'use client';

import { BalanceSheetRatios } from '@/types/balanceSheet';
import HealthMeter, { Zone, ZoneTone, activeZone } from './HealthMeter';

interface MetricsCardsProps {
  ratios: BalanceSheetRatios;
  currency?: string;
  unit?: string;
}

type Format = 'ratio' | 'currency' | 'percent';

interface MetricConfig {
  label: string;
  key: keyof BalanceSheetRatios;
  format: Format;
  description: string;
  insight: (value: number, zoneName: string | null) => string;
  meter?: {
    range: [number, number];
    zones: Zone[];
    openHigh?: boolean;
    openLow?: boolean;
  };
}

const METRICS: MetricConfig[] = [
  {
    label: 'Current Ratio',
    key: 'currentRatio',
    format: 'ratio',
    description:
      'Current assets ÷ current liabilities. Above 1× means short-term bills are covered without raising new money.',
    meter: {
      range: [0, 4],
      openHigh: true,
      zones: [
        { from: 0, to: 1, tone: 'danger', name: 'Distress' },
        { from: 1, to: 1.5, tone: 'tight', name: 'Tight' },
        { from: 1.5, to: 3, tone: 'healthy', name: 'Healthy' },
        { from: 3, to: 4, tone: 'conservative', name: 'Cash-heavy' },
      ],
    },
    insight: (v, z) => {
      if (v < 1)
        return `Short-term assets fall ${((1 - v) * 100).toFixed(0)}% short of short-term debts. Bridge financing or asset sales may be needed.`;
      if (z === 'Tight')
        return `Bills are covered, but the buffer is thin — a bad quarter could push this below 1×.`;
      if (z === 'Cash-heavy')
        return `Far more liquidity than needed. Capital is sitting idle instead of being reinvested or returned.`;
      return `Comfortable buffer — current assets cover current liabilities ${v.toFixed(1)}× over.`;
    },
  },
  {
    label: 'Quick Ratio',
    key: 'quickRatio',
    format: 'ratio',
    description:
      'Same as current ratio but excludes inventory — strict test of "could you pay bills with cash and receivables alone?"',
    meter: {
      range: [0, 3],
      openHigh: true,
      zones: [
        { from: 0, to: 0.5, tone: 'danger', name: 'Distress' },
        { from: 0.5, to: 1, tone: 'tight', name: 'Tight' },
        { from: 1, to: 2, tone: 'healthy', name: 'Healthy' },
        { from: 2, to: 3, tone: 'conservative', name: 'Cash-heavy' },
      ],
    },
    insight: (v, z) => {
      if (v < 1)
        return `Without selling inventory, current assets cover only ${(v * 100).toFixed(0)}% of current liabilities — depends on inventory turning quickly.`;
      if (z === 'Cash-heavy')
        return `Plenty of liquid coverage, but very high quick ratios can signal under-investment.`;
      return `Liquid assets alone cover near-term obligations ${v.toFixed(1)}× over.`;
    },
  },
  {
    label: 'Debt / Equity',
    key: 'debtToEquity',
    format: 'ratio',
    description:
      'Total debt ÷ shareholder equity. Says how much of the company is funded by lenders vs owners.',
    meter: {
      range: [0, 3],
      openHigh: true,
      zones: [
        { from: 0, to: 0.3, tone: 'conservative', name: 'Low leverage' },
        { from: 0.3, to: 1, tone: 'healthy', name: 'Moderate' },
        { from: 1, to: 2, tone: 'tight', name: 'Elevated' },
        { from: 2, to: 3, tone: 'danger', name: 'Risky' },
      ],
    },
    insight: (v, z) => {
      if (z === 'Low leverage')
        return `Almost entirely owner-funded. Low risk, but cheap debt financing is being left on the table.`;
      if (z === 'Moderate')
        return `For every $1 of equity, the company owes $${v.toFixed(2)} in debt. A normal capital structure.`;
      if (z === 'Elevated')
        return `For every $1 of equity, the company owes $${v.toFixed(2)} — earnings dips and rate hikes will sting more.`;
      return `Highly levered — $${v.toFixed(2)} of debt per $1 of equity. Distress risk if cash flow weakens.`;
    },
  },
  {
    label: 'Working Capital',
    key: 'workingCapital',
    format: 'currency',
    description:
      'Current assets minus current liabilities — the cash cushion to fund day-to-day operations.',
    insight: v => {
      if (v > 0)
        return `Positive cushion — operations are funded without tapping long-term capital.`;
      return `Negative working capital. Short-term debts exceed liquid assets; cash flow or revolver funds the gap.`;
    },
  },
  {
    label: 'Goodwill / Assets',
    key: 'goodwillToAssets',
    format: 'percent',
    description:
      'Goodwill ÷ total assets. Goodwill is the premium paid in past acquisitions — a "soft" asset that can be written off.',
    meter: {
      range: [0, 0.6],
      openHigh: true,
      zones: [
        { from: 0, to: 0.2, tone: 'healthy', name: 'Low' },
        { from: 0.2, to: 0.4, tone: 'tight', name: 'Elevated' },
        { from: 0.4, to: 0.6, tone: 'danger', name: 'Concentrated' },
      ],
    },
    insight: (v, z) => {
      if (z === 'Low')
        return `Most of the asset base is tangible. Acquisition write-downs would have limited impact on book value.`;
      if (z === 'Elevated')
        return `${(v * 100).toFixed(0)}% of assets are acquisition premium. Underperforming deals could trigger meaningful impairment charges.`;
      return `${(v * 100).toFixed(0)}% of the balance sheet is goodwill. A large impairment is possible if acquired businesses miss expectations.`;
    },
  },
  {
    label: 'Intangibles / Assets',
    key: 'intangiblesToAssets',
    format: 'percent',
    description:
      'Patents, trademarks, capitalised software ÷ total assets. Valuable but hard to liquidate or borrow against.',
    meter: {
      range: [0, 0.6],
      openHigh: true,
      zones: [
        { from: 0, to: 0.2, tone: 'healthy', name: 'Low' },
        { from: 0.2, to: 0.4, tone: 'tight', name: 'Elevated' },
        { from: 0.4, to: 0.6, tone: 'danger', name: 'Concentrated' },
      ],
    },
    insight: (v, z) => {
      if (z === 'Low')
        return `Tangible asset base provides borrowing capacity and a liquidation floor.`;
      if (z === 'Elevated')
        return `${(v * 100).toFixed(0)}% of assets are intangibles. Book value depends on continued IP relevance.`;
      return `${(v * 100).toFixed(0)}% intangible. Book equity is fragile if IP or brand value deteriorates.`;
    },
  },
];

const UNIT_SCALE: Record<string, number> = {
  units: 1,
  thousands: 1e3,
  millions: 1e6,
  billions: 1e9,
};

function formatValue(value: number, format: Format, currency: string, unit: string): string {
  if (format === 'ratio') return `${value.toFixed(2)}x`;
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  const scale = UNIT_SCALE[unit] ?? 1;
  const abs = Math.abs(value) * scale;
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${currency}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${currency}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${currency}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${currency}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${currency}${abs.toFixed(0)}`;
}

const tickFormatters: Record<Format, (v: number) => string> = {
  ratio: v => (Number.isInteger(v) ? `${v}x` : `${v.toFixed(1)}x`),
  percent: v => `${Math.round(v * 100)}%`,
  currency: v => v.toFixed(0),
};

const toneText: Record<ZoneTone, string> = {
  danger: 'var(--bs-critical)',
  tight: 'var(--bs-warning)',
  healthy: 'var(--bs-positive)',
  conservative: 'var(--text-muted)',
};

const toneBg: Record<ZoneTone, string> = {
  danger: 'var(--bs-critical-bg)',
  tight: 'var(--bs-warning-bg)',
  healthy: 'var(--bs-positive-bg)',
  conservative: 'rgba(148, 163, 184, 0.10)',
};

export default function MetricsCards({ ratios, currency = '$', unit = 'units' }: MetricsCardsProps) {
  const available = METRICS.filter(m => ratios[m.key] !== null);
  if (!available.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="bs-metrics-cards">
      {available.map((m, i) => {
        const value = ratios[m.key] as number;
        const zone = m.meter ? activeZone(value, m.meter.zones) : null;

        return (
          <div
            key={m.key}
            className={`bs-card bs-fade-in bs-stagger-${(i % 5) + 1} flex flex-col gap-3`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.label}
                </p>
                <p
                  className="text-xl sm:text-2xl font-semibold tabular-nums mt-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatValue(value, m.format, currency, unit)}
                </p>
              </div>
              {zone && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap"
                  style={{ background: toneBg[zone.tone], color: toneText[zone.tone] }}
                >
                  {zone.name}
                </span>
              )}
            </div>

            {m.meter && (
              <HealthMeter
                value={value}
                range={m.meter.range}
                zones={m.meter.zones}
                formatTick={tickFormatters[m.format]}
                openHigh={m.meter.openHigh}
                openLow={m.meter.openLow}
              />
            )}

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {m.description}
            </p>

            <p
              className="text-xs leading-relaxed pt-2"
              style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}
            >
              {m.insight(value, zone?.name ?? null)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
