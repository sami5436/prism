// Yahoo Finance API wrapper
// Using yahoo-finance2 for stock data
/* eslint-disable @typescript-eslint/no-explicit-any */

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
import { StockQuote, HistoricalDataPoint, SearchResult } from '@/types/stock';
import { memoize } from './cache';

// TTLs chosen to balance freshness vs upstream load.
// Intraday data (chain, quote) is short; end-of-day series are long.
const TTL = {
  search: 5 * 60 * 1000,          // 5 min
  quote: 30 * 1000,               // 30 s
  historical: 60 * 60 * 1000,     // 1 h (daily bars)
  longHistory: 12 * 60 * 60 * 1000, // 12 h (15y weekly bars rarely change)
  optionsChain: 60 * 1000,        // 1 min
  earnings: 6 * 60 * 60 * 1000,   // 6 h (calendar changes slowly)
  news: 15 * 60 * 1000,           // 15 min
  analyst: 6 * 60 * 60 * 1000,    // 6 h (ratings change slowly)
  fundProfile: 24 * 60 * 60 * 1000, // 24 h
} as const;

/**
 * Search for stock tickers matching a query
 */
export async function searchTickers(query: string): Promise<SearchResult[]> {
    return memoize('yf:search', query.toLowerCase(), TTL.search, async () => {
        try {
            const results: any = await yahooFinance.search(query, {
                newsCount: 0,
                quotesCount: 10,
            }, { validateResult: false });

            const quotes = results?.quotes || [];

            return quotes
                .filter((q: any) => typeof q?.symbol === 'string' && q.symbol.length > 0)
                .map((q: any) => ({
                    symbol: q.symbol,
                    name: q.shortname || q.symbol,
                    exchange: q.exchange || 'Unknown',
                    type: q.quoteType || 'Equity',
                }));
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    });
}

/**
 * Get current quote for a stock
 */
export async function getQuote(symbol: string): Promise<StockQuote | null> {
    return memoize('yf:quote', symbol.toUpperCase(), TTL.quote, async () => {
        try {
            const quote: any = await yahooFinance.quote(symbol);

            if (!quote) return null;

            return {
                symbol: quote.symbol,
                name: quote.longName || quote.shortName || quote.symbol,
                price: quote.regularMarketPrice || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                high: quote.regularMarketDayHigh || 0,
                low: quote.regularMarketDayLow || 0,
                open: quote.regularMarketOpen || 0,
                previousClose: quote.regularMarketPreviousClose || 0,
                volume: quote.regularMarketVolume || 0,
                avgVolume: quote.averageDailyVolume10Day || 0,
                marketCap: quote.marketCap || 0,
                exchange: quote.exchange || 'Unknown',
            };
        } catch (error) {
            console.error('Quote error:', error);
            return null;
        }
    });
}

/**
 * Get historical price data for a stock
 */
export async function getHistoricalData(
    symbol: string,
    period: '1mo' | '3mo' | '6mo' | '1y' | '2y' = '1y'
): Promise<HistoricalDataPoint[]> {
  return memoize('yf:historical', `${symbol.toUpperCase()}:${period}`, TTL.historical, async () => {
    try {
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case '1mo':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3mo':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6mo':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '1y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case '2y':
                startDate.setFullYear(startDate.getFullYear() - 2);
                break;
        }

        const historical: any = await yahooFinance.chart(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d',
        });

        const quotes = historical?.quotes || [];

        return quotes
            .filter((q: any) => q?.close !== null && q?.close !== undefined)
            .map((q: any) => ({
                date: new Date(q.date).toISOString().split('T')[0],
                open: q.open || 0,
                high: q.high || 0,
                low: q.low || 0,
                close: q.close,
                volume: q.volume || 0,
            }));
    } catch (error) {
        console.error('Historical data error:', error);
        return [];
    }
  });
}

/**
 * Long-range weekly historical data (used by the Compare module).
 * Returns up to `years` of weekly closes. Falls back to whatever Yahoo has
 * for short-history funds.
 */
export async function getLongHistoricalData(
  symbol: string,
  years = 15,
): Promise<HistoricalDataPoint[]> {
  return memoize('yf:longHistorical', `${symbol.toUpperCase()}:${years}`, TTL.longHistory, async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - years);

      const historical: any = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1wk',
        events: 'div|split',
      });

      const quotes = historical?.quotes || [];
      return quotes
        .filter((q: any) => q?.close !== null && q?.close !== undefined)
        .map((q: any) => {
          const adj = typeof q.adjclose === 'number' ? q.adjclose
            : typeof q.adjClose === 'number' ? q.adjClose
            : undefined;
          return {
            date: new Date(q.date).toISOString().split('T')[0],
            open: q.open || 0,
            high: q.high || 0,
            low: q.low || 0,
            close: q.close,
            adjClose: adj,
            volume: q.volume || 0,
          };
        });
    } catch (error) {
      console.error('Long historical error:', error);
      return [];
    }
  });
}

