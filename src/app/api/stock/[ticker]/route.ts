// API route for fetching stock data with indicators

import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getHistoricalData } from '@/lib/yahooFinance';
import { calculateAllIndicators } from '@/lib/indicators';
import { generateAnalysis } from '@/lib/analysis';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> }
) {
    const { ticker } = await params;
    const period = (request.nextUrl.searchParams.get('period') || '1y') as '1mo' | '3mo' | '6mo' | '1y' | '2y';

    if (!ticker) {
        return NextResponse.json(
            { error: 'Ticker symbol required' },
            { status: 400 }
        );
    }

    try {
        // Fetch quote and historical data in parallel
        const [quote, historical] = await Promise.all([
            getQuote(ticker.toUpperCase()),
            getHistoricalData(ticker.toUpperCase(), period),
        ]);

        if (!quote) {
            return NextResponse.json(
                { error: 'Stock not found' },
                { status: 404 }
            );
        }

        if (historical.length === 0) {
            return NextResponse.json(
                { error: 'No historical data available' },
                { status: 404 }
            );
        }

        // Calculate technical indicators
        const indicators = calculateAllIndicators(historical);

        // Generate AI analysis
        const analysis = generateAnalysis(historical, indicators);

        return NextResponse.json({
            quote,
            historical,
            indicators,
            analysis,
        });
    } catch (error) {
        console.error('Stock API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}
