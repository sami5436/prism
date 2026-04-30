// Stock data types

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  exchange: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20: number[];
  sma50: number[];
  sma200: number[];
  ema12: number[];
  ema26: number[];
  rsi: number[];
  macd: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  bollingerBands: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  volumeSma: number[];
}

export interface StockData {
  quote: StockQuote;
  historical: HistoricalDataPoint[];
  indicators: TechnicalIndicators;
  analysis: AnalysisSummary;
  earnings: EarningsReport[];
}

export interface EarningsReport {
  /** Fiscal-quarter-end date (ISO yyyy-mm-dd). Yahoo's earningsHistory anchors on this, not the announcement date. */
  date: string;
  /** Yahoo period code, e.g. "1Q2025". */
  period: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface AnalysisSummary {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  summary: string;
  signals: {
    indicator: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    reason: string;
  }[];
}

export interface OptionContract {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  change: number;
  percentChange: number;
  volume: number;
  openInterest: number;
  bid: number;
  ask: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  expiration: string;
}

export interface OptionsData {
  expirationDates: string[];
  strikes: number[];
  calls: OptionContract[];
  puts: OptionContract[];
  underlyingPrice: number;
}
