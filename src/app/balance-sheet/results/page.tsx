'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BalanceSheetResult } from '@/types/balanceSheet';
import SummaryPanel from '@/components/balance-sheet/SummaryPanel';
import MetricsCards from '@/components/balance-sheet/MetricsCards';
import BalanceSheetTable from '@/components/balance-sheet/BalanceSheetTable';
import HighlightsPanel from '@/components/balance-sheet/HighlightsPanel';
import ConfidenceNote from '@/components/balance-sheet/ConfidenceNote';

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
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    companyName: pick(r.companyName as string | null | undefined, r.company_name as string | null | undefined, null),
    filingDate: pick(r.filingDate as string | null | undefined, r.filing_date as string | null | undefined, null),
    currency: (r.currency as string) || 'USD',
    unit: (r.unit as string) || 'units',
    periods,
    ratios: {
      currentRatio: pick(ratios.currentRatio as number | null | undefined, ratios.current_ratio as number | null | undefined, null),
      debtToEquity: pick(ratios.debtToEquity as number | null | undefined, ratios.debt_to_equity as number | null | undefined, null),
      workingCapital: pick(ratios.workingCapital as number | null | undefined, ratios.working_capital as number | null | undefined, null),
      goodwillToAssets: pick(ratios.goodwillToAssets as number | null | undefined, ratios.goodwill_to_assets as number | null | undefined, null),
      intangiblesToAssets: pick(ratios.intangiblesToAssets as number | null | undefined, ratios.intangibles_to_assets as number | null | undefined, null),
    },
    summary: {
      overview: (summary.overview as string) || '',
      ratioNotes: pick(summary.ratioNotes as string[] | undefined, summary.ratio_notes as string[] | undefined, []),
      flags,
    },
    sourceType: pick(r.sourceType as 'pdf' | 'xbrl' | 'html' | 'manual' | undefined, r.source_type as 'pdf' | 'xbrl' | 'html' | 'manual' | undefined, 'pdf'),
    overallConfidence: pick(r.overallConfidence as number | undefined, r.overall_confidence as number | undefined, 0),
  };
}

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
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl sm:text-3xl font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {result.companyName || 'Analysis Results'}
                </h1>
              </div>
              {result.filingDate && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Filing date: {result.filingDate}
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

        {/* Content grid */}
        <div className="space-y-5">
          {/* Summary */}
          <SummaryPanel summary={result.summary} companyName={result.companyName} />

          {/* Metrics cards */}
          <MetricsCards ratios={result.ratios} currency={currencySymbol} unit={result.unit} />

          {/* Two-column on desktop: table + highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Table takes more space */}
            <div className="lg:col-span-3">
              <BalanceSheetTable
                periods={result.periods}
                currency={currencySymbol}
                unit={result.unit}
              />
            </div>

            {/* Highlights */}
            <div className="lg:col-span-2">
              <HighlightsPanel flags={result.summary.flags} />
            </div>
          </div>

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
