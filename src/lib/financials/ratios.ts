// Income-statement + cash-flow ratio computation.
// All ratios are derived strictly from the reported line items.

import type {
  FinancialsPeriod,
  IncomeRatios,
  CashFlowRatios,
} from './types';

function roundSafe(v: number | null, d: number): number | null {
  return v == null ? null : Math.round(v * 10 ** d) / 10 ** d;
}

function safeDiv(n: number | null | undefined, d: number | null | undefined): number | null {
  if (n == null || d == null || d === 0) return null;
  return n / d;
}

function yoy(curr: number | null | undefined, prev: number | null | undefined): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

export function computeIncomeRatios(periods: FinancialsPeriod[]): IncomeRatios {
  if (!periods.length) {
    return {
      grossMargin: null, operatingMargin: null, netMargin: null,
      effectiveTaxRate: null, interestCoverage: null,
      rdIntensity: null, sgaIntensity: null,
      revenueGrowthYoY: null, netIncomeGrowthYoY: null,
      epsGrowthYoY: null, operatingIncomeGrowthYoY: null,
    };
  }

  const curr = periods[0].income;
  const prev = periods[1]?.income;

  const grossMargin = safeDiv(curr.grossProfit, curr.revenue);
  const operatingMargin = safeDiv(curr.operatingIncome, curr.revenue);
  const netMargin = safeDiv(curr.netIncome, curr.revenue);

  // Effective tax rate: tax / pretax income. Approximate pretax = netIncome + tax
  // because the raw pretax concept isn't always present.
  const pretaxIncome =
    curr.netIncome != null && curr.incomeTax != null
      ? curr.netIncome + curr.incomeTax
      : null;
  const effectiveTaxRate = safeDiv(curr.incomeTax, pretaxIncome);

  // Interest coverage (want high). Convention: positive operating income /
  // positive interest expense → multiples of coverage.
  const interestCoverage =
    curr.operatingIncome != null && curr.interestExpense != null && curr.interestExpense !== 0
      ? curr.operatingIncome / Math.abs(curr.interestExpense)
      : null;

  const rdIntensity = safeDiv(curr.researchDevelopment, curr.revenue);
  const sgaIntensity = safeDiv(curr.sellingGeneralAdmin, curr.revenue);

  const revenueGrowthYoY = yoy(curr.revenue, prev?.revenue);
  const netIncomeGrowthYoY = yoy(curr.netIncome, prev?.netIncome);
  const epsGrowthYoY = yoy(curr.epsDiluted ?? curr.epsBasic, prev?.epsDiluted ?? prev?.epsBasic);
  const operatingIncomeGrowthYoY = yoy(curr.operatingIncome, prev?.operatingIncome);

  return {
    grossMargin: roundSafe(grossMargin, 4),
    operatingMargin: roundSafe(operatingMargin, 4),
    netMargin: roundSafe(netMargin, 4),
    effectiveTaxRate: roundSafe(effectiveTaxRate, 4),
    interestCoverage: roundSafe(interestCoverage, 2),
    rdIntensity: roundSafe(rdIntensity, 4),
    sgaIntensity: roundSafe(sgaIntensity, 4),
    revenueGrowthYoY: roundSafe(revenueGrowthYoY, 4),
    netIncomeGrowthYoY: roundSafe(netIncomeGrowthYoY, 4),
    epsGrowthYoY: roundSafe(epsGrowthYoY, 4),
    operatingIncomeGrowthYoY: roundSafe(operatingIncomeGrowthYoY, 4),
  };
}

export function computeCashFlowRatios(periods: FinancialsPeriod[]): CashFlowRatios {
  if (!periods.length) {
    return {
      freeCashFlow: null, fcfMargin: null, earningsQuality: null,
      capexIntensity: null, sbcIntensity: null, fcfGrowthYoY: null,
      dividendCoverage: null, payoutRatio: null,
      buybackOfFcf: null, netShareholderReturn: null,
    };
  }

  const curr = periods[0];
  const prev = periods[1];

  const cfo = curr.cashFlow.operatingCashFlow;
  // CapEx is typically reported as a positive number in PaymentsToAcquire...
  // In some filings it's negative. Always subtract its absolute value.
  const capex = curr.cashFlow.capitalExpenditures;
  const capexAbs = capex != null ? Math.abs(capex) : null;
  const freeCashFlow = cfo != null && capexAbs != null ? cfo - capexAbs : null;

  const fcfMargin = safeDiv(freeCashFlow, curr.income.revenue);

  const earningsQuality = safeDiv(cfo, curr.income.netIncome);

  const capexIntensity = safeDiv(capexAbs, curr.income.revenue);
  const sbcIntensity = safeDiv(curr.cashFlow.stockBasedCompensation, curr.income.revenue);

  let fcfGrowthYoY: number | null = null;
  if (prev) {
    const prevCfo = prev.cashFlow.operatingCashFlow;
    const prevCapexAbs = prev.cashFlow.capitalExpenditures != null
      ? Math.abs(prev.cashFlow.capitalExpenditures) : null;
    const prevFcf = prevCfo != null && prevCapexAbs != null ? prevCfo - prevCapexAbs : null;
    fcfGrowthYoY = yoy(freeCashFlow, prevFcf);
  }

  const dividends = curr.cashFlow.dividendsPaid != null
    ? Math.abs(curr.cashFlow.dividendsPaid) : null;
  const buybacks = curr.cashFlow.buybacks != null
    ? Math.abs(curr.cashFlow.buybacks) : null;

  const dividendCoverage =
    dividends != null && dividends > 0 && freeCashFlow != null
      ? freeCashFlow / dividends
      : null;
  const payoutRatio = dividends != null && curr.income.netIncome != null && curr.income.netIncome > 0
    ? dividends / curr.income.netIncome
    : null;

  const buybackOfFcf =
    buybacks != null && freeCashFlow != null && freeCashFlow > 0
      ? buybacks / freeCashFlow
      : null;

  const totalReturn = (dividends ?? 0) + (buybacks ?? 0);
  const netShareholderReturn =
    totalReturn > 0 && freeCashFlow != null && freeCashFlow > 0
      ? totalReturn / freeCashFlow
      : null;

  return {
    freeCashFlow: roundSafe(freeCashFlow, 2),
    fcfMargin: roundSafe(fcfMargin, 4),
    earningsQuality: roundSafe(earningsQuality, 3),
    capexIntensity: roundSafe(capexIntensity, 4),
    sbcIntensity: roundSafe(sbcIntensity, 4),
    fcfGrowthYoY: roundSafe(fcfGrowthYoY, 4),
    dividendCoverage: roundSafe(dividendCoverage, 2),
    payoutRatio: roundSafe(payoutRatio, 4),
    buybackOfFcf: roundSafe(buybackOfFcf, 4),
    netShareholderReturn: roundSafe(netShareholderReturn, 4),
  };
}
