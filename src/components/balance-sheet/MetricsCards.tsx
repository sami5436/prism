'use client';

import { BalanceSheetRatios } from '@/types/balanceSheet';

interface MetricsCardsProps {
  ratios: BalanceSheetRatios;
  currency?: string;
}

interface MetricConfig {
  label: string;
  key: keyof BalanceSheetRatios;
  format: 'ratio' | 'currency' | 'percent';
  thresholds?: {
    good: [number, number];
    warn: [number, number];
  };
}

const METRICS: MetricConfig[] = [
  {
    label: 'Current Ratio',
    key: 'currentRatio',
    format: 'ratio',
    thresholds: { good: [1.2, 3], warn: [0.8, 1.2] },
  },
  {
    label: 'Debt / Equity',
    key: 'debtToEquity',
    format: 'ratio',
    thresholds: { good: [0, 1.5], warn: [1.5, 3] },
  },
  {
    label: 'Working Capital',
    key: 'workingCapital',
    format: 'currency',
  },
  {
    label: 'Goodwill / Assets',
    key: 'goodwillToAssets',
    format: 'percent',
    thresholds: { good: [0, 0.2], warn: [0.2, 0.4] },
  },
  {
    label: 'Intangibles / Assets',
    key: 'intangiblesToAssets',
    format: 'percent',
    thresholds: { good: [0, 0.3], warn: [0.3, 0.5] },
  },
];

function getStatus(value: number | null, thresholds?: MetricConfig['thresholds']): 'positive' | 'warning' | 'critical' | 'neutral' {
  if (value === null || !thresholds) return 'neutral';
  const { good, warn } = thresholds;
  if (value >= good[0] && value <= good[1]) return 'positive';
  if (value >= warn[0] && value <= warn[1]) return 'warning';
  return 'critical';
}

function formatValue(value: number | null, format: string, currency: string): string {
  if (value === null) return '—';
  switch (format) {
    case 'ratio':
      return value.toFixed(2) + 'x';
    case 'percent':
      return (value * 100).toFixed(1) + '%';
    case 'currency': {
      const abs = Math.abs(value);
      const sign = value < 0 ? '-' : '';
      if (abs >= 1e9) return `${sign}${currency}${(abs / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${sign}${currency}${(abs / 1e6).toFixed(1)}M`;
      if (abs >= 1e3) return `${sign}${currency}${(abs / 1e3).toFixed(0)}K`;
      return `${sign}${currency}${abs.toFixed(0)}`;
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

export default function MetricsCards({ ratios, currency = '$' }: MetricsCardsProps) {
  const availableMetrics = METRICS.filter(m => ratios[m.key] !== null);

  if (availableMetrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="bs-metrics-cards">
      {availableMetrics.map((metric, i) => {
        const value = ratios[metric.key];
        const status = getStatus(value, metric.thresholds);

        return (
          <div
            key={metric.key}
            className={`bs-card bs-fade-in bs-stagger-${i + 1}`}
          >
            <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {metric.label}
            </p>
            <p className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: statusColors[status] }}>
              {formatValue(value, metric.format, currency)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
