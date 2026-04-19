// EDGAR extraction for income statement + cash flow facts.
//
// Balance sheet facts are *instant* (single date); income/cash-flow facts are
// *duration* (start → end). We group by fiscal period (fp = "FY" or "Qn") + fy.

import { memoize } from '../cache';
import type {
  FinancialsPeriod,
  IncomeStatementItems,
  CashFlowItems,
  FormType,
} from './types';

const EDGAR_USER_AGENT = 'Prism Financial Tools sami5436@prism.local';
const EDGAR_FACTS_TTL = 60 * 60 * 1000; // 1h

// Priority-ordered GAAP concept → internal field. First match wins per period.
const INCOME_CONCEPTS: [string, keyof IncomeStatementItems][] = [
  // Revenue
  ['RevenueFromContractWithCustomerExcludingAssessedTax', 'revenue'],
  ['RevenueFromContractWithCustomerIncludingAssessedTax', 'revenue'],
  ['Revenues', 'revenue'],
  ['SalesRevenueNet', 'revenue'],
  // COGS
  ['CostOfRevenue', 'costOfRevenue'],
  ['CostOfGoodsAndServicesSold', 'costOfRevenue'],
  ['CostOfGoodsSold', 'costOfRevenue'],
  // Gross profit
  ['GrossProfit', 'grossProfit'],
  // Operating expense lines
  ['ResearchAndDevelopmentExpense', 'researchDevelopment'],
  ['SellingGeneralAndAdministrativeExpense', 'sellingGeneralAdmin'],
  ['OperatingExpenses', 'operatingExpenses'],
  // Operating income
  ['OperatingIncomeLoss', 'operatingIncome'],
  // Interest
  ['InterestExpense', 'interestExpense'],
  // Tax
  ['IncomeTaxExpenseBenefit', 'incomeTax'],
  // Net income
  ['NetIncomeLoss', 'netIncome'],
  ['ProfitLoss', 'netIncome'],
  // EPS
  ['EarningsPerShareBasic', 'epsBasic'],
  ['EarningsPerShareDiluted', 'epsDiluted'],
  // Shares
  ['WeightedAverageNumberOfSharesOutstandingBasic', 'sharesBasic'],
  ['WeightedAverageNumberOfDilutedSharesOutstanding', 'sharesDiluted'],
];

const CASHFLOW_CONCEPTS: [string, keyof CashFlowItems][] = [
  ['NetCashProvidedByUsedInOperatingActivities', 'operatingCashFlow'],
  ['NetCashProvidedByUsedInOperatingActivitiesContinuingOperations', 'operatingCashFlow'],
  ['NetCashProvidedByUsedInInvestingActivities', 'investingCashFlow'],
  ['NetCashProvidedByUsedInInvestingActivitiesContinuingOperations', 'investingCashFlow'],
  ['NetCashProvidedByUsedInFinancingActivities', 'financingCashFlow'],
  ['NetCashProvidedByUsedInFinancingActivitiesContinuingOperations', 'financingCashFlow'],
  ['PaymentsToAcquirePropertyPlantAndEquipment', 'capitalExpenditures'],
  ['PaymentsToAcquireProductiveAssets', 'capitalExpenditures'],
  ['DepreciationDepletionAndAmortization', 'depreciationAmortization'],
  ['DepreciationAndAmortization', 'depreciationAmortization'],
  ['Depreciation', 'depreciationAmortization'],
  ['ShareBasedCompensation', 'stockBasedCompensation'],
  ['StockBasedCompensation', 'stockBasedCompensation'],
  ['PaymentsForRepurchaseOfCommonStock', 'buybacks'],
  ['PaymentsForRepurchaseOfEquity', 'buybacks'],
  ['PaymentsOfDividendsCommonStock', 'dividendsPaid'],
  ['PaymentsOfDividends', 'dividendsPaid'],
  ['ProceedsFromIssuanceOfLongTermDebt', 'debtIssued'],
  ['ProceedsFromIssuanceOfDebt', 'debtIssued'],
  ['RepaymentsOfLongTermDebt', 'debtRepaid'],
  ['RepaymentsOfDebt', 'debtRepaid'],
];

