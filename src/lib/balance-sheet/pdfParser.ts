/* eslint-disable @typescript-eslint/no-explicit-any */
import pdf from '@cedrugs/pdf-parse';
import { RawExtraction, RawPeriod } from './types';

const FIELD_PATTERNS: [string, RegExp[]][] = [
  ['cash_and_equivalents', [
    /cash\s*(?:and|&)\s*cash\s*equiv/i,
    /cash\s*(?:and|&)\s*equiv/i,
    /^cash$/i,
    /cash\s*(?:and|&)\s*short[- ]term\s*invest/i,
  ]],
  ['short_term_investments', [
    /short[- ]term\s*(?:market|invest)/i,
    /marketable\s*securities/i,
    /current\s*investments/i,
  ]],
  ['accounts_receivable', [
    /accounts?\s*receiv/i,
    /trade\s*receiv/i,
    /net\s*receiv/i,
  ]],
  ['inventory', [/inventor/i]],
  ['total_current_assets', [/total\s*current\s*assets/i]],
  ['property_plant_equipment', [
    /property.*(?:plant|equip)/i,
    /pp\s*(?:&|and)\s*e/i,
    /net\s*property/i,
  ]],
  ['goodwill', [/^goodwill$/i, /goodwill\b/i]],
  ['intangible_assets', [/intangible\s*assets/i, /other\s*intangible/i]],
  ['total_assets', [/total\s*assets/i]],
  ['accounts_payable', [/accounts?\s*payable/i, /trade\s*payable/i]],
  ['short_term_debt', [
    /short[- ]term\s*(?:debt|borrow)/i,
    /current\s*(?:portion|maturit).*(?:debt|loan)/i,
    /notes?\s*payable/i,
  ]],
  ['total_current_liabilities', [/total\s*current\s*liabilit/i]],
  ['long_term_debt', [
    /long[- ]term\s*debt/i,
    /long[- ]term\s*borrow/i,
    /non[- ]?current.*debt/i,
  ]],
  ['total_liabilities', [/total\s*liabilit/i]],
  ['retained_earnings', [/retained\s*earn/i, /accumulated\s*(?:deficit|earnings)/i]],
  ['total_equity', [
    /total\s*(?:stockholders?|shareholders?|owners?)?\s*equity/i,
    /total\s*equity/i,
  ]],
];

function parseNumber(text: string): number | null {
  if (!text) return null;
  let cleaned = text.trim().replace(/,/g, '').replace(/[$€£]/g, '');
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  if (['—', '-', '–', 'N/A', 'n/a', ''].includes(cleaned)) return null;
  const val = parseFloat(cleaned);
  return Number.isNaN(val) ? null : val;
}

function matchField(label: string): string | null {
  const lower = label.trim().toLowerCase();
  for (const [key, patterns] of FIELD_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) return key;
    }
  }
  return null;
}

function detectUnit(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('in billions') || lower.includes('(billions)')) return 'billions';
  if (lower.includes('in millions') || lower.includes('(millions)')) return 'millions';
  if (lower.includes('in thousands') || lower.includes('(thousands)')) return 'thousands';
  return 'units';
}

function extractCompanyName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const skipPatterns = [
    'balance sheet',
    'consolidated',
    'financial statement',
    'in millions',
    'in thousands',
    'in billions',
    'period ending',
    'as of',
    'date',
  ];

  for (const line of lines.slice(0, 10)) {
    if (skipPatterns.some(p => line.toLowerCase().includes(p))) continue;
    if (line.length > 3 && line.length < 80) return line;
  }
  return null;
}

export async function parsePDF(buffer: Buffer): Promise<RawExtraction> {
  const data = await pdf(buffer);
  const text = data.text || '';

  const unit = detectUnit(text);
  const companyName = extractCompanyName(text);

  const items: Record<string, number | null> = {};
  const confidenceScores: Record<string, number> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const fieldKey = matchField(line);
    if (!fieldKey) continue;

    const numbers = line.match(/[\d,]+\.?\d*/g);
    if (!numbers?.length) continue;

    const val = parseNumber(numbers[numbers.length - 1]);
    if (val !== null && !(fieldKey in items)) {
      items[fieldKey] = val;
      confidenceScores[fieldKey] = 60;
    }
  }

  const period: RawPeriod = {
    label: 'Extracted',
    rawItems: items,
  };

  return {
    companyName,
    filingDate: null,
    currency: 'USD',
    unit,
    periods: [period],
    confidenceScores,
  };
}