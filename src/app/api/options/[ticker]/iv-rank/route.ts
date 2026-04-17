import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData, getOptionsChain } from '@/lib/yahooFinance';
import { rollingRealizedVol, computeIVRank, atmCallIV } from '@/lib/volatility';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol required' }, { status: 400 });
  }

  const upper = ticker.toUpperCase();

  try {
    const [history, chain] = await Promise.all([
      getHistoricalData(upper, '1y'),
      getOptionsChain(upper),
    ]);

    if (!history.length) {
      return NextResponse.json({ error: 'No price history available' }, { status: 404 });
    }

    const closes = history.map(h => ({ date: h.date, close: h.close }));
    const series = rollingRealizedVol(closes, 30);
    const currentIV = chain ? atmCallIV(chain.calls, chain.underlyingPrice) : null;
    const result = computeIVRank(series, currentIV);

    return NextResponse.json(result);
  } catch (error) {
    console.error('IV Rank error:', error);
    return NextResponse.json({ error: 'Failed to compute IV rank' }, { status: 500 });
  }
}
