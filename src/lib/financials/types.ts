// Shared types for income-statement and cash-flow analysis pipeline.
//
// Unlike the balance sheet (which is a point-in-time snapshot), these
// statements represent *flows* over a period (quarter or fiscal year).

import type { FormType, SWOTItem, ForwardSignal, AnalysisFlag } from '../balance-sheet/types';

export type { FormType };

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
  label: string;       // e.g. "FY 2024", "Q3 2024"
  periodKey: string;   // canonical key: "FY-2024" / "Q3-2024"
  endDate: string;     // ISO date of period end
  fiscalYear: number | null;
  fiscalPeriod: string | null; // "FY" | "Q1" | "Q2" | "Q3"
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
  freeCashFlow: number | null;          // CFO − CapEx
  fcfMargin: number | null;             // FCF / Revenue
  earningsQuality: number | null;       // CFO / Net Income (want ≥ 1)
  capexIntensity: number | null;        // CapEx / Revenue
  sbcIntensity: number | null;          // SBC / Revenue
  fcfGrowthYoY: number | null;
  dividendCoverage: number | null;      // FCF / Dividends paid
  payoutRatio: number | null;           // Dividends / Net Income
  buybackOfFcf: number | null;          // Buybacks / FCF
  netShareholderReturn: number | null;  // (Dividends + Buybacks) / FCF
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
  unit: string;                   // always "units" for EDGAR (raw USD → we convert to millions)
  isAnnual: boolean;              // true if using fiscal-year data
  periods: FinancialsPeriod[];    // newest first
  incomeRatios: IncomeRatios;
  cashFlowRatios: CashFlowRatios;
  summary: FinancialsSummary;
}
