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
  optionsChain: 60 * 1000,        // 1 min
  earnings: 6 * 60 * 60 * 1000,   // 6 h (calendar changes slowly)
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
