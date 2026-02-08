// Yahoo Finance API wrapper
// Using yahoo-finance2 for stock data
/* eslint-disable @typescript-eslint/no-explicit-any */

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
import { StockQuote, HistoricalDataPoint, SearchResult } from '@/types/stock';

/**
 * Search for stock tickers matching a query
 */
export async function searchTickers(query: string): Promise<SearchResult[]> {
    try {
        const results: any = await yahooFinance.search(query, {
            newsCount: 0,
            quotesCount: 10,
        });

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
}

/**
 * Get current quote for a stock
 */
export async function getQuote(symbol: string): Promise<StockQuote | null> {
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
}

/**
 * Get historical price data for a stock
 */
export async function getHistoricalData(
    symbol: string,
    period: '1mo' | '3mo' | '6mo' | '1y' | '2y' = '1y'
): Promise<HistoricalDataPoint[]> {
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
}
