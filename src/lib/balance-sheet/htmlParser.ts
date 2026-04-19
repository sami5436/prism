/**
 * HTML balance-sheet parser — two-path approach:
 *
 * 1. iXBRL (inline XBRL): parse <ix:nonFraction> tags directly.
 *    Used by all modern SEC 10-K/10-Q filings (mandatory since 2020).
 *    Values are exact, deterministic, no heuristics required.
 *
 * 2. Plain-text fallback: collapse HTML to line-oriented text and use
 *    label-matching regexes. Lower confidence; used for older/non-SEC HTML.
 */

import { RawExtraction, RawPeriod, FormType } from './types';
import { extractFromText } from './pdfParser'; // shared text scanner (fallback only)

function normalizeFormType(raw: string | null): FormType {
  if (!raw) return null;
  const t = raw.trim().toUpperCase();
  if (t.startsWith('10-K')) return '10-K';
  if (t.startsWith('10-Q')) return '10-Q';
  if (t.startsWith('20-F')) return '20-F';
  if (t.startsWith('40-F')) return '40-F';
  return 'other';
}

function detectFormTypeFromHtml(html: string): FormType {
  // iXBRL exposes form type via DEI
  const ix = /<ix:nonNumeric[^>]*name="dei:DocumentType"[^>]*>([\s\S]*?)<\/ix:nonNumeric>/i.exec(html);
  if (ix) {
    const text = ix[1].replace(/<[^>]+>/g, '').trim();
    const n = normalizeFormType(text);
    if (n) return n;
  }
  // Fallback: search for "Form 10-K" / "Form 10-Q" markers in document text
  if (/\bform\s+10[-\s]?k\b/i.test(html)) return '10-K';
  if (/\bform\s+10[-\s]?q\b/i.test(html)) return '10-Q';
  if (/\bform\s+20[-\s]?f\b/i.test(html)) return '20-F';
  if (/\bform\s+40[-\s]?f\b/i.test(html)) return '40-F';
  return null;
}

// US-GAAP concept → internal field key (priority order, first match wins per period)
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

// Build a reverse map: concept name → field key (first-registered wins)
const CONCEPT_TO_FIELD = new Map<string, string>();
for (const [concept, field] of CONCEPT_FIELD_PRIORITY) {
  if (!CONCEPT_TO_FIELD.has(concept)) CONCEPT_TO_FIELD.set(concept, field);
}

// ─── iXBRL context parsing ────────────────────────────────────────────────────

/** Returns a map of contextId → ISO date string (instant only). */
function parseInstantContexts(html: string): Map<string, string> {
  const contexts = new Map<string, string>();
  // Match <xbrli:context> or <context> elements (namespace prefix varies)
  const contextRe = /<[a-z]+:context\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/[a-z]+:context>/gi;
  const instantRe = /<[a-z]+:instant>([\d-]+)<\/[a-z]+:instant>/i;
  let m: RegExpExecArray | null;
  while ((m = contextRe.exec(html)) !== null) {
    const id = m[1];
    const body = m[2];
    const instant = instantRe.exec(body);
    if (instant) contexts.set(id, instant[1]);
  }
  return contexts;
}

