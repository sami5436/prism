import { NextRequest, NextResponse } from 'next/server';
import { getNews, getAnalystRatings } from '@/lib/yahooFinance';
import { rateLimitResponse } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const limited = rateLimitResponse(request, { limit: 30, windowMs: 60_000, scope: 'sentiment' });
  if (limited) return limited;

  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol required' }, { status: 400 });
  }
  const upper = ticker.toUpperCase();

  try {
    const [news, analyst] = await Promise.all([
      getNews(upper, 6),
      getAnalystRatings(upper),
    ]);
    return NextResponse.json({ news, analyst });
  } catch (error) {
    console.error('Sentiment route error:', error);
    return NextResponse.json({ error: 'Failed to load sentiment data' }, { status: 500 });
  }
}
