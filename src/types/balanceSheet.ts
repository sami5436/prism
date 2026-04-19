// Balance Sheet Analyzer — Typed API contracts

export type FormType = '10-K' | '10-Q' | '20-F' | '40-F' | 'other' | null;

export interface NormalizedLineItems {
  cashAndEquivalents: number | null;
  shortTermInvestments: number | null;
  accountsReceivable: number | null;
  inventory: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquipment: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  totalCurrentLiabilities: number | null;
  longTermDebt: number | null;
  totalLiabilities: number | null;
  retainedEarnings: number | null;
  totalEquity: number | null;
}

export interface FieldConfidence {
  field: string;
  confidence: number; // 0-100
  source: 'parsed' | 'inferred' | 'missing';
}

export interface BalanceSheetRatios {
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;
  debtToEquity: number | null;
  debtToAssets: number | null;
  workingCapital: number | null;
  workingCapitalToAssets: number | null;
  goodwillToAssets: number | null;
  intangiblesToAssets: number | null;
  tangibleEquity: number | null;
  arShareOfCurrentAssets: number | null;
  inventoryShareOfCurrentAssets: number | null;
  apShareOfCurrentLiab: number | null;
  shortTermDebtShareOfDebt: number | null;
}

export type FlagSeverity = 'info' | 'warning' | 'critical';

export interface AnalysisFlag {
  id: string;
  label: string;
  description: string;
  severity: FlagSeverity;
  metric?: string;
  value?: number;
}

export interface SWOTItem {
  id: string;
  label: string;
  detail: string;
  metric?: string;
  value?: number;
}

export interface ForwardSignal {
  id: string;
  area: 'accounts_receivable' | 'accounts_payable' | 'debt' | 'working_capital' | 'equity' | 'cash';
  improvement: string;
  deterioration: string;
}

export interface BalanceSheetSummary {
  overview: string;
  ratioNotes: string[];
  flags: AnalysisFlag[];
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  forwardLooking: ForwardSignal[];
}

export interface ExtractionPeriod {
  label: string; // e.g. "2024-12-31", "Q3 2024"
  lineItems: NormalizedLineItems;
  confidence: FieldConfidence[];
}

export interface BalanceSheetResult {
  companyName: string | null;
  filingDate: string | null;
  formType: FormType;
  currency: string;
  unit: string; // "thousands", "millions", "units"
  periods: ExtractionPeriod[];
  ratios: BalanceSheetRatios;
  summary: BalanceSheetSummary;
  sourceType: 'pdf' | 'xbrl' | 'html' | 'manual';
  overallConfidence: number; // 0-100
}

export interface UploadResponse {
  success: boolean;
  data?: BalanceSheetResult;
  error?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
