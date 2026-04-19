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
  financials?: FinancialsResult | null;
}

// ── Income statement + cash flow (served from the same ticker endpoint) ──

export interface IncomeStatementItems {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  researchDevelopment: number | null;
  sellingGeneralAdmin: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  incomeTax: number | null;
  netIncome: number | null;
  epsBasic: number | null;
  epsDiluted: number | null;
  sharesBasic: number | null;
  sharesDiluted: number | null;
}

export interface CashFlowItems {
  operatingCashFlow: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  capitalExpenditures: number | null;
  depreciationAmortization: number | null;
  stockBasedCompensation: number | null;
  buybacks: number | null;
  dividendsPaid: number | null;
  debtIssued: number | null;
  debtRepaid: number | null;
}

export interface FinancialsPeriod {
  label: string;
  periodKey: string;
  endDate: string;
  fiscalYear: number | null;
  fiscalPeriod: string | null;
  isAnnual: boolean;
  income: IncomeStatementItems;
  cashFlow: CashFlowItems;
}

export interface IncomeRatios {
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  effectiveTaxRate: number | null;
  interestCoverage: number | null;
  rdIntensity: number | null;
  sgaIntensity: number | null;
  revenueGrowthYoY: number | null;
  netIncomeGrowthYoY: number | null;
  epsGrowthYoY: number | null;
  operatingIncomeGrowthYoY: number | null;
}

export interface CashFlowRatios {
  freeCashFlow: number | null;
  fcfMargin: number | null;
  earningsQuality: number | null;
  capexIntensity: number | null;
  sbcIntensity: number | null;
  fcfGrowthYoY: number | null;
  dividendCoverage: number | null;
  payoutRatio: number | null;
  buybackOfFcf: number | null;
  netShareholderReturn: number | null;
}

export interface FinancialsSummary {
  overview: string;
  ratioNotes: string[];
  flags: AnalysisFlag[];
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  forwardLooking: ForwardSignal[];
}

export interface FinancialsResult {
  companyName: string | null;
  formType: FormType;
  currency: string;
  unit: string;
  isAnnual: boolean;
  periods: FinancialsPeriod[];
  incomeRatios: IncomeRatios;
  cashFlowRatios: CashFlowRatios;
  summary: FinancialsSummary;
}

export interface UploadResponse {
  success: boolean;
  data?: BalanceSheetResult;
  error?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
