import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData, getOptionsChain, getPastEarningsDates } from '@/lib/yahooFinance';
import { rollingRealizedVol, computeIVRank, atmCallIV, selectIVExpiration } from '@/lib/volatility';
import { rateLimitResponse } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const limited = rateLimitResponse(request, { limit: 30, windowMs: 60_000, scope: 'iv-rank' });
  if (limited) return limited;

  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol required' }, { status: 400 });
  }

  const upper = ticker.toUpperCase();

  try {
    // 2y of history so the chart can show a couple of full earnings cycles.
    const [history, initialChain, earnings] = await Promise.all([
      getHistoricalData(upper, '2y'),
      getOptionsChain(upper),
      getPastEarningsDates(upper),
    ]);

    if (!history.length) {
      return NextResponse.json({ error: 'No price history available' }, { status: 404 });
    }

    // Sample IV from the expiration closest to 30 DTE so it matches the 30d HV
    // we're comparing against. Falls back to the default chain if we can't
    // find a better one.
    let ivChain = initialChain;
    if (initialChain) {
      const targetExp = selectIVExpiration(initialChain.expirationDates, 30);
      const defaultExp = initialChain.expirationDates[0];
      if (targetExp && targetExp !== defaultExp) {
        const refetched = await getOptionsChain(upper, targetExp).catch(() => null);
        if (refetched) ivChain = refetched;
      }
    }

    const closes = history.map(h => ({ date: h.date, close: h.close }));
    const series = rollingRealizedVol(closes, 30);
    const ivResult = ivChain ? atmCallIV(ivChain.calls, ivChain.underlyingPrice) : null;
    const currentIV = ivResult?.iv ?? null;
    const ivSource = ivResult?.source ?? null;
    const ivExpiration = ivChain?.calls?.[0]?.expiration ?? null;
    const rank = computeIVRank(series, currentIV);

    // computeIVRank trims to 252 trading days; for the chart we want the full
    // 2y series so earnings markers from 4+ quarters back still land on data.
    return NextResponse.json({
      ...rank,
      fullSeries: series,
      earnings,
      ivExpiration,
      ivSource,
    });
  } catch (error) {
    console.error('IV Rank error:', error);
    return NextResponse.json({ error: 'Failed to compute IV rank' }, { status: 500 });
  }
}
