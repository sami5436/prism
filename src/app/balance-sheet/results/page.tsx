'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BalanceSheetResult } from '@/types/balanceSheet';
import SummaryPanel from '@/components/balance-sheet/SummaryPanel';
import MetricsCards from '@/components/balance-sheet/MetricsCards';
import BalanceSheetTable from '@/components/balance-sheet/BalanceSheetTable';
import HighlightsPanel from '@/components/balance-sheet/HighlightsPanel';
import ConfidenceNote from '@/components/balance-sheet/ConfidenceNote';

// Map snake_case Python response to camelCase TypeScript types
function mapResult(raw: Record<string, unknown>): BalanceSheetResult {
  const r = raw as Record<string, unknown>;

  const mapLineItems = (items: Record<string, unknown>) => ({
    cashAndEquivalents: items.cash_and_equivalents as number | null ?? null,
    shortTermInvestments: items.short_term_investments as number | null ?? null,
    accountsReceivable: items.accounts_receivable as number | null ?? null,
    inventory: items.inventory as number | null ?? null,
    totalCurrentAssets: items.total_current_assets as number | null ?? null,
    propertyPlantEquipment: items.property_plant_equipment as number | null ?? null,
    goodwill: items.goodwill as number | null ?? null,
    intangibleAssets: items.intangible_assets as number | null ?? null,
    totalAssets: items.total_assets as number | null ?? null,
    accountsPayable: items.accounts_payable as number | null ?? null,
    shortTermDebt: items.short_term_debt as number | null ?? null,
    totalCurrentLiabilities: items.total_current_liabilities as number | null ?? null,
    longTermDebt: items.long_term_debt as number | null ?? null,
    totalLiabilities: items.total_liabilities as number | null ?? null,
    retainedEarnings: items.retained_earnings as number | null ?? null,
    totalEquity: items.total_equity as number | null ?? null,
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const periods = ((r.periods as any[]) || []).map((p: any) => ({
    label: p.label,
    lineItems: mapLineItems(p.line_items || {}),
    confidence: (p.confidence || []).map((c: any) => ({
      field: c.field,
      confidence: c.confidence,
      source: c.source,
    })),
  }));

  const ratios = r.ratios as Record<string, unknown> || {};
  const summary = r.summary as Record<string, unknown> || {};
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
    companyName: r.company_name as string | null ?? null,
    filingDate: r.filing_date as string | null ?? null,
    currency: (r.currency as string) || 'USD',
    unit: (r.unit as string) || 'units',
    periods,
    ratios: {
      currentRatio: ratios.current_ratio as number | null ?? null,
      debtToEquity: ratios.debt_to_equity as number | null ?? null,
      workingCapital: ratios.working_capital as number | null ?? null,
      goodwillToAssets: ratios.goodwill_to_assets as number | null ?? null,
      intangiblesToAssets: ratios.intangibles_to_assets as number | null ?? null,
    },
    summary: {
      overview: (summary.overview as string) || '',
      ratioNotes: (summary.ratio_notes as string[]) || [],
      flags,
    },
    sourceType: (r.source_type as 'pdf' | 'xbrl' | 'manual') || 'pdf',
    overallConfidence: (r.overall_confidence as number) || 0,
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
          <MetricsCards ratios={result.ratios} currency={currencySymbol} />

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