export interface FundHolding {
  /** Underlying ticker if Yahoo exposes one, else null (e.g. for indices). */
  symbol: string | null;
  name: string;
  /** Decimal weight, e.g. 0.067 = 6.7% of fund. */
  percent: number;
}

export interface SectorWeight {
  /** Yahoo's snake_case key — e.g. "consumer_cyclical". UI formats for display. */
  sector: string;
  percent: number;
}

export interface FundProfile {
  symbol: string;
  longName: string | null;
  shortName: string | null;
  quoteType: string | null; // 'ETF' | 'MUTUALFUND' | 'INDEX' | 'EQUITY'
  exchange: string | null;
  family: string | null;     // e.g. "Vanguard", "Schwab", "Fidelity"
  category: string | null;   // e.g. "Large Blend"
  expenseRatio: number | null; // decimal, e.g. 0.0003 = 0.03%
  yieldPct: number | null;     // decimal, e.g. 0.013 = 1.3%
  totalAssets: number | null;
  inceptionDate: string | null;
  ytdReturn: number | null;
  threeYrAvgReturn: number | null;
  fiveYrAvgReturn: number | null;
  beta: number | null;
  /** Top holdings with weights. Empty for indices and individual stocks. */
  holdings: FundHolding[];
  /** Sector weight breakdown. Empty for non-fund assets. */
  sectorWeightings: SectorWeight[];
}

/**
 * Best-effort fund/asset profile. Pulls from multiple quoteSummary modules and
 * fills what's available. ETFs / mutual funds yield the most fields; for raw
 * indices and stocks we may only get name + yield + beta.
 */
export async function getFundProfile(symbol: string): Promise<FundProfile | null> {
  return memoize('yf:fundProfile', symbol.toUpperCase(), TTL.fundProfile, async () => {
    try {
      const summary: any = await yahooFinance.quoteSummary(
        symbol,
        {
          modules: [
            'price',
            'summaryDetail',
            'fundProfile',
            'defaultKeyStatistics',
            'summaryProfile',
            'topHoldings',
          ],
        },
        { validateResult: false },
      );

      const price = summary?.price || {};
      const sd = summary?.summaryDetail || {};
      const fp = summary?.fundProfile || {};
      const dks = summary?.defaultKeyStatistics || {};
      const sp = summary?.summaryProfile || {};
      const th = summary?.topHoldings || {};

      const num = (v: unknown): number | null => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (v && typeof v === 'object' && 'raw' in (v as object)) {
          const r = (v as { raw: unknown }).raw;
          return typeof r === 'number' && Number.isFinite(r) ? r : null;
        }
        return null;
      };
      const str = (v: unknown): string | null =>
        typeof v === 'string' && v.length > 0 ? v : null;

      // Yahoo sometimes ships expense ratio under topHoldings (fees breakdown)
      // and sometimes under summaryDetail. Try both.
      const expenseRatio =
        num(th?.annualReportExpenseRatio) ??
        num(sd?.annualReportExpenseRatio) ??
        num(fp?.annualReportExpenseRatio) ??
        num(dks?.annualReportExpenseRatio);

      const yieldPct = num(sd?.yield) ?? num(sd?.dividendYield) ?? num(sd?.trailingAnnualDividendYield);

      const inception =
        dks?.fundInceptionDate instanceof Date
          ? dks.fundInceptionDate.toISOString().split('T')[0]
          : typeof dks?.fundInceptionDate === 'string'
            ? dks.fundInceptionDate
            : null;

      // Holdings: Yahoo ships an array of { symbol, holdingName, holdingPercent }.
      const holdingsRaw: any[] = Array.isArray(th?.holdings) ? th.holdings : [];
      const holdings: FundHolding[] = holdingsRaw
        .map((h: any) => {
          const pct = num(h?.holdingPercent) ?? 0;
          return {
            symbol: typeof h?.symbol === 'string' && h.symbol.length > 0 ? h.symbol : null,
            name: typeof h?.holdingName === 'string' ? h.holdingName : (typeof h?.symbol === 'string' ? h.symbol : ''),
            percent: pct,
          };
        })
        .filter(h => h.name.length > 0 && h.percent > 0)
        .sort((a, b) => b.percent - a.percent);

      // Sector weightings: array of single-key objects, e.g. [{ realestate: 0.012 }, ...].
      const sectorRaw: any[] = Array.isArray(th?.sectorWeightings) ? th.sectorWeightings : [];
      const sectorWeightings: SectorWeight[] = [];
      for (const obj of sectorRaw) {
        if (!obj || typeof obj !== 'object') continue;
        for (const [k, v] of Object.entries(obj)) {
          const pct = num(v);
          if (pct !== null && pct > 0) sectorWeightings.push({ sector: k, percent: pct });
        }
      }
      sectorWeightings.sort((a, b) => b.percent - a.percent);

      return {
        symbol: symbol.toUpperCase(),
        longName: str(price?.longName) ?? str(price?.shortName),
        shortName: str(price?.shortName),
        quoteType: str(price?.quoteType),
        exchange: str(price?.exchangeName) ?? str(price?.exchange),
        family: str(fp?.family) ?? str(sp?.companyName),
        category: str(fp?.categoryName) ?? str(fp?.category),
        expenseRatio,
        yieldPct,
        totalAssets: num(sd?.totalAssets) ?? num(price?.marketCap),
        inceptionDate: inception,
        ytdReturn: num(dks?.ytdReturn),
        threeYrAvgReturn: num(dks?.threeYearAverageReturn),
        fiveYrAvgReturn: num(dks?.fiveYearAverageReturn),
        beta: num(sd?.beta) ?? num(dks?.beta3Year),
        holdings,
        sectorWeightings,
      };
    } catch (error) {
      console.error('Fund profile error:', error);
      return null;
    }
  });
}

