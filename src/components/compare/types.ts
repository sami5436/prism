import type { StockQuote, HistoricalDataPoint } from '@/types/stock';
import type { FundProfile } from '@/lib/yahooFinance';
import type { PricePoint } from '@/lib/compareMath';

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

export type ReturnMode = 'price' | 'total';

/**
 * Map an asset's historical bars onto a PricePoint series suitable for the
 * compare math helpers. `total` uses the dividend-and-split-adjusted close
 * (with reinvested dividends); `price` uses the raw close.
 *
 * Falls back to raw close when `adjClose` is missing on individual bars.
 */
export function pointsFor(asset: AssetResult, mode: ReturnMode): PricePoint[] {
  const hist = asset.historical ?? [];
  if (mode === 'price') {
    return hist.map(h => ({ date: h.date, close: h.close }));
  }
  return hist.map(h => ({ date: h.date, close: typeof h.adjClose === 'number' ? h.adjClose : h.close }));
}
