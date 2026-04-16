// Financial ratio computation

import { NormalizedPeriod, ComputedRatios } from './types';

function roundSafe(v: number | null, d: number): number | null {
  return v == null ? null : Math.round(v * 10 ** d) / 10 ** d;
}

export function computeRatios(periods: NormalizedPeriod[]): ComputedRatios {
  if (!periods.length) return { currentRatio: null, debtToEquity: null, workingCapital: null, goodwillToAssets: null, intangiblesToAssets: null };

  const items = periods[0].lineItems;

  const currentRatio =
    items.total_current_assets != null && items.total_current_liabilities != null && items.total_current_liabilities !== 0
      ? items.total_current_assets / items.total_current_liabilities
      : null;

  const debtToEquity =
    items.total_liabilities != null && items.total_equity != null && items.total_equity !== 0
      ? items.total_liabilities / items.total_equity
      : null;

  const workingCapital =
    items.total_current_assets != null && items.total_current_liabilities != null
      ? items.total_current_assets - items.total_current_liabilities
      : null;

  const goodwillToAssets =
    items.goodwill != null && items.total_assets != null && items.total_assets !== 0
      ? items.goodwill / items.total_assets
      : null;

  const intangiblesToAssets =
    items.intangible_assets != null && items.total_assets != null && items.total_assets !== 0
      ? items.intangible_assets / items.total_assets
      : null;

  return {
    currentRatio: roundSafe(currentRatio, 3),
    debtToEquity: roundSafe(debtToEquity, 3),
    workingCapital: roundSafe(workingCapital, 2),
    goodwillToAssets: roundSafe(goodwillToAssets, 4),
    intangiblesToAssets: roundSafe(intangiblesToAssets, 4),
  };
}
