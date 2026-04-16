/**
 * Pure XBRL/XML balance-sheet parser.
 *
 * Key improvements over the previous version:
 * - Parses <xbrli:context> definitions so facts are correctly attributed
 *   to their reporting period (instant date).
 * - Supports multiple balance-sheet periods in one file.
 * - Ignores duration contexts (income statement), avoiding cross-contamination.
 * - Priority-ordered concept matching (more specific → more general).
 */

import { XMLParser } from 'fast-xml-parser';
import { RawExtraction, RawPeriod } from './types';

// Priority-ordered list of (US-GAAP concept, field key) pairs.
const CONCEPT_FIELD_PRIORITY: [string, string][] = [
  ['CashCashEquivalentsAndShortTermInvestments', 'cash_and_equivalents'],
  ['CashAndCashEquivalentsAtCarryingValue', 'cash_and_equivalents'],
  ['Cash', 'cash_and_equivalents'],
  ['ShortTermInvestments', 'short_term_investments'],
  ['MarketableSecuritiesCurrent', 'short_term_investments'],
  ['AvailableForSaleSecuritiesCurrent', 'short_term_investments'],
  ['AccountsReceivableNetCurrent', 'accounts_receivable'],
  ['ReceivablesNetCurrent', 'accounts_receivable'],
  ['InventoryNet', 'inventory'],
  ['Inventories', 'inventory'],
  ['AssetsCurrent', 'total_current_assets'],
  ['PropertyPlantAndEquipmentNet', 'property_plant_equipment'],
  ['PropertyPlantAndEquipmentGross', 'property_plant_equipment'],
  ['Goodwill', 'goodwill'],
  ['IntangibleAssetsNetExcludingGoodwill', 'intangible_assets'],
  ['FiniteLivedIntangibleAssetsNet', 'intangible_assets'],
  ['Assets', 'total_assets'],
  ['AccountsPayableCurrent', 'accounts_payable'],
  ['AccountsPayable', 'accounts_payable'],
  ['ShortTermBorrowings', 'short_term_debt'],
  ['LongTermDebtCurrent', 'short_term_debt'],
  ['CurrentPortionOfLongTermDebt', 'short_term_debt'],
  ['LiabilitiesCurrent', 'total_current_liabilities'],
  ['LongTermDebtNoncurrent', 'long_term_debt'],
  ['LongTermDebt', 'long_term_debt'],
  ['LongTermBorrowings', 'long_term_debt'],
  ['Liabilities', 'total_liabilities'],
  ['RetainedEarningsAccumulatedDeficit', 'retained_earnings'],
  ['RetainedEarnings', 'retained_earnings'],
  ['StockholdersEquity', 'total_equity'],
  ['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'total_equity'],
  ['Equity', 'total_equity'],
];

const CONCEPT_TO_FIELD = new Map<string, string>();
for (const [concept, field] of CONCEPT_FIELD_PRIORITY) {
  if (!CONCEPT_TO_FIELD.has(concept)) CONCEPT_TO_FIELD.set(concept, field);
}

function extractLocalName(tag: string): string {
  const i = tag.lastIndexOf(':');
  return i >= 0 ? tag.slice(i + 1) : tag;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }
  if (typeof value === 'object' && value !== null) {
    return toNumber((value as Record<string, unknown>)['#text']);
  }
  return null;
}

interface ContextMeta {
  instant?: string;  // ISO date — balance-sheet point-in-time
  // duration contexts (startDate/endDate) are ignored for balance sheets
}

interface RawFact {
  concept: string;
  contextRef: string;
  value: number | null;
}

/**
 * Collect all context definitions and GAAP facts from the parsed XML tree.
 * Returns them separately so we can group by period afterwards.
 */
function collectContextsAndFacts(
  obj: Record<string, unknown>,
  contexts: Map<string, ContextMeta>,
  facts: RawFact[],
): void {
  if (!obj || typeof obj !== 'object') return;

  for (const [key, value] of Object.entries(obj)) {
    const local = extractLocalName(key);

    // Context element
    if (local === 'context') {
      const ctxArr = Array.isArray(value) ? value : [value];
      for (const ctx of ctxArr) {
        if (typeof ctx !== 'object' || ctx === null) continue;
        const c = ctx as Record<string, unknown>;
        const id = (c['@_id'] ?? '') as string;
        if (!id) continue;

        // Look for <instant> inside <period>
        const period = c['period'] ?? c['xbrli:period'];
        if (period && typeof period === 'object') {
          const p = period as Record<string, unknown>;
          const instant = p['instant'] ?? p['xbrli:instant'];
          if (typeof instant === 'string') {
            contexts.set(id, { instant });
          }
        }
      }
      continue;
    }

    // GAAP fact element
    const fieldKey = CONCEPT_TO_FIELD.get(local);
    if (fieldKey !== undefined) {
      const entries = Array.isArray(value) ? value : [value];
      for (const entry of entries) {
        const ctxRef = typeof entry === 'object' && entry !== null
          ? ((entry as Record<string, unknown>)['@_contextRef'] as string | undefined) ?? ''
          : '';
        const numVal = toNumber(entry);
        if (ctxRef) {
          facts.push({ concept: local, contextRef: ctxRef, value: numVal });
        }
      }
      // Don't recurse into known fact elements
      continue;
    }

    // Recurse
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          collectContextsAndFacts(item as Record<string, unknown>, contexts, facts);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      collectContextsAndFacts(value as Record<string, unknown>, contexts, facts);
    }
  }
}