const BALANCE_SHEET_FORMS = new Set(['10-K', '10-Q', '20-F', '40-F']);

interface EdgarFact {
  end: string;
  val: number;
  form: string;
  filed: string;
  start?: string;
  fy?: number;
  fp?: string;
}

interface ConceptData {
  units: { USD?: EdgarFact[]; 'USD/shares'?: EdgarFact[]; shares?: EdgarFact[] };
}

export interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, ConceptData>;
  };
}

/** Fetch companyfacts JSON for an EDGAR CIK. */
export async function fetchFinancialsFacts(paddedCik: string): Promise<CompanyFacts> {
  return memoize('edgar:facts', paddedCik, EDGAR_FACTS_TTL, async () => {
    const res = await fetch(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`,
      { headers: { 'User-Agent': EDGAR_USER_AGENT } },
    );
    if (!res.ok) throw new Error(`EDGAR companyfacts fetch failed: ${res.status}`);
    return (await res.json()) as CompanyFacts;
  });
}

function normalizeEdgarForm(raw: string | undefined | null): FormType {
  if (!raw) return null;
  const t = raw.trim().toUpperCase();
  if (t.startsWith('10-K')) return '10-K';
  if (t.startsWith('10-Q')) return '10-Q';
  if (t.startsWith('20-F')) return '20-F';
  if (t.startsWith('40-F')) return '40-F';
  return 'other';
}

function emptyIncome(): IncomeStatementItems {
  return {
    revenue: null, costOfRevenue: null, grossProfit: null,
    researchDevelopment: null, sellingGeneralAdmin: null, operatingExpenses: null,
    operatingIncome: null, interestExpense: null, incomeTax: null, netIncome: null,
    epsBasic: null, epsDiluted: null, sharesBasic: null, sharesDiluted: null,
  };
}

function emptyCashFlow(): CashFlowItems {
  return {
    operatingCashFlow: null, investingCashFlow: null, financingCashFlow: null,
    capitalExpenditures: null, depreciationAmortization: null, stockBasedCompensation: null,
    buybacks: null, dividendsPaid: null, debtIssued: null, debtRepaid: null,
  };
}

interface PeriodMeta {
  endDate: string;
  fy: number | null;
  fp: string | null;
  isAnnual: boolean;
  form: string;
}

/**
 * Pick the authoritative fact for a given concept + period end.
 * For duration facts we disambiguate by matching the period *length* — full-year
 * entries for annual periods (~365 days) and single-quarter entries for Qn.
 */
function selectDurationFact(
  entries: EdgarFact[] | undefined,
  meta: PeriodMeta,
): EdgarFact | null {
  if (!entries?.length) return null;

  // Match by exact end date and matching fiscal period/year when available
  const candidates = entries.filter(f => {
    if (f.end !== meta.endDate) return false;
    if (!BALANCE_SHEET_FORMS.has(f.form)) return false;
    if (!f.start) return false;

    const durationDays = Math.round(
      (new Date(f.end).getTime() - new Date(f.start).getTime()) / 86400000,
    );

    if (meta.isAnnual) {
      // Annual fact: 330–400 day window
      return durationDays >= 330 && durationDays <= 400;
    }
    // Quarterly fact: 75–100 day window (a single quarter, not YTD)
    return durationDays >= 75 && durationDays <= 100;
  });

  if (!candidates.length) return null;

  // Prefer the latest filing (amendments supersede originals)
  candidates.sort((a, b) => b.filed.localeCompare(a.filed));
  return candidates[0];
}

/**
 * Build up to N most-recent financial periods. Uses Revenues (or similar) as
 * the anchor concept to identify available periods.
 */
export function companyFactsToFinancialsPeriods(
  facts: CompanyFacts,
  preferAnnual = true,
  maxPeriods = 4,
): { periods: FinancialsPeriod[]; formType: FormType; isAnnual: boolean } {
  const gaap = facts.facts['us-gaap'];
  if (!gaap) throw new Error('No US-GAAP data in company facts');

  // Find the first available revenue-like concept to use as the anchor.
  const revenueConcepts = [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
  ];
  let anchor: EdgarFact[] | null = null;
  for (const c of revenueConcepts) {
    const data = gaap[c];
    if (data?.units?.USD?.length) {
      anchor = data.units.USD;
      break;
    }
  }
  if (!anchor) throw new Error('No revenue data found');

  // Classify each anchor entry as annual or quarterly by its duration
  const annualAnchors: EdgarFact[] = [];
  const quarterlyAnchors: EdgarFact[] = [];
  for (const f of anchor) {
    if (!f.start || !BALANCE_SHEET_FORMS.has(f.form)) continue;
    const days = Math.round(
      (new Date(f.end).getTime() - new Date(f.start).getTime()) / 86400000,
    );
    if (days >= 330 && days <= 400) annualAnchors.push(f);
    else if (days >= 75 && days <= 100) quarterlyAnchors.push(f);
  }

  const useAnnual = preferAnnual && annualAnchors.length > 0;
  const pool = useAnnual ? annualAnchors : quarterlyAnchors;
  if (!pool.length) throw new Error('No usable income statement periods found');

  // Sort by end date desc, dedupe by end date (keep latest filing per end)
  pool.sort((a, b) => {
    if (a.end !== b.end) return b.end.localeCompare(a.end);
    return b.filed.localeCompare(a.filed);
  });
  const seenEnds = new Set<string>();
  const chosen: EdgarFact[] = [];
  for (const f of pool) {
    if (seenEnds.has(f.end)) continue;
    seenEnds.add(f.end);
    chosen.push(f);
    if (chosen.length >= maxPeriods) break;
  }

  const periods: FinancialsPeriod[] = [];

  for (const anchorFact of chosen) {
    const meta: PeriodMeta = {
      endDate: anchorFact.end,
      fy: anchorFact.fy ?? null,
      fp: anchorFact.fp ?? null,
      isAnnual: useAnnual,
      form: anchorFact.form,
    };

    const income = emptyIncome();
    const seenIncome = new Set<keyof IncomeStatementItems>();
    for (const [concept, field] of INCOME_CONCEPTS) {
      if (seenIncome.has(field)) continue;
      const conceptData = gaap[concept];
      if (!conceptData) continue;

      // EPS is in USD/shares, share counts are in "shares", everything else is USD
      const unitPreference: Array<'USD' | 'USD/shares' | 'shares'> =
        field === 'epsBasic' || field === 'epsDiluted' ? ['USD/shares']
        : field === 'sharesBasic' || field === 'sharesDiluted' ? ['shares']
        : ['USD'];

      for (const unit of unitPreference) {
        const chosenFact = selectDurationFact(conceptData.units[unit], meta);
        if (chosenFact) {
          // USD → millions; shares → millions; EPS stays as-is
          if (field === 'epsBasic' || field === 'epsDiluted') {
            income[field] = chosenFact.val;
          } else {
            income[field] = chosenFact.val / 1_000_000;
          }
          seenIncome.add(field);
          break;
        }
      }
    }

    // Derive gross profit if missing and components present
    if (income.grossProfit == null && income.revenue != null && income.costOfRevenue != null) {
      income.grossProfit = income.revenue - income.costOfRevenue;
    }

    const cashFlow = emptyCashFlow();
    const seenCf = new Set<keyof CashFlowItems>();
    for (const [concept, field] of CASHFLOW_CONCEPTS) {
      if (seenCf.has(field)) continue;
      const conceptData = gaap[concept];
      if (!conceptData?.units?.USD) continue;
      const chosenFact = selectDurationFact(conceptData.units.USD, meta);
      if (chosenFact) {
        cashFlow[field] = chosenFact.val / 1_000_000;
        seenCf.add(field);
      }
    }

    const fpLabel = meta.fp ?? (useAnnual ? 'FY' : '');
    const label = meta.fy != null ? `${fpLabel} ${meta.fy}`.trim() : meta.endDate;
    const periodKey = meta.fy != null ? `${fpLabel}-${meta.fy}` : meta.endDate;

    periods.push({
      label,
      periodKey,
      endDate: meta.endDate,
      fiscalYear: meta.fy,
      fiscalPeriod: meta.fp,
      isAnnual: meta.isAnnual,
      income,
      cashFlow,
    });
  }

  const formType = normalizeEdgarForm(chosen[0].form);

  return { periods, formType, isAnnual: useAnnual };
}
