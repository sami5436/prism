// Ties EDGAR extraction, ratio computation, and SWOT summary into a single
// FinancialsResult. Mirrors the balance-sheet pipeline's shape.

import type { CompanyFacts } from './edgarApi';
import { companyFactsToFinancialsPeriods } from './edgarApi';
import { computeIncomeRatios, computeCashFlowRatios } from './ratios';
import { generateFinancialsSummary } from './summary';
import type { FinancialsResult } from './types';

export function buildFinancialsResult(
  facts: CompanyFacts,
  opts: { preferAnnual?: boolean; maxPeriods?: number } = {},
): FinancialsResult {
  const preferAnnual = opts.preferAnnual ?? true;
  const maxPeriods = opts.maxPeriods ?? 4;

  const { periods, formType, isAnnual } = companyFactsToFinancialsPeriods(
    facts,
    preferAnnual,
    maxPeriods,
  );

  const incomeRatios = computeIncomeRatios(periods);
  const cashFlowRatios = computeCashFlowRatios(periods);
  const summary = generateFinancialsSummary(periods, incomeRatios, cashFlowRatios);

  return {
    companyName: facts.entityName ?? null,
    formType,
    currency: 'USD',
    unit: 'millions',
    isAnnual,
    periods,
    incomeRatios,
    cashFlowRatios,
    summary,
  };
}
