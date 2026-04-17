import { NextRequest, NextResponse } from 'next/server';
import { getOptionsChain } from '@/lib/yahooFinance';
import { rateLimitResponse } from '@/lib/rateLimit';
import {
  scoreBuyCandidates,
  scoreSellCandidates,
  RawCall,
  daysToExpiration,
  DEFAULT_DTE,
} from '@/lib/optionsMath';

// Cap the fan-out to protect against tickers with 20+ expirations (SPY).
const MAX_EXPIRATIONS = 10;

function parseDte(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 730) return fallback;
  return Math.round(n);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const limited = rateLimitResponse(request, { limit: 20, windowMs: 60_000, scope: 'call-picks' });
  if (limited) return limited;

  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol required' }, { status: 400 });
  }

  const upper = ticker.toUpperCase();
  const sp = request.nextUrl.searchParams;
  const minDte = parseDte(sp.get('minDte'), DEFAULT_DTE.min);
  const maxDte = parseDte(sp.get('maxDte'), DEFAULT_DTE.max);

  if (minDte > maxDte) {
    return NextResponse.json({ error: 'minDte cannot exceed maxDte' }, { status: 400 });
  }

  const dteRange = { min: minDte, max: maxDte };

  try {
    const initial = await getOptionsChain(upper);
    if (!initial) {
      return NextResponse.json({ error: 'No options chain available' }, { status: 404 });
    }

    const underlying = initial.underlyingPrice;

    // Keep only expirations that fall inside the requested DTE range. Always
    // include the first expiration (already fetched) so we never waste the round-trip.
    const now = new Date();
    const withinRange = initial.expirationDates.filter((d: string) => {
      const dte = daysToExpiration(d, now);
      return dte >= minDte && dte <= maxDte;
    });
    const targetExpirations = (withinRange.length ? withinRange : [initial.expirationDates[0]])
      .slice(0, MAX_EXPIRATIONS);

    const firstExp = initial.expirationDates[0];
    const allCalls: RawCall[] = [];
    const extraDates = targetExpirations.filter((d: string) => d !== firstExp);

    // Include the already-fetched first expiration's calls if it's in range.
    if (targetExpirations.includes(firstExp)) {
      allCalls.push(...initial.calls);
    }

    const extras = await Promise.all(
      extraDates.map((date: string) => getOptionsChain(upper, date).catch(() => null))
    );
    for (const chain of extras) {
      if (chain) allCalls.push(...chain.calls);
    }

    const sells = scoreSellCandidates(allCalls, underlying, dteRange);
    const buys = scoreBuyCandidates(allCalls, underlying, dteRange);

    return NextResponse.json({
      underlyingPrice: underlying,
      expirationsScanned: targetExpirations,
      dteRange,
      sells,
      buys,
    });
  } catch (error) {
    console.error('Call picks error:', error);
    return NextResponse.json({ error: 'Failed to compute call picks' }, { status: 500 });
  }
}
