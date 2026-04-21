'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BalanceSheetResult, FormType, SWOTItem, ForwardSignal, FinancialsResult } from '@/types/balanceSheet';
import SummaryPanel from '@/components/balance-sheet/SummaryPanel';
import MetricsCards from '@/components/balance-sheet/MetricsCards';
import BalanceSheetTable from '@/components/balance-sheet/BalanceSheetTable';
import HighlightsPanel from '@/components/balance-sheet/HighlightsPanel';
import ConfidenceNote from '@/components/balance-sheet/ConfidenceNote';
import FinancialsMetricsCards from '@/components/balance-sheet/FinancialsMetricsCards';
import FinancialsTable from '@/components/balance-sheet/FinancialsTable';
import FinancialsSummaryPanel from '@/components/balance-sheet/FinancialsSummaryPanel';
import HeadlineBar from '@/components/balance-sheet/HeadlineBar';

// API returns camelCase; accept both shapes defensively in case older sessionStorage payloads are present.
function pick<T>(a: T | undefined, b: T | undefined, fallback: T): T {
  return (a ?? b ?? fallback) as T;
}

function mapResult(raw: Record<string, unknown>): BalanceSheetResult {
  const r = raw as Record<string, unknown>;

  const mapLineItems = (items: Record<string, unknown>) => ({
    cashAndEquivalents: pick(items.cashAndEquivalents as number | null | undefined, items.cash_and_equivalents as number | null | undefined, null),
    shortTermInvestments: pick(items.shortTermInvestments as number | null | undefined, items.short_term_investments as number | null | undefined, null),
    accountsReceivable: pick(items.accountsReceivable as number | null | undefined, items.accounts_receivable as number | null | undefined, null),
    inventory: (items.inventory as number | null | undefined) ?? null,
    totalCurrentAssets: pick(items.totalCurrentAssets as number | null | undefined, items.total_current_assets as number | null | undefined, null),
    propertyPlantEquipment: pick(items.propertyPlantEquipment as number | null | undefined, items.property_plant_equipment as number | null | undefined, null),
    goodwill: (items.goodwill as number | null | undefined) ?? null,
    intangibleAssets: pick(items.intangibleAssets as number | null | undefined, items.intangible_assets as number | null | undefined, null),
    totalAssets: pick(items.totalAssets as number | null | undefined, items.total_assets as number | null | undefined, null),
    accountsPayable: pick(items.accountsPayable as number | null | undefined, items.accounts_payable as number | null | undefined, null),
    shortTermDebt: pick(items.shortTermDebt as number | null | undefined, items.short_term_debt as number | null | undefined, null),
    totalCurrentLiabilities: pick(items.totalCurrentLiabilities as number | null | undefined, items.total_current_liabilities as number | null | undefined, null),
    longTermDebt: pick(items.longTermDebt as number | null | undefined, items.long_term_debt as number | null | undefined, null),
    totalLiabilities: pick(items.totalLiabilities as number | null | undefined, items.total_liabilities as number | null | undefined, null),
    retainedEarnings: pick(items.retainedEarnings as number | null | undefined, items.retained_earnings as number | null | undefined, null),
    totalEquity: pick(items.totalEquity as number | null | undefined, items.total_equity as number | null | undefined, null),
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const periods = ((r.periods as any[]) || []).map((p: any) => ({
    label: p.label,
    lineItems: mapLineItems(p.lineItems || p.line_items || {}),
    confidence: (p.confidence || []).map((c: any) => ({
      field: c.field,
      confidence: c.confidence,
      source: c.source,
    })),
  }));

  const ratios = (r.ratios as Record<string, unknown>) || {};
  const summary = (r.summary as Record<string, unknown>) || {};
  const flags = ((summary.flags as any[]) || []).map((f: any) => ({
    id: f.id,
    label: f.label,
    description: f.description,
    severity: f.severity,
    metric: f.metric,
    value: f.value,
  }));

  const mapSwot = (arr: any[] | undefined): SWOTItem[] => (arr || []).map((x: any) => ({
    id: x.id, label: x.label, detail: x.detail,
    metric: x.metric, value: x.value,
  }));

  const forwardLooking: ForwardSignal[] = ((summary.forwardLooking as any[]) || (summary.forward_looking as any[]) || []).map((x: any) => ({
    id: x.id, area: x.area, improvement: x.improvement, deterioration: x.deterioration,
  }));

  const financials = mapFinancials(r.financials);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    companyName: pick(r.companyName as string | null | undefined, r.company_name as string | null | undefined, null),
    filingDate: pick(r.filingDate as string | null | undefined, r.filing_date as string | null | undefined, null),
    formType: pick(r.formType as FormType | undefined, r.form_type as FormType | undefined, null),
    currency: (r.currency as string) || 'USD',
    unit: (r.unit as string) || 'units',
    periods,
    ratios: {
      currentRatio: pick(ratios.currentRatio as number | null | undefined, ratios.current_ratio as number | null | undefined, null),
      quickRatio: pick(ratios.quickRatio as number | null | undefined, ratios.quick_ratio as number | null | undefined, null),
      cashRatio: pick(ratios.cashRatio as number | null | undefined, ratios.cash_ratio as number | null | undefined, null),
      debtToEquity: pick(ratios.debtToEquity as number | null | undefined, ratios.debt_to_equity as number | null | undefined, null),
      debtToAssets: pick(ratios.debtToAssets as number | null | undefined, ratios.debt_to_assets as number | null | undefined, null),
      workingCapital: pick(ratios.workingCapital as number | null | undefined, ratios.working_capital as number | null | undefined, null),
      workingCapitalToAssets: pick(ratios.workingCapitalToAssets as number | null | undefined, ratios.working_capital_to_assets as number | null | undefined, null),
      goodwillToAssets: pick(ratios.goodwillToAssets as number | null | undefined, ratios.goodwill_to_assets as number | null | undefined, null),
      intangiblesToAssets: pick(ratios.intangiblesToAssets as number | null | undefined, ratios.intangibles_to_assets as number | null | undefined, null),
      tangibleEquity: pick(ratios.tangibleEquity as number | null | undefined, ratios.tangible_equity as number | null | undefined, null),
      arShareOfCurrentAssets: pick(ratios.arShareOfCurrentAssets as number | null | undefined, ratios.ar_share_of_current_assets as number | null | undefined, null),
      inventoryShareOfCurrentAssets: pick(ratios.inventoryShareOfCurrentAssets as number | null | undefined, ratios.inventory_share_of_current_assets as number | null | undefined, null),
      apShareOfCurrentLiab: pick(ratios.apShareOfCurrentLiab as number | null | undefined, ratios.ap_share_of_current_liab as number | null | undefined, null),
      shortTermDebtShareOfDebt: pick(ratios.shortTermDebtShareOfDebt as number | null | undefined, ratios.short_term_debt_share_of_debt as number | null | undefined, null),
    },
    summary: {
      overview: (summary.overview as string) || '',
      ratioNotes: pick(summary.ratioNotes as string[] | undefined, summary.ratio_notes as string[] | undefined, []),
      flags,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      strengths: mapSwot(summary.strengths as any[]),
      weaknesses: mapSwot(summary.weaknesses as any[]),
      opportunities: mapSwot(summary.opportunities as any[]),
      threats: mapSwot(summary.threats as any[]),
      /* eslint-enable @typescript-eslint/no-explicit-any */
      forwardLooking,
    },
    sourceType: pick(r.sourceType as 'pdf' | 'xbrl' | 'html' | 'manual' | undefined, r.source_type as 'pdf' | 'xbrl' | 'html' | 'manual' | undefined, 'pdf'),
    overallConfidence: pick(r.overallConfidence as number | undefined, r.overall_confidence as number | undefined, 0),
    financials,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapFinancials(raw: unknown): FinancialsResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as Record<string, any>;
  if (!Array.isArray(f.periods) || !f.periods.length) return null;

  const periods = f.periods.map((p: any) => ({
    label: p.label,
    periodKey: p.periodKey,
    endDate: p.endDate,
    fiscalYear: p.fiscalYear ?? null,
    fiscalPeriod: p.fiscalPeriod ?? null,
    isAnnual: !!p.isAnnual,
    income: {
      revenue: p.income?.revenue ?? null,
      costOfRevenue: p.income?.costOfRevenue ?? null,
      grossProfit: p.income?.grossProfit ?? null,
      researchDevelopment: p.income?.researchDevelopment ?? null,
      sellingGeneralAdmin: p.income?.sellingGeneralAdmin ?? null,
      operatingExpenses: p.income?.operatingExpenses ?? null,
      operatingIncome: p.income?.operatingIncome ?? null,
      interestExpense: p.income?.interestExpense ?? null,
      incomeTax: p.income?.incomeTax ?? null,
      netIncome: p.income?.netIncome ?? null,
      epsBasic: p.income?.epsBasic ?? null,
      epsDiluted: p.income?.epsDiluted ?? null,
      sharesBasic: p.income?.sharesBasic ?? null,
      sharesDiluted: p.income?.sharesDiluted ?? null,
    },
    cashFlow: {
      operatingCashFlow: p.cashFlow?.operatingCashFlow ?? null,
      investingCashFlow: p.cashFlow?.investingCashFlow ?? null,
      financingCashFlow: p.cashFlow?.financingCashFlow ?? null,
      capitalExpenditures: p.cashFlow?.capitalExpenditures ?? null,
      depreciationAmortization: p.cashFlow?.depreciationAmortization ?? null,
      stockBasedCompensation: p.cashFlow?.stockBasedCompensation ?? null,
      buybacks: p.cashFlow?.buybacks ?? null,
      dividendsPaid: p.cashFlow?.dividendsPaid ?? null,
      debtIssued: p.cashFlow?.debtIssued ?? null,
      debtRepaid: p.cashFlow?.debtRepaid ?? null,
    },
  }));

  const incomeRatios = f.incomeRatios ?? {};
  const cashFlowRatios = f.cashFlowRatios ?? {};
  const summary = f.summary ?? {};

  const mapSwot = (arr: any[] | undefined): SWOTItem[] => (arr || []).map((x: any) => ({
    id: x.id, label: x.label, detail: x.detail, metric: x.metric, value: x.value,
  }));

  return {
    companyName: f.companyName ?? null,
    formType: (f.formType ?? null) as FormType,
    currency: f.currency ?? 'USD',
    unit: f.unit ?? 'millions',
    isAnnual: !!f.isAnnual,
    periods,
    incomeRatios: {
      grossMargin: incomeRatios.grossMargin ?? null,
      operatingMargin: incomeRatios.operatingMargin ?? null,
      netMargin: incomeRatios.netMargin ?? null,
      effectiveTaxRate: incomeRatios.effectiveTaxRate ?? null,
      interestCoverage: incomeRatios.interestCoverage ?? null,
      rdIntensity: incomeRatios.rdIntensity ?? null,
      sgaIntensity: incomeRatios.sgaIntensity ?? null,
      revenueGrowthYoY: incomeRatios.revenueGrowthYoY ?? null,
      netIncomeGrowthYoY: incomeRatios.netIncomeGrowthYoY ?? null,
      epsGrowthYoY: incomeRatios.epsGrowthYoY ?? null,
      operatingIncomeGrowthYoY: incomeRatios.operatingIncomeGrowthYoY ?? null,
    },
    cashFlowRatios: {
      freeCashFlow: cashFlowRatios.freeCashFlow ?? null,
      fcfMargin: cashFlowRatios.fcfMargin ?? null,
      earningsQuality: cashFlowRatios.earningsQuality ?? null,
      capexIntensity: cashFlowRatios.capexIntensity ?? null,
      sbcIntensity: cashFlowRatios.sbcIntensity ?? null,
      fcfGrowthYoY: cashFlowRatios.fcfGrowthYoY ?? null,
      dividendCoverage: cashFlowRatios.dividendCoverage ?? null,
      payoutRatio: cashFlowRatios.payoutRatio ?? null,
      buybackOfFcf: cashFlowRatios.buybackOfFcf ?? null,
      netShareholderReturn: cashFlowRatios.netShareholderReturn ?? null,
    },
    summary: {
      overview: summary.overview ?? '',
      ratioNotes: Array.isArray(summary.ratioNotes) ? summary.ratioNotes : [],
      flags: Array.isArray(summary.flags)
        ? summary.flags.map((x: any) => ({
            id: x.id, label: x.label, description: x.description,
            severity: x.severity, metric: x.metric, value: x.value,
          }))
        : [],
      strengths: mapSwot(summary.strengths),
      weaknesses: mapSwot(summary.weaknesses),
      opportunities: mapSwot(summary.opportunities),
      threats: mapSwot(summary.threats),
      forwardLooking: Array.isArray(summary.forwardLooking)
        ? summary.forwardLooking.map((x: any) => ({
            id: x.id, area: x.area, improvement: x.improvement, deterioration: x.deterioration,
          }))
        : [],
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function BalanceSheetResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<BalanceSheetResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('bs-result');
    const storedName = sessionStorage.getItem('bs-filename');

    if (!stored) {
      router.push('/balance-sheet');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const mapped = mapResult(parsed);
      setResult(mapped);
      setFileName(storedName || '');
    } catch {
      router.push('/balance-sheet');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading || !result) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full mx-auto"
            style={{
              borderColor: 'var(--border-color)',
              borderTopColor: 'var(--bs-accent)',
              animation: 'bs-spin 1s linear infinite',
            }}
          />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading results…</p>
        </div>
      </main>
    );
  }

  const currencySymbol = result.currency === 'USD' ? '$' : result.currency === 'EUR' ? '€' : result.currency === 'GBP' ? '£' : '$';

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        {/* Header */}
        <div className="mb-8 bs-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl sm:text-3xl font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {result.companyName || 'Analysis Results'}
                </h1>
                {result.formType && (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-md"
                    style={{
                      background: 'var(--bs-accent-dim)',
                      color: 'var(--bs-accent)',
                      border: '1px solid var(--bs-accent-border)',
                    }}
                    title={
                      result.formType === '10-K'
                        ? 'Annual report (10-K) — audited, full fiscal year'
                        : result.formType === '10-Q'
                        ? 'Quarterly report (10-Q) — unaudited interim period'
                        : `Form ${result.formType}`
                    }
                  >
                    {result.formType}
                  </span>
                )}
              </div>
              {result.filingDate && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {result.formType === '10-K' ? 'Period ending' : result.formType === '10-Q' ? 'Quarter ending' : 'Filing date'}: {result.filingDate}
                </p>
              )}
            </div>

            <button
              onClick={() => router.push('/balance-sheet')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer self-start"
              style={{
                background: 'var(--bs-accent-dim)',
                color: 'var(--bs-accent)',
                border: '1px solid var(--bs-accent-border)',
              }}
              id="bs-new-analysis-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </button>
          </div>
        </div>

        {/* Headlined KPIs — highest-signal numbers, top of page */}
        <HeadlineBar result={result} />

        {/* Watch items — the short verdict, surfaced directly under the headline */}
        <div className="mt-5">
          <HighlightsPanel flags={result.summary.flags} />
        </div>

        {/* Details section divider */}
        <div className="mt-10 mb-5 flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
            Detailed analysis
          </span>
          <span className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
        </div>

        <div className="space-y-5">
          {/* Balance sheet: structural analysis */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              Balance Sheet
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Capital structure, liquidity, and asset quality.
            </p>
          </div>

          <SummaryPanel summary={result.summary} companyName={result.companyName} />
          <MetricsCards ratios={result.ratios} currency={currencySymbol} unit={result.unit} />
          <BalanceSheetTable
            periods={result.periods}
            currency={currencySymbol}
            unit={result.unit}
          />

          {/* Income statement + cash flow (EDGAR ticker flow only) */}
          {result.financials && result.financials.periods.length > 0 && (
            <div className="space-y-5 pt-6 mt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  Earnings & Cash Flow
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {result.financials.isAnnual ? 'Fiscal-year' : 'Quarterly'} income statement and cash flow — margins, growth, and cash generation.
                </p>
              </div>

              <FinancialsSummaryPanel summary={result.financials.summary} />
              <FinancialsMetricsCards
                income={result.financials.incomeRatios}
                cashFlow={result.financials.cashFlowRatios}
              />
              <FinancialsTable periods={result.financials.periods} />
            </div>
          )}

          {/* Confidence / source note */}
          <ConfidenceNote
            overallConfidence={result.overallConfidence}
            sourceType={result.sourceType}
            fileName={fileName}
          />
        </div>
      </div>
    </main>
  );
}
