// Financial ratio computation — all derived strictly from balance sheet line items.

import { NormalizedPeriod, ComputedRatios } from './types';

function roundSafe(v: number | null, d: number): number | null {
  return v == null ? null : Math.round(v * 10 ** d) / 10 ** d;
}

function safeDiv(n: number | null | undefined, d: number | null | undefined): number | null {
  if (n == null || d == null || d === 0) return null;
  return n / d;
}

export function computeRatios(periods: NormalizedPeriod[]): ComputedRatios {
  if (!periods.length) {
    return {
      currentRatio: null, quickRatio: null, cashRatio: null,
      debtToEquity: null, debtToAssets: null,
      workingCapital: null, workingCapitalToAssets: null,
      goodwillToAssets: null, intangiblesToAssets: null, tangibleEquity: null,
      arShareOfCurrentAssets: null, inventoryShareOfCurrentAssets: null,
      apShareOfCurrentLiab: null, shortTermDebtShareOfDebt: null,
    };
  }

  const i = periods[0].lineItems;

  const currentAssets = i.total_current_assets;
  const currentLiab = i.total_current_liabilities;
  const cash = i.cash_and_equivalents;
  const sti = i.short_term_investments;
  const ar = i.accounts_receivable;
  const inv = i.inventory;
  const ap = i.accounts_payable;
  const std = i.short_term_debt;
  const ltd = i.long_term_debt;
  const totalAssets = i.total_assets;
  const totalLiab = i.total_liabilities;
  const equity = i.total_equity;
  const goodwill = i.goodwill ?? 0;
  const intangibles = i.intangible_assets ?? 0;

  const currentRatio = safeDiv(currentAssets, currentLiab);

  // Quick ratio = (CA - inventory) / CL.  Fallback to cash+sti+ar when CA/inventory missing.
  let quickNum: number | null = null;
  if (currentAssets != null && inv != null) quickNum = currentAssets - inv;
  else if (cash != null || sti != null || ar != null) {
    quickNum = (cash ?? 0) + (sti ?? 0) + (ar ?? 0);
  }
  const quickRatio = safeDiv(quickNum, currentLiab);

  const cashRatio = safeDiv((cash ?? 0) + (sti ?? 0), currentLiab);

  const debtToEquity = safeDiv(totalLiab, equity);
  const debtToAssets = safeDiv(totalLiab, totalAssets);

  const workingCapital =
    currentAssets != null && currentLiab != null ? currentAssets - currentLiab : null;
  const workingCapitalToAssets = safeDiv(workingCapital, totalAssets);

  const goodwillToAssets = safeDiv(goodwill, totalAssets);
  const intangiblesToAssets = safeDiv(goodwill + intangibles, totalAssets);

  const tangibleEquity =
    equity != null ? equity - goodwill - intangibles : null;

  const arShareOfCurrentAssets = safeDiv(ar, currentAssets);
  const inventoryShareOfCurrentAssets = safeDiv(inv, currentAssets);
  const apShareOfCurrentLiab = safeDiv(ap, currentLiab);

  const totalDebt = (std ?? 0) + (ltd ?? 0);
  const shortTermDebtShareOfDebt =
    totalDebt > 0 && std != null ? std / totalDebt : null;

  return {
    currentRatio: roundSafe(currentRatio, 3),
    quickRatio: roundSafe(quickRatio, 3),
    cashRatio: roundSafe(cashRatio, 3),
    debtToEquity: roundSafe(debtToEquity, 3),
    debtToAssets: roundSafe(debtToAssets, 3),
    workingCapital: roundSafe(workingCapital, 2),
    workingCapitalToAssets: roundSafe(workingCapitalToAssets, 4),
    goodwillToAssets: roundSafe(goodwillToAssets, 4),
    intangiblesToAssets: roundSafe(intangiblesToAssets, 4),
    tangibleEquity: roundSafe(tangibleEquity, 2),
    arShareOfCurrentAssets: roundSafe(arShareOfCurrentAssets, 4),
    inventoryShareOfCurrentAssets: roundSafe(inventoryShareOfCurrentAssets, 4),
    apShareOfCurrentLiab: roundSafe(apShareOfCurrentLiab, 4),
    shortTermDebtShareOfDebt: roundSafe(shortTermDebtShareOfDebt, 4),
  };
}
