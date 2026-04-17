import { RawExtraction } from './types';
import { normalize } from './normalize';
import { computeRatios } from './ratios';
import { generateSummary } from './summary';

export type SourceType = 'pdf' | 'xbrl' | 'html';

export function buildResult(rawExtraction: RawExtraction, sourceType: SourceType) {
  const periods = normalize(rawExtraction);
  const ratios = computeRatios(periods);
  const summary = generateSummary(periods, ratios, rawExtraction.unit);

  const allConf = periods.flatMap(p => p.confidence.map(c => c.confidence));
  const overallConfidence = allConf.length
    ? Math.round(allConf.reduce((a, b) => a + b, 0) / allConf.length)
    : 0;

  return {
    companyName: rawExtraction.companyName,
    filingDate: rawExtraction.filingDate,
    currency: rawExtraction.currency,
    unit: rawExtraction.unit,
    periods: periods.map(p => ({
      label: p.label,
      lineItems: {
        cashAndEquivalents: p.lineItems.cash_and_equivalents ?? null,
        shortTermInvestments: p.lineItems.short_term_investments ?? null,
        accountsReceivable: p.lineItems.accounts_receivable ?? null,
        inventory: p.lineItems.inventory ?? null,
        totalCurrentAssets: p.lineItems.total_current_assets ?? null,
        propertyPlantEquipment: p.lineItems.property_plant_equipment ?? null,
        goodwill: p.lineItems.goodwill ?? null,
        intangibleAssets: p.lineItems.intangible_assets ?? null,
        totalAssets: p.lineItems.total_assets ?? null,
        accountsPayable: p.lineItems.accounts_payable ?? null,
        shortTermDebt: p.lineItems.short_term_debt ?? null,
        totalCurrentLiabilities: p.lineItems.total_current_liabilities ?? null,
        longTermDebt: p.lineItems.long_term_debt ?? null,
        totalLiabilities: p.lineItems.total_liabilities ?? null,
        retainedEarnings: p.lineItems.retained_earnings ?? null,
        totalEquity: p.lineItems.total_equity ?? null,
      },
      confidence: p.confidence,
    })),
    ratios,
    summary,
    sourceType,
    overallConfidence,
  };
}
