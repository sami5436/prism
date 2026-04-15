// XBRL/XML balance sheet parser — TypeScript port
// Uses fast-xml-parser to parse XBRL filings

import { XMLParser } from 'fast-xml-parser';
import { RawExtraction, RawPeriod } from './types';

// US-GAAP XBRL tag → normalized field mapping
const GAAP_TAG_MAP: Record<string, string> = {
  CashAndCashEquivalentsAtCarryingValue: 'cash_and_equivalents',
  Cash: 'cash_and_equivalents',
  CashCashEquivalentsAndShortTermInvestments: 'cash_and_equivalents',
  ShortTermInvestments: 'short_term_investments',
  MarketableSecuritiesCurrent: 'short_term_investments',
  AvailableForSaleSecuritiesCurrent: 'short_term_investments',
  AccountsReceivableNetCurrent: 'accounts_receivable',
  AccountsReceivableNet: 'accounts_receivable',
  ReceivablesNetCurrent: 'accounts_receivable',
  InventoryNet: 'inventory',
  Inventories: 'inventory',
  AssetsCurrent: 'total_current_assets',
  PropertyPlantAndEquipmentNet: 'property_plant_equipment',
  PropertyPlantAndEquipmentGross: 'property_plant_equipment',
  Goodwill: 'goodwill',
  IntangibleAssetsNetExcludingGoodwill: 'intangible_assets',
  FiniteLivedIntangibleAssetsNet: 'intangible_assets',
  Assets: 'total_assets',
  AccountsPayableCurrent: 'accounts_payable',
  AccountsPayable: 'accounts_payable',
  ShortTermBorrowings: 'short_term_debt',
  CurrentPortionOfLongTermDebt: 'short_term_debt',
  LongTermDebtCurrent: 'short_term_debt',
  LiabilitiesCurrent: 'total_current_liabilities',
  LongTermDebtNoncurrent: 'long_term_debt',
  LongTermDebt: 'long_term_debt',
  LongTermBorrowings: 'long_term_debt',
  Liabilities: 'total_liabilities',
  RetainedEarningsAccumulatedDeficit: 'retained_earnings',
  RetainedEarnings: 'retained_earnings',
  StockholdersEquity: 'total_equity',
  StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest: 'total_equity',
  Equity: 'total_equity',
};

function extractLocalName(tag: string): string {
  // Handle namespaced tags like "us-gaap:Assets"
  const colonIdx = tag.lastIndexOf(':');
  return colonIdx >= 0 ? tag.slice(colonIdx + 1) : tag;
}

export function parseXBRL(xmlString: string): RawExtraction {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: false,
  });

  const parsed = parser.parse(xmlString);
  let companyName: string | null = null;
  let filingDate: string | null = null;
  const items: Record<string, number | null> = {};
  const confidenceScores: Record<string, number> = {};

  // Recursively walk the parsed XML to find GAAP elements
  function walk(obj: Record<string, unknown>, prefix = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const localName = extractLocalName(key);

      // Company name from DEI
      if (localName === 'EntityRegistrantName' && typeof value === 'string') {
        companyName = value;
      }
      if (localName === 'DocumentPeriodEndDate' && typeof value === 'string') {
        filingDate = value;
      }

      // Check GAAP tags
      if (localName in GAAP_TAG_MAP) {
        const fieldKey = GAAP_TAG_MAP[localName];
        let numValue: number | null = null;

        if (typeof value === 'number') {
          numValue = value;
        } else if (typeof value === 'string') {
          const cleaned = value.replace(/,/g, '');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) numValue = parsed;
        } else if (typeof value === 'object' && value !== null) {
          // May be an object with #text attribute
          const textVal = (value as Record<string, unknown>)['#text'];
          if (typeof textVal === 'number') {
            numValue = textVal;
          } else if (typeof textVal === 'string') {
            const parsed = parseFloat(textVal.replace(/,/g, ''));
            if (!isNaN(parsed)) numValue = parsed;
          }
        }

        if (numValue !== null && !(fieldKey in items)) {
          items[fieldKey] = numValue;
          confidenceScores[fieldKey] = 90; // High confidence for structured data
        }
      }

      // Recurse
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              walk(item as Record<string, unknown>, key);
            }
          }
        } else {
          walk(value as Record<string, unknown>, key);
        }
      }
    }
  }

  walk(parsed);

  const period: RawPeriod = {
    label: filingDate || 'Extracted',
    rawItems: items,
  };

  return {
    companyName,
    filingDate,
    currency: 'USD',
    unit: 'units',
    periods: [period],
    confidenceScores,
  };
}
