'use client';

import { IncomeRatios, CashFlowRatios } from '@/types/balanceSheet';

interface FinancialsMetricsCardsProps {
  income: IncomeRatios;
  cashFlow: CashFlowRatios;
}

type Status = 'positive' | 'warning' | 'critical' | 'neutral';

interface MetricConfig {
  label: string;
  value: number | null;
  format: 'percent' | 'ratio' | 'currency_mm';
  description: string;
  thresholds?: { good: [number, number]; warn: [number, number] };
  insight: (v: number, status: Status) => string;
}

function fmt(value: number | null, format: MetricConfig['format']): string {
  if (value === null) return '—';
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (format === 'ratio') return `${value.toFixed(2)}x`;
  // currency_mm: value is already in millions
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}T`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}B`;
  return `${sign}$${abs.toFixed(1)}M`;
}

function getStatus(v: number | null, t?: MetricConfig['thresholds']): Status {
  if (v === null || !t) return 'neutral';
  if (v >= t.good[0] && v <= t.good[1]) return 'positive';
  if (v >= t.warn[0] && v <= t.warn[1]) return 'warning';
  return 'critical';
}

const statusColors: Record<Status, string> = {
  positive: 'var(--bs-positive)',
  warning: 'var(--bs-warning)',
  critical: 'var(--bs-critical)',
  neutral: 'var(--text-secondary)',
};

