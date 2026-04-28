'use client';

import { IncomeRatios, CashFlowRatios } from '@/types/balanceSheet';
import HealthMeter, { Zone, ZoneTone, activeZone } from './HealthMeter';

interface FinancialsMetricsCardsProps {
  income: IncomeRatios;
  cashFlow: CashFlowRatios;
}

type Format = 'percent' | 'ratio';

interface MetricConfig {
  label: string;
  value: number | null;
  format: Format;
  description: string;
  insight: (v: number, zoneName: string | null) => string;
  meter?: {
    range: [number, number];
    zones: Zone[];
    openHigh?: boolean;
    openLow?: boolean;
  };
}

function buildMetrics(income: IncomeRatios, cashFlow: CashFlowRatios): MetricConfig[] {
  return [
    {
      label: 'Gross Margin',
      value: income.grossMargin,
      format: 'percent',
      description:
        'Gross profit ÷ revenue — what the company keeps from every dollar of sales after the direct cost of producing it.',
      meter: {
        range: [-0.1, 0.7],
        openHigh: true,
        zones: [
          { from: -0.1, to: 0, tone: 'danger', name: 'Negative' },
          { from: 0, to: 0.2, tone: 'tight', name: 'Thin' },
          { from: 0.2, to: 0.4, tone: 'healthy', name: 'Normal' },
          { from: 0.4, to: 0.7, tone: 'conservative', name: 'Premium' },
        ],
      },
      insight: (v, z) => {
        if (v <= 0)
          return `Revenue doesn't cover direct cost of delivering it. Unit economics are broken at current scale.`;
        if (z === 'Thin')
          return `Only ${(v * 100).toFixed(0)}¢ per revenue dollar survives direct costs. OpEx has to stay tiny to make money.`;
        if (z === 'Premium')
          return `${(v * 100).toFixed(0)}¢ of every $1 stays after direct costs — strong pricing power or low marginal cost.`;
        return `${(v * 100).toFixed(0)}¢ of every $1 stays after direct costs. Healthy unit economics.`;
      },
    },
    {
      label: 'Operating Margin',
      value: income.operatingMargin,
      format: 'percent',
      description:
        'Operating income ÷ revenue — profit from the core business, before interest and taxes.',
      meter: {
        range: [-0.1, 0.4],
        openHigh: true,
        zones: [
          { from: -0.1, to: 0, tone: 'danger', name: 'Loss' },
          { from: 0, to: 0.15, tone: 'tight', name: 'Thin' },
          { from: 0.15, to: 0.4, tone: 'healthy', name: 'Strong' },
        ],
      },
      insight: (v, z) => {
        if (v < 0)
          return `Operating losses. Operating expenses are running ahead of gross profit.`;
        if (z === 'Thin')
          return `Positive but modest — leaves little room for interest and tax before net income turns red.`;
        return `Core business converts ${(v * 100).toFixed(0)}¢ of every revenue dollar into operating profit. Efficient.`;
      },
    },
    {
      label: 'Net Margin',
      value: income.netMargin,
      format: 'percent',
      description:
        'Net income ÷ revenue — bottom-line profit after everything (interest, taxes, one-offs).',
      meter: {
        range: [-0.1, 0.4],
        openHigh: true,
        zones: [
          { from: -0.1, to: 0, tone: 'danger', name: 'Loss' },
          { from: 0, to: 0.1, tone: 'tight', name: 'Thin' },
          { from: 0.1, to: 0.4, tone: 'healthy', name: 'Strong' },
        ],
      },
      insight: (v, z) => {
        if (v < 0)
          return `Net losses. Either operating income is negative or interest and tax are eating it up.`;
        if (z === 'Thin')
          return `Net positive but a thin cushion — sensitive to tax or interest swings.`;
        return `Each revenue dollar drops ${(v * 100).toFixed(0)}¢ to the bottom line.`;
      },
    },
    {
      label: 'FCF Margin',
      value: cashFlow.fcfMargin,
      format: 'percent',
      description:
        'Free cash flow ÷ revenue — how much of every revenue dollar survives as actual cash after capital spending.',
      meter: {
        range: [-0.1, 0.4],
        openHigh: true,
        zones: [
          { from: -0.1, to: 0, tone: 'danger', name: 'Cash burn' },
          { from: 0, to: 0.15, tone: 'tight', name: 'Thin' },
          { from: 0.15, to: 0.4, tone: 'healthy', name: 'Strong' },
        ],
      },
      insight: (v, z) => {
        if (v < 0)
          return `Revenue doesn't translate to free cash after CapEx. Capital-heavy or still in an investment phase.`;
        if (z === 'Thin')
          return `Positive FCF but capital-intensive — CapEx is eating a large share of operating cash.`;
        return `${(v * 100).toFixed(0)}% of revenue converts to free cash. Quality compounding machine.`;
      },
    },
    {
      label: 'CFO / Net Income',
      value: cashFlow.earningsQuality,
      format: 'ratio',
      description:
        'Operating cash flow ÷ net income — earnings-quality gauge. Below 1× means reported profit relies on accruals more than cash.',
      meter: {
        range: [0, 3],
        openHigh: true,
        zones: [
          { from: 0, to: 0.6, tone: 'danger', name: 'Accrual-heavy' },
          { from: 0.6, to: 1, tone: 'tight', name: 'Watch' },
          { from: 1, to: 2, tone: 'healthy', name: 'Cash-backed' },
          { from: 2, to: 3, tone: 'conservative', name: 'Unusual' },
        ],
      },
      insight: (v, z) => {
        if (v < 0)
          return `Operating cash flow and net income disagree on sign — major accrual/cash divergence is a red flag.`;
        if (z === 'Accrual-heavy')
          return `Reported earnings are weakly backed by cash. Verify receivables and inventory build.`;
        if (z === 'Watch')
          return `Earnings are slightly weaker in cash terms than on paper — worth checking working capital.`;
        if (z === 'Unusual')
          return `Operating cash runs far ahead of reported earnings. Often good, but check for one-off boosts.`;
        return `Reported earnings are backed by real cash. The P&L isn't relying on accruals to tell the story.`;
      },
    },
    {
      label: 'Interest Coverage',
      value: income.interestCoverage,
      format: 'ratio',
      description:
        'Operating income ÷ interest expense — how many times over the business covers its annual interest bill.',
      meter: {
        range: [0, 20],
        openHigh: true,
        zones: [
          { from: 0, to: 1.5, tone: 'danger', name: 'Stress' },
          { from: 1.5, to: 3, tone: 'tight', name: 'Watch' },
          { from: 3, to: 10, tone: 'healthy', name: 'Comfortable' },
          { from: 10, to: 20, tone: 'conservative', name: 'Fortress' },
        ],
      },
      insight: (v, z) => {
        if (v < 1.5)
          return `Operating income barely covers interest. Distress-adjacent if earnings compress further.`;
        if (z === 'Watch')
          return `Interest is taking a real share of operating income. Rate or earnings shocks would tighten fast.`;
        if (z === 'Fortress')
          return `Covers interest ${v.toFixed(0)}× — debt service is a non-issue at current earnings.`;
        return `Covers interest ${v.toFixed(1)}× — plenty of cushion against rate shocks or earnings dips.`;
      },
    },
    {
      label: 'SBC Intensity',
      value: cashFlow.sbcIntensity,
      format: 'percent',
      description:
        'Stock-based compensation ÷ revenue — how much the company pays employees in equity (real cost, real dilution).',
      meter: {
        range: [0, 0.2],
        openHigh: true,
        zones: [
          { from: 0, to: 0.05, tone: 'healthy', name: 'Modest' },
          { from: 0.05, to: 0.12, tone: 'tight', name: 'Material' },
          { from: 0.12, to: 0.2, tone: 'danger', name: 'Heavy' },
        ],
      },
      insight: (v, z) => {
        if (z === 'Modest')
          return `Limited dilution pressure — GAAP earnings closely match cash earnings.`;
        if (z === 'Material')
          return `SBC is a meaningful cost (${(v * 100).toFixed(1)}% of revenue). Shares outstanding grow unless buybacks offset.`;
        return `Heavy SBC — ${(v * 100).toFixed(0)}% of revenue paid in stock. Significant dilution unless aggressively bought back.`;
      },
    },
  ];
}

const tickFormatters: Record<Format, (v: number) => string> = {
  ratio: v => (Number.isInteger(v) ? `${v}x` : `${v.toFixed(1)}x`),
  percent: v => `${Math.round(v * 100)}%`,
};

function fmt(value: number, format: Format): string {
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  return `${value.toFixed(2)}x`;
}

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

export default function FinancialsMetricsCards({ income, cashFlow }: FinancialsMetricsCardsProps) {
  const metrics = buildMetrics(income, cashFlow).filter(m => m.value !== null);
  if (!metrics.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="fin-metrics-cards">
      {metrics.map((m, i) => {
        const value = m.value as number;
        const zone = m.meter ? activeZone(value, m.meter.zones) : null;

        return (
          <div
            key={m.label}
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
                  {fmt(value, m.format)}
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