/**
 * Get the next earnings date for a symbol, if Yahoo has one on file.
 *
 * Returns the earliest future earnings date from `calendarEvents.earnings.earningsDate`.
 * Yahoo often ships this as a range [start, end]; we take the nearer end and
 * treat anything in the past as "no upcoming date".
 */
export async function getNextEarningsDate(symbol: string): Promise<{
  date: string | null;
  isEstimate: boolean;
}> {
  return memoize('yf:earnings', symbol.toUpperCase(), TTL.earnings, async () => {
    try {
      const summary: any = await yahooFinance.quoteSummary(
        symbol,
        { modules: ['calendarEvents'] },
        { validateResult: false },
      );

      const earnings = summary?.calendarEvents?.earnings;
      const rawDates: unknown[] = Array.isArray(earnings?.earningsDate) ? earnings.earningsDate : [];

      const now = Date.now();
      const futureDates = rawDates
        .map(d => (d instanceof Date ? d.getTime() : new Date(d as string).getTime()))
        .filter(t => Number.isFinite(t) && t >= now)
        .sort((a, b) => a - b);

      if (futureDates.length === 0) {
        return { date: null, isEstimate: false };
      }

      return {
        date: new Date(futureDates[0]).toISOString().split('T')[0],
        isEstimate: Boolean(earnings?.isEarningsDateEstimate),
      };
    } catch (error) {
      console.error('Earnings date error:', error);
      return { date: null, isEstimate: false };
    }
  });
}

/**
 * Past quarterly earnings dates from Yahoo's `earningsHistory`. The `quarter`
 * field is the fiscal-quarter-end date (not the report date) — close enough
 * to anchor a vol-spike marker on a chart. Returns up to 4 most recent quarters,
 * sorted oldest → newest.
 */
export async function getPastEarningsDates(symbol: string): Promise<{ date: string; period: string }[]> {
  return memoize('yf:earningsHistory', symbol.toUpperCase(), TTL.earnings, async () => {
    try {
      const summary: any = await yahooFinance.quoteSummary(
        symbol,
        { modules: ['earningsHistory'] },
        { validateResult: false },
      );
      const history: any[] = summary?.earningsHistory?.history ?? [];
      const out: { date: string; period: string }[] = [];
      for (const h of history) {
        const q = h?.quarter;
        if (!q) continue;
        const t = q instanceof Date ? q.getTime() : new Date(q).getTime();
        if (!Number.isFinite(t)) continue;
        out.push({
          date: new Date(t).toISOString().split('T')[0],
          period: typeof h?.period === 'string' ? h.period : '',
        });
      }
      return out.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Earnings history error:', error);
      return [];
    }
  });
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string; // ISO
  thumbnail: string | null;
}

/**
 * Recent news headlines for a ticker via Yahoo's `search` endpoint. Items
 * without a title or link are dropped — we'd render them as broken cards.
 */
export async function getNews(symbol: string, count = 6): Promise<NewsItem[]> {
  return memoize('yf:news', `${symbol.toUpperCase()}:${count}`, TTL.news, async () => {
    try {
      const result: any = await yahooFinance.search(
        symbol,
        { newsCount: count, quotesCount: 0 },
        { validateResult: false },
      );
      const news: any[] = result?.news || [];
      return news
        .filter((n: any) => n?.title && n?.link)
        .map((n: any) => {
          const pub = n.providerPublishTime;
          const publishedAt = pub instanceof Date
            ? pub.toISOString()
            : pub
              ? new Date(pub).toISOString()
              : new Date().toISOString();
          return {
            title: String(n.title),
            publisher: String(n.publisher || 'Unknown'),
            link: String(n.link),
            publishedAt,
            thumbnail: n.thumbnail?.resolutions?.[0]?.url ?? null,
          };
        })
        .slice(0, count);
    } catch (error) {
      console.error('News error:', error);
      return [];
    }
  });
}

