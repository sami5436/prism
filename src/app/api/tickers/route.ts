import { NextResponse } from 'next/server';

// Popular tickers cache - pre-loaded suggestions for quick access
const POPULAR_TICKERS = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'HD', name: 'The Home Depot Inc.', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', type: 'Equity' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', type: 'Equity' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE', type: 'ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', type: 'ETF' },
];

export async function GET() {
    return NextResponse.json({
        results: POPULAR_TICKERS,
        cached: true,
    });
}
