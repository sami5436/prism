// SEC EDGAR API helpers — deterministic balance sheet extraction via XBRL company facts
// https://www.sec.gov/edgar/sec-api-documentation

import { RawExtraction, RawPeriod } from './types';
import { memoize } from '../cache';

const EDGAR_USER_AGENT = 'Prism Financial Tools sami5436@prism.local';
const EDGAR_TICKERS_TTL = 24 * 60 * 60 * 1000; // 24h — ticker list rarely changes
const EDGAR_FACTS_TTL = 60 * 60 * 1000;        // 1h — filings are infrequent

// Priority-ordered list of (US-GAAP concept, field key) pairs.
// First match wins for a given field within a period.
const CONCEPT_FIELD_PRIORITY: [string, string][] = [
  // Cash & equivalents
  ['CashCashEquivalentsAndShortTermInvestments', 'cash_and_equivalents'],
  ['CashAndCashEquivalentsAtCarryingValue', 'cash_and_equivalents'],
  ['Cash', 'cash_and_equivalents'],

  // Short-term investments
  ['ShortTermInvestments', 'short_term_investments'],
  ['MarketableSecuritiesCurrent', 'short_term_investments'],
  ['AvailableForSaleSecuritiesCurrent', 'short_term_investments'],

  // Accounts receivable
  ['AccountsReceivableNetCurrent', 'accounts_receivable'],
  ['ReceivablesNetCurrent', 'accounts_receivable'],

  // Inventory
  ['InventoryNet', 'inventory'],
  ['Inventories', 'inventory'],

  // Current assets
  ['AssetsCurrent', 'total_current_assets'],

  // PP&E
  ['PropertyPlantAndEquipmentNet', 'property_plant_equipment'],
  ['PropertyPlantAndEquipmentGross', 'property_plant_equipment'],

  // Goodwill
  ['Goodwill', 'goodwill'],

  // Intangibles
  ['IntangibleAssetsNetExcludingGoodwill', 'intangible_assets'],
  ['FiniteLivedIntangibleAssetsNet', 'intangible_assets'],

  // Total assets
  ['Assets', 'total_assets'],

  // Accounts payable
  ['AccountsPayableCurrent', 'accounts_payable'],
  ['AccountsPayable', 'accounts_payable'],

  // Short-term debt
  ['ShortTermBorrowings', 'short_term_debt'],
  ['LongTermDebtCurrent', 'short_term_debt'],
  ['CurrentPortionOfLongTermDebt', 'short_term_debt'],

  // Current liabilities
  ['LiabilitiesCurrent', 'total_current_liabilities'],

  // Long-term debt
  ['LongTermDebtNoncurrent', 'long_term_debt'],
  ['LongTermDebt', 'long_term_debt'],
  ['LongTermBorrowings', 'long_term_debt'],

  // Total liabilities
  ['Liabilities', 'total_liabilities'],

  // Retained earnings
  ['RetainedEarningsAccumulatedDeficit', 'retained_earnings'],
  ['RetainedEarnings', 'retained_earnings'],

  // Total equity
  ['StockholdersEquity', 'total_equity'],
  ['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'total_equity'],
  ['Equity', 'total_equity'],
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
  units: { USD?: EdgarFact[] };
}

interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, ConceptData>;
  };
}

/** Resolve a ticker symbol to a zero-padded 10-digit CIK string. */
export async function lookupCik(ticker: string): Promise<string | null> {
  const data = await memoize(
    'edgar:tickers',
    'all',
    EDGAR_TICKERS_TTL,
    async () => {
      const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
        headers: { 'User-Agent': EDGAR_USER_AGENT },
      });
      if (!res.ok) throw new Error(`EDGAR tickers fetch failed: ${res.status}`);
      return (await res.json()) as Record<string, { cik_str: number; ticker: string; title: string }>;
    },
  );

  const upper = ticker.toUpperCase().trim();
  for (const entry of Object.values(data)) {
    if (entry.ticker.toUpperCase() === upper) {
      return String(entry.cik_str).padStart(10, '0');
    }
  }
  return null;
}

/** Fetch all XBRL company facts for a given padded CIK. */
export async function fetchCompanyFacts(paddedCik: string): Promise<CompanyFacts> {
  return memoize('edgar:facts', paddedCik, EDGAR_FACTS_TTL, async () => {
    const res = await fetch(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`,
      { headers: { 'User-Agent': EDGAR_USER_AGENT } }
    );
    if (!res.ok) throw new Error(`EDGAR companyfacts fetch failed: ${res.status}`);
    return (await res.json()) as CompanyFacts;
  });
}

/**
 * Convert EDGAR companyfacts JSON into a RawExtraction.
 * Values are normalised to millions (USD) to match SEC filing conventions.
 * Returns up to 4 most recent balance-sheet periods.
 */
export function companyFactsToRawExtraction(facts: CompanyFacts): RawExtraction {
  const gaap = facts.facts['us-gaap'];
  if (!gaap) throw new Error('No US-GAAP data in company facts');

  // Use "Assets" as the anchor concept to identify available balance-sheet periods.
  const anchor = gaap['Assets'] ?? gaap['AssetsCurrent'];
  if (!anchor?.units?.USD?.length) throw new Error('No Assets data found');

  // Instant (balance-sheet) entries only — filter out duration rows (income stmt).
  const anchorEntries = anchor.units.USD
    .filter(f => !f.start && BALANCE_SHEET_FORMS.has(f.form))
    .sort((a, b) => b.end.localeCompare(a.end));

  // Deduplicate by end date; the sort above means we keep the most recent filing per date.
  const periodMap = new Map<string, EdgarFact>();
  for (const f of anchorEntries) {
    if (!periodMap.has(f.end)) periodMap.set(f.end, f);
  }

  const periods = Array.from(periodMap.entries()).slice(0, 4);
  if (periods.length === 0) throw new Error('No balance-sheet periods found');

  const confidenceScores: Record<string, number> = {};
  const rawPeriods: RawPeriod[] = [];

  for (const [endDate, anchorFact] of periods) {
    const items: Record<string, number | null> = {};
    const seenFields = new Set<string>();

    for (const [concept, fieldKey] of CONCEPT_FIELD_PRIORITY) {
      if (seenFields.has(fieldKey)) continue;
      const conceptData = gaap[concept];
      if (!conceptData?.units?.USD) continue;

      const matches = conceptData.units.USD
        .filter(f => f.end === endDate && !f.start && BALANCE_SHEET_FORMS.has(f.form))
        .sort((a, b) => b.filed.localeCompare(a.filed));

      if (matches.length > 0) {
        // Normalise raw USD → millions
        items[fieldKey] = matches[0].val / 1_000_000;
        seenFields.add(fieldKey);
        confidenceScores[fieldKey] = 95;
      }
    }

    // Human-readable period label, e.g. "Q1 2026" or "FY 2025"
    const label = anchorFact.fp && anchorFact.fy
      ? `${anchorFact.fp} ${anchorFact.fy}`
      : endDate;

    rawPeriods.push({ label, rawItems: items });
  }

  return {
    companyName: facts.entityName,
    filingDate: periods[0][0],
    currency: 'USD',
    unit: 'millions',
    periods: rawPeriods,
    confidenceScores,
  };
}
