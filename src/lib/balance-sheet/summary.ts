// Template-based summary and flag generation

import { NormalizedPeriod, ComputedRatios, AnalysisFlag, AnalysisSummaryResult } from './types';

function fmt(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function detectYoYChanges(current: NormalizedPeriod, previous: NormalizedPeriod): AnalysisFlag[] {
  const flags: AnalysisFlag[] = [];
  const checks: [string, string][] = [
    ['total_assets', 'Total Assets'],
    ['total_liabilities', 'Total Liabilities'],
    ['total_equity', 'Total Equity'],
    ['long_term_debt', 'Long-term Debt'],
    ['cash_and_equivalents', 'Cash & Equivalents'],
    ['total_current_assets', 'Current Assets'],
    ['total_current_liabilities', 'Current Liabilities'],
  ];

  for (const [key, display] of checks) {
    const curr = current.lineItems[key];
    const prev = previous.lineItems[key];
    if (curr == null || prev == null || prev === 0) continue;
    const pct = ((curr - prev) / Math.abs(prev)) * 100;
    if (Math.abs(pct) > 30) {
      flags.push({
        id: `yoy_${key}`,
        label: `Large YoY Change: ${display}`,
        description: `${display} ${pct > 0 ? 'increased' : 'decreased'} by ${Math.abs(pct).toFixed(1)}% from ${previous.label} to ${current.label}.`,
        severity: Math.abs(pct) > 50 ? 'warning' : 'info',
        metric: key,
        value: Math.round(pct * 10) / 10,
      });
    }
  }
  return flags;
}

export function generateSummary(periods: NormalizedPeriod[], ratios: ComputedRatios): AnalysisSummaryResult {
  if (!periods.length) {
    return { overview: 'No balance sheet data was extracted.', ratioNotes: [], flags: [] };
  }

  const items = periods[0].lineItems;
  const flags: AnalysisFlag[] = [];
  const ratioNotes: string[] = [];

  // Overview
  const parts: string[] = [];
  if (items.total_assets != null) parts.push(`total assets of ${fmt(items.total_assets)}`);
  if (items.total_liabilities != null) parts.push(`total liabilities of ${fmt(items.total_liabilities)}`);
  if (items.total_equity != null) parts.push(`total equity of ${fmt(items.total_equity)}`);
  const overview = parts.length
    ? 'The balance sheet shows ' + parts.join(', ') + '.'
    : 'Balance sheet data was partially extracted. Some fields may be missing.';

  // Current ratio
  if (ratios.currentRatio != null) {
    if (ratios.currentRatio >= 2) ratioNotes.push(`Current ratio of ${ratios.currentRatio.toFixed(2)}x indicates strong short-term liquidity.`);
    else if (ratios.currentRatio >= 1) ratioNotes.push(`Current ratio of ${ratios.currentRatio.toFixed(2)}x indicates adequate short-term liquidity.`);
    else {
      ratioNotes.push(`Current ratio of ${ratios.currentRatio.toFixed(2)}x is below 1.0 — current liabilities exceed current assets.`);
      flags.push({ id: 'low_current_ratio', label: 'Low Current Ratio', description: 'Current liabilities exceed current assets, which may indicate short-term liquidity pressure.', severity: 'warning', metric: 'current_ratio', value: ratios.currentRatio });
    }
  }

  // D/E
  if (ratios.debtToEquity != null) {
    if (ratios.debtToEquity > 3) {
      ratioNotes.push(`Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x is very high — the company is heavily leveraged.`);
      flags.push({ id: 'high_leverage', label: 'High Leverage', description: `Debt-to-equity ratio of ${ratios.debtToEquity.toFixed(2)}x significantly exceeds 2.0x.`, severity: 'critical', metric: 'debt_to_equity', value: ratios.debtToEquity });
    } else if (ratios.debtToEquity > 1.5) {
      ratioNotes.push(`Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x is elevated.`);
      flags.push({ id: 'elevated_leverage', label: 'Elevated Leverage', description: `Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x is above the 1.5x threshold.`, severity: 'warning', metric: 'debt_to_equity', value: ratios.debtToEquity });
    } else if (ratios.debtToEquity < 0) {
      ratioNotes.push(`Negative debt-to-equity (${ratios.debtToEquity.toFixed(2)}x) — indicates negative equity.`);
      flags.push({ id: 'negative_equity', label: 'Negative Equity', description: 'Total equity is negative.', severity: 'critical', metric: 'debt_to_equity', value: ratios.debtToEquity });
    } else {
      ratioNotes.push(`Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x is within a moderate range.`);
    }
  }

  // Working capital
  if (ratios.workingCapital != null && ratios.workingCapital < 0) {
    flags.push({ id: 'negative_working_capital', label: 'Negative Working Capital', description: `Working capital is ${fmt(ratios.workingCapital)}.`, severity: 'warning', metric: 'working_capital', value: ratios.workingCapital });
  }

  // Goodwill
  if (ratios.goodwillToAssets != null && ratios.goodwillToAssets > 0.3) {
    flags.push({ id: 'high_goodwill', label: 'High Goodwill Share', description: `Goodwill represents ${(ratios.goodwillToAssets * 100).toFixed(1)}% of total assets.`, severity: ratios.goodwillToAssets > 0.4 ? 'warning' : 'info', metric: 'goodwill_to_assets', value: ratios.goodwillToAssets });
  }

  // Intangibles
  if (ratios.intangiblesToAssets != null && ratios.intangiblesToAssets > 0.3) {
    flags.push({ id: 'high_intangibles', label: 'High Intangibles Share', description: `Intangible assets represent ${(ratios.intangiblesToAssets * 100).toFixed(1)}% of total assets.`, severity: 'info', metric: 'intangibles_to_assets', value: ratios.intangiblesToAssets });
  }

  // YoY
  if (periods.length >= 2) flags.push(...detectYoYChanges(periods[0], periods[1]));

  if (!flags.length) {
    flags.push({ id: 'no_issues', label: 'No Notable Issues', description: 'No significant red flags detected based on available data.', severity: 'info' });
  }

  return { overview, ratioNotes, flags };
}