export interface AnalystRatings {
  currentPrice: number | null;
  targetMean: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  targetMedian: number | null;
  numAnalysts: number | null;
  recommendationKey: string | null;   // 'strong_buy' | 'buy' | 'hold' | 'underperform' | 'sell'
  recommendationMean: number | null;  // 1.0 = strong buy, 5.0 = strong sell
  trend: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  } | null;
}

/**
 * Aggregate analyst targets + the current-month buy/hold/sell distribution.
 * Drops to null on upstream errors so the panel can show "—" cleanly.
 */
export async function getAnalystRatings(symbol: string): Promise<AnalystRatings | null> {
  return memoize('yf:analyst', symbol.toUpperCase(), TTL.analyst, async () => {
    try {
      const summary: any = await yahooFinance.quoteSummary(
        symbol,
        { modules: ['financialData', 'recommendationTrend'] },
        { validateResult: false },
      );
      const fd = summary?.financialData || {};
      const trendArr: any[] = summary?.recommendationTrend?.trend || [];
      // Yahoo labels months 0m / -1m / -2m / -3m. Prefer current month, else
      // most recent populated row.
      const current =
        trendArr.find(t => t?.period === '0m') ??
        trendArr.find(t => (t?.strongBuy ?? 0) + (t?.buy ?? 0) + (t?.hold ?? 0) + (t?.sell ?? 0) + (t?.strongSell ?? 0) > 0) ??
        null;

      return {
        currentPrice: typeof fd.currentPrice === 'number' ? fd.currentPrice : null,
        targetMean: typeof fd.targetMeanPrice === 'number' ? fd.targetMeanPrice : null,
        targetHigh: typeof fd.targetHighPrice === 'number' ? fd.targetHighPrice : null,
        targetLow: typeof fd.targetLowPrice === 'number' ? fd.targetLowPrice : null,
        targetMedian: typeof fd.targetMedianPrice === 'number' ? fd.targetMedianPrice : null,
        numAnalysts: typeof fd.numberOfAnalystOpinions === 'number' ? fd.numberOfAnalystOpinions : null,
        recommendationKey: typeof fd.recommendationKey === 'string' ? fd.recommendationKey : null,
        recommendationMean: typeof fd.recommendationMean === 'number' ? fd.recommendationMean : null,
        trend: current ? {
          strongBuy: current.strongBuy ?? 0,
          buy: current.buy ?? 0,
          hold: current.hold ?? 0,
          sell: current.sell ?? 0,
          strongSell: current.strongSell ?? 0,
        } : null,
      };
    } catch (error) {
      console.error('Analyst ratings error:', error);
      return null;
    }
  });
}

/**
 * Get options chain data for a stock
 */
export async function getOptionsChain(symbol: string, date?: string) {
  return memoize('yf:options', `${symbol.toUpperCase()}:${date ?? 'default'}`, TTL.optionsChain, async () => {
    try {
        const queryOptions: any = {};
        if (date) {
            queryOptions.date = new Date(date);
        }

        const data: any = await yahooFinance.options(symbol, queryOptions, { validateResult: false });

        const expirationDates = (data?.expirationDates || []).map((d: Date) =>
            new Date(d).toISOString().split('T')[0]
        );

        const strikes = data?.strikes || [];
        const optionSet = data?.options?.[0];
        const underlyingPrice = data?.quote?.regularMarketPrice || 0;

        const mapContract = (c: any) => ({
            contractSymbol: c.contractSymbol || '',
            strike: c.strike || 0,
            lastPrice: c.lastPrice || 0,
            change: c.change || 0,
            percentChange: c.percentChange || 0,
            volume: c.volume || 0,
            openInterest: c.openInterest || 0,
            bid: c.bid || 0,
            ask: c.ask || 0,
            impliedVolatility: c.impliedVolatility || 0,
            inTheMoney: c.inTheMoney || false,
            expiration: c.expiration ? new Date(c.expiration).toISOString().split('T')[0] : '',
        });

        return {
            expirationDates,
            strikes,
            calls: (optionSet?.calls || []).map(mapContract),
            puts: (optionSet?.puts || []).map(mapContract),
            underlyingPrice,
        };
    } catch (error) {
        console.error('Options chain error:', error);
        return null;
    }
  });
}
