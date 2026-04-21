'use client';

import { BalanceSheetResult, FinancialsResult, ExtractionPeriod } from '@/types/balanceSheet';

interface HeadlineBarProps {
  result: BalanceSheetResult;
}

type Tone = 'positive' | 'warning' | 'critical' | 'neutral';

interface Tile {
  label: string;
  value: string;
  sub?: string;
  delta?: { pct: number; good: boolean } | null;
  tone: Tone;
}

const UNIT_SCALE: Record<string, number> = {
  units: 1,
  thousands: 1e3,
  millions: 1e6,
  billions: 1e9,
};

function fmtUsdFromUnit(value: number | null, unit: string, currency: string): string {
  if (value === null) return '—';
  const scale = UNIT_SCALE[unit] ?? 1;
  const abs = Math.abs(value) * scale;
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${currency}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${currency}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${currency}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${currency}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${currency}${abs.toFixed(0)}`;
}

// Financials values are already scaled to millions
function fmtUsdFromMillions(value: number | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}T`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}B`;
  return `${sign}$${abs.toFixed(1)}M`;
}

function deltaPct(curr: number | null | undefined, prev: number | null | undefined): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

function financialsTiles(fin: FinancialsResult): Tile[] {
  const curr = fin.periods[0];
  const tiles: Tile[] = [];

  if (curr?.income.revenue != null) {
    const yoy = fin.incomeRatios.revenueGrowthYoY;
    tiles.push({
      label: 'Revenue',
      value: fmtUsdFromMillions(curr.income.revenue),
      sub: curr.label,
      delta: yoy != null ? { pct: yoy, good: yoy >= 0 } : null,
      tone: yoy == null ? 'neutral' : yoy > 0.1 ? 'positive' : yoy > 0 ? 'neutral' : 'warning',
    });
  }

  if (curr?.income.netIncome != null) {
    const yoy = fin.incomeRatios.netIncomeGrowthYoY;
    const isProfit = curr.income.netIncome > 0;
    tiles.push({
      label: 'Net Income',
      value: fmtUsdFromMillions(curr.income.netIncome),
      sub: curr.label,
      delta: yoy != null ? { pct: yoy, good: yoy >= 0 } : null,
      tone: !isProfit ? 'critical' : yoy != null && yoy >= 0 ? 'positive' : 'warning',
    });
  }

  if (fin.cashFlowRatios.freeCashFlow != null) {
    const fcf = fin.cashFlowRatios.freeCashFlow;
    const yoy = fin.cashFlowRatios.fcfGrowthYoY;
    tiles.push({
      label: 'Free Cash Flow',
      value: fmtUsdFromMillions(fcf),
      sub: curr?.label,
      delta: yoy != null ? { pct: yoy, good: yoy >= 0 } : null,
      tone: fcf < 0 ? 'critical' : yoy != null && yoy >= 0 ? 'positive' : 'neutral',
    });
  }

  return tiles;
}

function balanceSheetTiles(result: BalanceSheetResult, currency: string): Tile[] {
  const { ratios, periods, unit } = result;
  const curr = periods[0] as ExtractionPeriod | undefined;
  const prev = periods[1] as ExtractionPeriod | undefined;
  const tiles: Tile[] = [];

  if (curr?.lineItems.cashAndEquivalents != null) {
    const cash = curr.lineItems.cashAndEquivalents;
    const yoy = deltaPct(cash, prev?.lineItems.cashAndEquivalents);
    tiles.push({
      label: 'Cash & Equivalents',
      value: fmtUsdFromUnit(cash, unit, currency),
      sub: curr.label,
      delta: yoy != null ? { pct: yoy, good: yoy >= 0 } : null,
      tone: 'neutral',
    });
  }

  if (ratios.currentRatio != null) {
    const v = ratios.currentRatio;
    tiles.push({
      label: 'Current Ratio',
      value: `${v.toFixed(2)}x`,
      sub: 'Liquidity',
      tone: v >= 1.5 ? 'positive' : v >= 1 ? 'neutral' : 'critical',
    });
  }

  if (ratios.debtToEquity != null) {
    const v = ratios.debtToEquity;
    tiles.push({
      label: 'Debt / Equity',
      value: `${v.toFixed(2)}x`,
      sub: 'Leverage',
      tone: v <= 1 ? 'positive' : v <= 2 ? 'neutral' : 'warning',
    });
  }

  return tiles;
}

const toneColor: Record<Tone, string> = {
  positive: 'var(--bs-positive)',
  warning: 'var(--bs-warning)',
  critical: 'var(--bs-critical)',
  neutral: 'var(--text-primary)',
};

function DeltaPill({ pct, good }: { pct: number; good: boolean }) {
  const color = good ? 'var(--bs-positive)' : 'var(--bs-critical)';
  const bg = good ? 'var(--bs-positive-bg)' : 'var(--bs-critical-bg)';
  const arrow = pct >= 0 ? '↑' : '↓';
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
      style={{ color, background: bg }}
    >
      <span>{arrow}</span>
      <span className="tabular-nums">{(Math.abs(pct) * 100).toFixed(1)}%</span>
    </span>
  );
}

export default function HeadlineBar({ result }: HeadlineBarProps) {
  const currencySymbol =
    result.currency === 'USD' ? '$' : result.currency === 'EUR' ? '€' : result.currency === 'GBP' ? '£' : '$';

  const tiles: Tile[] = [
    ...(result.financials ? financialsTiles(result.financials) : []),
    ...balanceSheetTiles(result, currencySymbol),
  ];

  if (!tiles.length) return null;

  return (
    <div className="bs-fade-in" id="bs-headline-bar">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {tiles.map((t, i) => (
          <div
            key={`${t.label}-${i}`}
            className="bs-card flex flex-col gap-1 py-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t.label}
            </p>
            <p
              className="text-lg sm:text-xl font-semibold tabular-nums leading-tight"
              style={{ color: toneColor[t.tone] }}
            >
              {t.value}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {t.delta && <DeltaPill pct={t.delta.pct} good={t.delta.good} />}
              {t.sub && (
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {t.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
