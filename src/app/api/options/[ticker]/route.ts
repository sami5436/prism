// API route for fetching options chain data

import { NextRequest, NextResponse } from 'next/server';
import { getOptionsChain } from '@/lib/yahooFinance';
import { rateLimitResponse } from '@/lib/rateLimit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> }
) {
    const limited = rateLimitResponse(request, { limit: 60, windowMs: 60_000, scope: 'options-chain' });
    if (limited) return limited;

    const { ticker } = await params;
    const date = request.nextUrl.searchParams.get('date') || undefined;

    if (!ticker) {
        return NextResponse.json(
            { error: 'Ticker symbol required' },
            { status: 400 }
        );
    }

    try {
        const data = await getOptionsChain(ticker.toUpperCase(), date);

        if (!data) {
            return NextResponse.json(
                { error: 'No options data available for this symbol' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Options API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch options data' },
            { status: 500 }
        );
    }
}