export function parseXBRL(xmlString: string): RawExtraction {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: false,
    isArray: (name) => {
      const local = extractLocalName(name);
      return CONCEPT_TO_FIELD.has(local) || local === 'context';
    },
  });

  const parsed = parser.parse(xmlString);

  const contexts = new Map<string, ContextMeta>();
  const facts: RawFact[] = [];

  // Extract company name and filing date from DEI elements
  let companyName: string | null = null;
  let filingDate: string | null = null;

  function scanDei(obj: Record<string, unknown>) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      const local = extractLocalName(key);
      if (local === 'EntityRegistrantName' && typeof value === 'string') companyName = value;
      if (local === 'DocumentPeriodEndDate' && typeof value === 'string') filingDate = value;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        scanDei(value as Record<string, unknown>);
      }
    }
  }

  scanDei(parsed);
  collectContextsAndFacts(parsed, contexts, facts);

  // Only keep instant contexts (balance-sheet dates)
  const instantContexts = new Map<string, string>(); // id → ISO date
  for (const [id, meta] of contexts) {
    if (meta.instant) instantContexts.set(id, meta.instant);
  }

  // Group facts by instant context, sorted by date descending
  const periodMap = new Map<string, RawFact[]>();
  for (const fact of facts) {
    if (!instantContexts.has(fact.contextRef)) continue;
    if (!periodMap.has(fact.contextRef)) periodMap.set(fact.contextRef, []);
    periodMap.get(fact.contextRef)!.push(fact);
  }

  // Sort context IDs by date descending, keep up to 4
  const sortedCtxIds = Array.from(periodMap.keys())
    .sort((a, b) => (instantContexts.get(b) ?? '').localeCompare(instantContexts.get(a) ?? ''))
    .slice(0, 4);

  const confidenceScores: Record<string, number> = {};
  const rawPeriods: RawPeriod[] = [];

  for (const ctxId of sortedCtxIds) {
    const periodFacts = periodMap.get(ctxId)!;
    const items: Record<string, number | null> = {};
    const seenFields = new Set<string>();

    // Apply priority order
    for (const [concept, fieldKey] of CONCEPT_FIELD_PRIORITY) {
      if (seenFields.has(fieldKey)) continue;
      const match = periodFacts.find(f => f.concept === concept && f.value !== null);
      if (match) {
        // Pure XBRL values are in exact USD — normalise to millions
        items[fieldKey] = (match.value as number) / 1_000_000;
        seenFields.add(fieldKey);
        confidenceScores[fieldKey] = 90;
      }
    }

    rawPeriods.push({
      label: instantContexts.get(ctxId) ?? ctxId,
      rawItems: items,
    });
  }

  // Fallback: if context-aware extraction found nothing, try the old flat walk
  if (rawPeriods.length === 0) {
    return parseFlatXBRL(parsed);
  }

  if (!filingDate && sortedCtxIds.length > 0) {
    filingDate = instantContexts.get(sortedCtxIds[0]) ?? null;
  }

  return {
    companyName,
    filingDate,
    currency: 'USD',
    unit: 'millions',
    periods: rawPeriods,
    confidenceScores,
  };
}

/** Last-resort flat walker for non-standard XBRL that lacks proper context refs. */
function parseFlatXBRL(parsed: Record<string, unknown>): RawExtraction {
  let companyName: string | null = null;
  let filingDate: string | null = null;
  const items: Record<string, number | null> = {};
  const confidenceScores: Record<string, number> = {};

  function walk(obj: Record<string, unknown>) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      const local = extractLocalName(key);
      if (local === 'EntityRegistrantName' && typeof value === 'string') companyName = value;
      if (local === 'DocumentPeriodEndDate' && typeof value === 'string') filingDate = value;
      const fieldKey = CONCEPT_TO_FIELD.get(local);
      if (fieldKey && !(fieldKey in items)) {
        const n = toNumber(value);
        if (n !== null) {
          items[fieldKey] = n / 1_000_000;
          confidenceScores[fieldKey] = 70;
        }
      }
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object') walk(item as Record<string, unknown>);
          }
        } else {
          walk(value as Record<string, unknown>);
        }
      }
    }
  }

  walk(parsed);

  return {
    companyName,
    filingDate,
    currency: 'USD',
    unit: 'millions',
    periods: [{ label: filingDate ?? 'Extracted', rawItems: items }],
    confidenceScores,
  };
}
