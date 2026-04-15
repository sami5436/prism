// Normalization layer — converts raw parser output into structured periods

import { RawExtraction, NormalizedPeriod } from './types';

const ALL_FIELDS = [
  'cash_and_equivalents', 'short_term_investments', 'accounts_receivable',
  'inventory', 'total_current_assets', 'property_plant_equipment',
  'goodwill', 'intangible_assets', 'total_assets', 'accounts_payable',
  'short_term_debt', 'total_current_liabilities', 'long_term_debt',
  'total_liabilities', 'retained_earnings', 'total_equity',
];

function inferMissing(items: Record<string, number | null>): [Record<string, number | null>, Set<string>] {
  const inferred = new Set<string>();

  // Infer total_current_assets
  if (items.total_current_assets == null) {
    const parts = ['cash_and_equivalents', 'short_term_investments', 'accounts_receivable', 'inventory'];
    const available = parts.filter(k => items[k] != null);
    if (available.length >= 2) {
      items.total_current_assets = available.reduce((s, k) => s + (items[k] ?? 0), 0);
      inferred.add('total_current_assets');
    }
  }

  // Infer total_current_liabilities
  if (items.total_current_liabilities == null) {
    const parts = ['accounts_payable', 'short_term_debt'];
    const available = parts.filter(k => items[k] != null);
    if (available.length >= 1) {
      items.total_current_liabilities = available.reduce((s, k) => s + (items[k] ?? 0), 0);
      inferred.add('total_current_liabilities');
    }
  }

  return [items, inferred];
}

export function normalize(raw: RawExtraction): NormalizedPeriod[] {
  return raw.periods.map(period => {
    const [items, inferredFields] = inferMissing({ ...period.rawItems });

    const confidence = ALL_FIELDS.map(field => {
      const value = items[field];
      if (value != null) {
        return {
          field,
          confidence: inferredFields.has(field) ? 50 : (raw.confidenceScores[field] ?? 60),
          source: (inferredFields.has(field) ? 'inferred' : 'parsed') as 'parsed' | 'inferred',
        };
      }
      return { field, confidence: 0, source: 'missing' as const };
    });

    return { label: period.label, lineItems: items, confidence };
  });
}
