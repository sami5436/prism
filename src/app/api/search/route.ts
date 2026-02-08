// API route for ticker search autocomplete

import { NextRequest, NextResponse } from 'next/server';
import { searchTickers } from '@/lib/yahooFinance';

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q');

    if (!query || query.length < 1) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = await searchTickers(query);
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to search tickers' },
            { status: 500 }
        );
    }
}
