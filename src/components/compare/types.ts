import type { StockQuote, HistoricalDataPoint } from '@/types/stock';
import type { FundProfile } from '@/lib/yahooFinance';

export interface AssetResult {
  symbol: string;
  error?: string;
  quote?: StockQuote | null;
  historical?: HistoricalDataPoint[];
  profile?: FundProfile | null;
}

export interface CompareResponse {
  requestedSymbols: string[];
  benchmarkSymbol: string | null;
  benchmarkLabel: string;
  years: number;
  assets: AssetResult[];
}