function buildMetrics(income: IncomeRatios, cashFlow: CashFlowRatios): MetricConfig[] {
  return [
    {
      label: 'Gross Margin',
      value: income.grossMargin,
      format: 'percent',
      description: 'Gross profit ÷ revenue — what the company keeps after direct costs of production.',
      thresholds: { good: [0.4, 1], warn: [0.2, 0.4] },
      insight: (v, s) => {
        if (s === 'positive') return `Strong unit economics — ${(v * 100).toFixed(0)}¢ of every $1 in revenue is left after direct costs. Pricing power or low marginal cost.`;
        if (s === 'warning') return `Moderate gross margin. Operations need to stay lean to produce positive operating income.`;
        if (v <= 0) return `Revenue doesn't cover direct cost of delivering it. Unit economics are broken at current scale.`;
        return `Thin gross margin. Small cost moves hit the bottom line hard.`;
      },
    },
    {
      label: 'Operating Margin',
      value: income.operatingMargin,
      format: 'percent',
      description: 'Operating income ÷ revenue — profitability of the core business before interest and taxes.',
      thresholds: { good: [0.15, 1], warn: [0, 0.15] },
      insight: (v, s) => {
        if (s === 'positive') return `The core business converts ${(v * 100).toFixed(0)}¢ of every revenue dollar into operating profit. Efficient.`;
        if (s === 'warning') return `Positive but modest — leaves little room for interest and tax before net income turns red.`;
        return `Operating losses. OpEx is running ahead of gross profit.`;
      },
    },
    {
      label: 'Net Margin',
      value: income.netMargin,
      format: 'percent',
      description: 'Net income ÷ revenue — bottom-line profitability after everything (interest, taxes, one-offs).',
      thresholds: { good: [0.1, 1], warn: [0, 0.1] },
      insight: (v, s) => {
        if (s === 'positive') return `Strong net profit conversion. Each revenue dollar drops ${(v * 100).toFixed(0)}¢ to the bottom line.`;
        if (s === 'warning') return `Net positive but a thin cushion — sensitive to tax or interest swings.`;
        return `Net losses. Either operating income is negative or interest/tax is eating it up.`;
      },
    },
    {
      label: 'Revenue Growth YoY',
      value: income.revenueGrowthYoY,
      format: 'percent',
      description: 'Year-over-year change in revenue — the top-line trajectory.',
      thresholds: { good: [0.1, 10], warn: [0, 0.1] },
      insight: (v, s) => {
        if (s === 'positive') return `Growing ${(v * 100).toFixed(1)}% — double-digit top-line expansion is the raw material for compounding.`;
        if (s === 'warning') return `Positive but slow. Margin expansion or capital return has to do the heavy lifting.`;
        return `Revenue is declining. Operating leverage works in reverse — margins compress unless costs fall faster.`;
      },
    },
    {
      label: 'Free Cash Flow',
      value: cashFlow.freeCashFlow,
      format: 'currency_mm',
      description: 'Operating cash flow minus capital expenditures — cash left over for debt paydown, dividends, or buybacks.',
      insight: (v) => {
        if (v > 0) return `Generates ${fmt(v, 'currency_mm')} of cash after reinvesting in the business. Real optionality — can pay debt, return capital, or build cash.`;
        return `Burning cash after CapEx. Growth is being funded by balance-sheet capital, not operations.`;
      },
    },
    {
      label: 'FCF Margin',
      value: cashFlow.fcfMargin,
      format: 'percent',
      description: 'Free cash flow ÷ revenue — how much of every revenue dollar survives as distributable cash.',
      thresholds: { good: [0.15, 1], warn: [0, 0.15] },
      insight: (v, s) => {
        if (s === 'positive') return `${(v * 100).toFixed(0)}% of revenue converts to free cash. Quality compounding machine.`;
        if (s === 'warning') return `Positive FCF but capital-intensive — CapEx is eating a large share of operating cash.`;
        return `Revenue doesn't translate to free cash after CapEx. Capital-heavy or still-investing phase.`;
      },
    },
    {
      label: 'CFO / Net Income',
      value: cashFlow.earningsQuality,
      format: 'ratio',
      description: 'Operating cash flow ÷ net income — quality-of-earnings gauge. Accruals-heavy reporting drags this below 1.',
      thresholds: { good: [1, 5], warn: [0.6, 1] },
      insight: (v, s) => {
        if (s === 'positive') return `Reported earnings are backed by real cash. ${v.toFixed(2)}× means the P&L isn't relying on accruals to tell the story.`;
        if (s === 'warning') return `Earnings are slightly weaker in cash terms than on paper — worth checking receivables and inventory build.`;
        if (v < 0) return `CFO is negative while net income is positive (or vice versa) — accrual/cash divergence is a red flag.`;
        return `Reported earnings materially exceed operating cash flow. Accrual-heavy — verify receivables and working capital.`;
      },
    },
    {
      label: 'Interest Coverage',
      value: income.interestCoverage,
      format: 'ratio',
      description: 'Operating income ÷ interest expense — how many times over the business covers its interest bill.',
      thresholds: { good: [5, 1000], warn: [2, 5] },
      insight: (v, s) => {
        if (s === 'positive') return `Covers interest ${v.toFixed(1)}× — plenty of cushion against rate shocks or earnings dips.`;
        if (s === 'warning') return `Interest is taking a real share of operating income. Rate shocks or earnings dips would tighten fast.`;
        return `Operating income barely (or fails to) cover interest expense. Distress-adjacent if earnings compress.`;
      },
    },
    {
      label: 'SBC Intensity',
      value: cashFlow.sbcIntensity,
      format: 'percent',
      description: 'Stock-based compensation ÷ revenue — how much the company pays employees in equity (dilution + economic cost).',
      thresholds: { good: [0, 0.05], warn: [0.05, 0.12] },
      insight: (v, s) => {
        if (s === 'positive') return `Modest SBC. Dilution pressure is limited — real GAAP earnings closely match cash earnings.`;
        if (s === 'warning') return `SBC is a meaningful cost (${(v * 100).toFixed(1)}% of revenue). Shares outstanding grow unless buybacks offset.`;
        return `Heavy SBC — ${(v * 100).toFixed(0)}% of revenue paid in stock. Significant dilution unless aggressively bought back.`;
      },
    },
  ];
}

export default function FinancialsMetricsCards({ income, cashFlow }: FinancialsMetricsCardsProps) {
  const metrics = buildMetrics(income, cashFlow).filter(m => m.value !== null);
  if (!metrics.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="fin-metrics-cards">
      {metrics.map((m, i) => {
        const status = getStatus(m.value, m.thresholds);
        return (
          <div key={m.label} className={`bs-card bs-fade-in bs-stagger-${(i % 5) + 1} flex flex-col gap-2`}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {m.label}
            </p>
            <p className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: statusColors[status] }}>
              {fmt(m.value, m.format)}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {m.description}
            </p>
            {m.value !== null && (
              <p
                className="text-xs leading-relaxed pt-1"
                style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}
              >
                {m.insight(m.value, status)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