function parseAttrs(attrStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /\b([\w:-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) {
    out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

interface IxFact {
  concept: string;   // local name of us-gaap concept, e.g. "Assets"
  contextRef: string;
  value: number | null;
}

function parseIxFacts(html: string): IxFact[] {
  const facts: IxFact[] = [];
  // Matches both <ix:nonFraction ...>content</ix:nonFraction> and <ix:nonFraction ... />
  const factRe = /<ix:nonFraction\b([^>]*)(?:\/>|>([\s\S]*?)<\/ix:nonFraction>)/gi;
  let m: RegExpExecArray | null;

  while ((m = factRe.exec(html)) !== null) {
    const attrs = parseAttrs(m[1]);
    const rawContent = m[2] ?? '';

    const nameAttr = attrs['name'] ?? '';
    const contextRef = attrs['contextref'] ?? '';
    if (!nameAttr || !contextRef) continue;

    // Accept only us-gaap concepts
    const colonIdx = nameAttr.indexOf(':');
    const ns = colonIdx >= 0 ? nameAttr.slice(0, colonIdx).toLowerCase() : '';
    if (ns && ns !== 'us-gaap') continue;
    const concept = colonIdx >= 0 ? nameAttr.slice(colonIdx + 1) : nameAttr;

    if (!CONCEPT_TO_FIELD.has(concept)) continue;

    // Strip inner HTML tags, then parse as number
    const text = rawContent.replace(/<[^>]+>/g, '').replace(/,/g, '').trim();
    let val: number | null = null;
    if (text && text !== '—' && text !== '–' && text !== '-') {
      const n = parseFloat(text);
      if (!isNaN(n)) {
        const scale = attrs['scale'] ? parseInt(attrs['scale'], 10) : 0;
        const sign = attrs['sign'] === '-' ? -1 : 1;
        // Apply iXBRL scale: actual USD = displayed value × 10^scale
        // Then normalise to millions for display consistency
        val = (sign * n * Math.pow(10, scale)) / 1_000_000;
      }
    }

    facts.push({ concept, contextRef, value: val });
  }

  return facts;
}

// ─── iXBRL main path ─────────────────────────────────────────────────────────

function parseIxbrl(html: string): RawExtraction | null {
  // Quick probe — bail immediately if no iXBRL facts present
  if (!/<ix:nonFraction\b/i.test(html)) return null;

  const contexts = parseInstantContexts(html);
  if (contexts.size === 0) return null;

  const facts = parseIxFacts(html);
  if (facts.length === 0) return null;

  // Group facts by context (period)
  // Only include contexts that appear in at least one fact
  const periodFacts = new Map<string, IxFact[]>();
  for (const fact of facts) {
    if (!contexts.has(fact.contextRef)) continue;
    if (!periodFacts.has(fact.contextRef)) periodFacts.set(fact.contextRef, []);
    periodFacts.get(fact.contextRef)!.push(fact);
  }

  if (periodFacts.size === 0) return null;

  // Sort contexts by date descending, keep up to 4
  const sortedContexts = Array.from(periodFacts.keys())
    .sort((a, b) => (contexts.get(b) ?? '').localeCompare(contexts.get(a) ?? ''))
    .slice(0, 4);

  const confidenceScores: Record<string, number> = {};
  const rawPeriods: RawPeriod[] = [];

  for (const ctxId of sortedContexts) {
    const factsForPeriod = periodFacts.get(ctxId)!;
    const items: Record<string, number | null> = {};
    const seenFields = new Set<string>();

    // Apply priority ordering: process concepts in priority order
    for (const [concept, fieldKey] of CONCEPT_FIELD_PRIORITY) {
      if (seenFields.has(fieldKey)) continue;
      const match = factsForPeriod.find(f => f.concept === concept && f.value !== null);
      if (match) {
        items[fieldKey] = match.value;
        seenFields.add(fieldKey);
        confidenceScores[fieldKey] = 90;
      }
    }

    const label = contexts.get(ctxId) ?? ctxId;
    rawPeriods.push({ label, rawItems: items });
  }

  // Try to extract company name from DEI tags or <title>
  let companyName: string | null = null;
  const deiNameMatch = /<ix:nonNumeric[^>]*name="dei:EntityRegistrantName"[^>]*>([\s\S]*?)<\/ix:nonNumeric>/i.exec(html);
  if (deiNameMatch) {
    companyName = deiNameMatch[1].replace(/<[^>]+>/g, '').trim() || null;
  }
  if (!companyName) {
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (titleMatch) companyName = titleMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 80) || null;
  }

  // Find most recent period date for filingDate
  const mostRecentDate = contexts.get(sortedContexts[0]) ?? null;

  return {
    companyName,
    filingDate: mostRecentDate,
    formType: detectFormTypeFromHtml(html),
    currency: 'USD',
    unit: 'millions',
    periods: rawPeriods,
    confidenceScores,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseHTML(html: string): RawExtraction {
  // Try iXBRL first — definitive, no heuristics
  const ixbrl = parseIxbrl(html);
  if (ixbrl) return ixbrl;

  // Fallback: text-based extraction for non-iXBRL HTML (older filings)
  const fallback = extractFromText(htmlToText(html), 65);
  return { ...fallback, formType: detectFormTypeFromHtml(html) };
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', '&apos;': "'", '&#160;': ' ', '&#xa0;': ' ',
  '&#x2014;': '—', '&#8212;': '—', '&#x2013;': '–', '&#8211;': '–',
};

function decodeEntities(s: string): string {
  let out = s.replace(/&(?:nbsp|amp|lt|gt|quot|apos|#160|#xa0|#x2014|#8212|#x2013|#8211);/gi,
    m => HTML_ENTITIES[m.toLowerCase()] ?? m);
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
  return out;
}

export function htmlToText(html: string): string {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/<\/tr\s*>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/h[1-6]\s*>/gi, '\n');
  s = s.replace(/<\/?(?:td|th)\b[^>]*>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = s.split('\n').map(line => line.replace(/[ \t\u00a0]+/g, ' ').trim()).filter(Boolean).join('\n');
  return s;
}
