// Shared types for the balance sheet parsing pipeline

export type FormType = '10-K' | '10-Q' | '20-F' | '40-F' | 'other' | null;

export interface RawPeriod {
  label: string;
  rawItems: Record<string, number | null>;
}

export interface RawExtraction {
  companyName: string | null;
  filingDate: string | null;
  formType: FormType;
  currency: string;
  unit: string;
  periods: RawPeriod[];
  confidenceScores: Record<string, number>;
}

export interface NormalizedPeriod {
  label: string;
  lineItems: Record<string, number | null>;
  confidence: { field: string; confidence: number; source: 'parsed' | 'inferred' | 'missing' }[];
}

export interface ComputedRatios {
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

export interface AnalysisFlag {
  id: string;
  label: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
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

export interface AnalysisSummaryResult {
  overview: string;
  ratioNotes: string[];
  flags: AnalysisFlag[];
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  forwardLooking: ForwardSignal[];
}
