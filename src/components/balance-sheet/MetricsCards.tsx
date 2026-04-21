'use client';

import { BalanceSheetRatios } from '@/types/balanceSheet';

interface MetricsCardsProps {
  ratios: BalanceSheetRatios;
  currency?: string;
  unit?: string;
}

interface MetricConfig {
  label: string;
  key: keyof BalanceSheetRatios;
  format: 'ratio' | 'currency' | 'percent';
  description: string;
  thresholds?: {
    good: [number, number];
    warn: [number, number];
  };
  insight: (value: number, status: string) => string;
}

const METRICS: MetricConfig[] = [
  {
    label: 'Current Ratio',
    key: 'currentRatio',
    format: 'ratio',
    description: 'Current assets ÷ current liabilities — measures ability to cover short-term obligations.',
    thresholds: { good: [1.2, 3], warn: [0.8, 1.2] },
    insight: (v, status) => {
      if (status === 'positive') return `For every $1 owed short-term, the company holds $${v.toFixed(2)} in liquid assets. Comfortable buffer.`;
      if (status === 'warning') return `Tight but manageable — short-term assets barely cover near-term obligations. Worth monitoring.`;
      if (v > 3) return `Very high — could signal idle cash or slow inventory turnover rather than pure strength.`;
      return `Below 1 means current liabilities exceed current assets. Potential near-term liquidity stress.`;
    },
  },
  {
    label: 'Debt / Equity',
    key: 'debtToEquity',
    format: 'ratio',
    description: 'Short-term + long-term debt ÷ shareholders equity — true financial leverage, excludes operating liabilities.',
    thresholds: { good: [0, 1.5], warn: [1.5, 3] },
    insight: (v, status) => {
      if (v === 0) return `No interest-bearing debt reported. Capital structure is all-equity on the financial-debt side.`;
      if (status === 'positive') return `Moderate leverage. Debt is balanced against equity — typical for a healthy capital structure.`;
      if (status === 'warning') return `Elevated debt load relative to equity. Higher interest obligations could pressure earnings.`;
      return `Heavy leverage — debt is more than ${v.toFixed(1)}× equity. Sensitive to rate changes and earnings dips.`;
    },
  },
  {
    label: 'Working Capital',
    key: 'workingCapital',
    format: 'currency',
    description: 'Current assets minus current liabilities — the liquid cushion available for day-to-day operations.',
    thresholds: undefined,
    insight: (v) => {
      if (v > 0) return `Positive working capital means the company can fund operations without tapping long-term capital.`;
      return `Negative working capital — short-term debts exceed liquid assets. May rely on credit lines or cash flow to bridge the gap.`;
    },
  },
  {
    label: 'Goodwill / Assets',
    key: 'goodwillToAssets',
    format: 'percent',
    description: 'Goodwill ÷ total assets — how much of the asset base is acquisition premium, not tangible value.',
    thresholds: { good: [0, 0.2], warn: [0.2, 0.4] },
    insight: (v, status) => {
      if (status === 'positive') return `Low goodwill concentration. Most assets are tangible and easier to value or liquidate.`;
      if (status === 'warning') return `Meaningful goodwill exposure. If acquisitions underperform, impairment charges could hit earnings.`;
      return `High goodwill ratio (${(v * 100).toFixed(0)}% of assets). Impairment risk is elevated — monitor acquisition performance.`;
    },
  },
  {
    label: 'Intangibles / Assets',
    key: 'intangiblesToAssets',
    format: 'percent',
    description: 'Intangible assets (excluding goodwill) ÷ total assets — patents, trademarks, and capitalised software as a share of the balance sheet.',
    thresholds: { good: [0, 0.2], warn: [0.2, 0.4] },
    insight: (v, status) => {
      if (status === 'positive') return `Intangibles are a modest share of assets. Tangible asset base supports borrowing capacity.`;
      if (status === 'warning') return `Notable intangible concentration. Value depends on continued IP relevance and brand strength.`;
      return `Intangibles are ${(v * 100).toFixed(0)}% of assets. Book value may be fragile if IP or brand value deteriorates.`;
    },
  },
];

function getStatus(value: number | null, thresholds?: MetricConfig['thresholds']): 'positive' | 'warning' | 'critical' | 'neutral' {
  if (value === null || !thresholds) return 'neutral';
  const { good, warn } = thresholds;
  if (value >= good[0] && value <= good[1]) return 'positive';
  if (value >= warn[0] && value <= warn[1]) return 'warning';
  return 'critical';
}

const UNIT_SCALE: Record<string, number> = {
  units: 1,
  thousands: 1e3,
  millions: 1e6,
  billions: 1e9,
};

function formatValue(value: number | null, format: string, currency: string, unit: string): string {
  if (value === null) return '—';
  switch (format) {
    case 'ratio':
      return value.toFixed(2) + 'x';
    case 'percent':
      return (value * 100).toFixed(1) + '%';
    case 'currency': {
      const scale = UNIT_SCALE[unit] ?? 1;
      const absUsd = Math.abs(value) * scale;
      const sign = value < 0 ? '-' : '';
      if (absUsd >= 1e12) return `${sign}${currency}${(absUsd / 1e12).toFixed(2)}T`;
      if (absUsd >= 1e9) return `${sign}${currency}${(absUsd / 1e9).toFixed(2)}B`;
      if (absUsd >= 1e6) return `${sign}${currency}${(absUsd / 1e6).toFixed(1)}M`;
      if (absUsd >= 1e3) return `${sign}${currency}${(absUsd / 1e3).toFixed(0)}K`;
      return `${sign}${currency}${absUsd.toFixed(0)}`;
    }
    default:
      return String(value);
  }
}

const statusColors: Record<string, string> = {
  positive: 'var(--bs-positive)',
  warning: 'var(--bs-warning)',
  critical: 'var(--bs-critical)',
  neutral: 'var(--text-secondary)',
};

export default function MetricsCards({ ratios, currency = '$', unit = 'units' }: MetricsCardsProps) {
  const availableMetrics = METRICS.filter(m => ratios[m.key] !== null);

  if (availableMetrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="bs-metrics-cards">
      {availableMetrics.map((metric, i) => {
        const value = ratios[metric.key];
        const status = getStatus(value, metric.thresholds);

        return (
          <div
            key={metric.key}
            className={`bs-card bs-fade-in bs-stagger-${i + 1} flex flex-col gap-2`}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {metric.label}
            </p>

            <p className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: statusColors[status] }}>
              {formatValue(value, metric.format, currency, unit)}
            </p>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {metric.description}
            </p>

            {value !== null && (
              <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
                {metric.insight(value, status)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
