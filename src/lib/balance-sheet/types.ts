// Shared types for the balance sheet parsing pipeline

export interface RawPeriod {
  label: string;
  rawItems: Record<string, number | null>;
}

export interface RawExtraction {
  companyName: string | null;
  filingDate: string | null;
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
  debtToEquity: number | null;
  workingCapital: number | null;
  goodwillToAssets: number | null;
  intangiblesToAssets: number | null;
}

export interface AnalysisFlag {
  id: string;
  label: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
  value?: number;
}

export interface AnalysisSummaryResult {
  overview: string;
  ratioNotes: string[];
  flags: AnalysisFlag[];
}
