import { NextRequest, NextResponse } from 'next/server';
import { getOptionsChain } from '@/lib/yahooFinance';
import { rateLimitResponse } from '@/lib/rateLimit';
import { aggregateLevels, selectExpirationsForLevels, RawOption } from '@/lib/optionsLevels';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const limited = rateLimitResponse(request, { limit: 20, windowMs: 60_000, scope: 'levels' });
  if (limited) return limited;

  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol required' }, { status: 400 });
  }

  const upper = ticker.toUpperCase();

  const url = new URL(request.url);
  const minDteRaw = Number(url.searchParams.get('minDte'));
  const maxDteRaw = Number(url.searchParams.get('maxDte'));
  const minDte = Number.isFinite(minDteRaw) && minDteRaw >= 0 ? Math.floor(minDteRaw) : 7;
  const maxDte = Number.isFinite(maxDteRaw) && maxDteRaw >= minDte ? Math.floor(maxDteRaw) : 90;
  const dteRange = { min: minDte, max: maxDte };

  try {
    const initial = await getOptionsChain(upper);
    if (!initial) {
      return NextResponse.json({ error: 'No options chain available' }, { status: 404 });
    }

    const underlyingPrice = initial.underlyingPrice;
    const expirationsUsed = selectExpirationsForLevels(
      initial.expirationDates,
      minDte,
      maxDte,
    );

    if (expirationsUsed.length === 0) {
      return NextResponse.json(
        aggregateLevels({
          calls: [],
          puts: [],
          underlyingPrice,
          expirationsUsed: [],
          dteRange,
        }),
      );
    }

    const firstExp = initial.expirationDates[0];
    const calls: RawOption[] = [];
    const puts: RawOption[] = [];

    if (expirationsUsed.includes(firstExp)) {
      for (const c of initial.calls) {
        calls.push({
          strike: c.strike,
          openInterest: c.openInterest,
          volume: c.volume,
          expiration: c.expiration,
        });
      }
      for (const p of initial.puts) {
        puts.push({
          strike: p.strike,
          openInterest: p.openInterest,
          volume: p.volume,
          expiration: p.expiration,
        });
      }
    }

    const extras = await Promise.all(
      expirationsUsed
        .filter(d => d !== firstExp)
        .map(date => getOptionsChain(upper, date).catch(() => null)),
    );

    for (const chain of extras) {
      if (!chain) continue;
      for (const c of chain.calls) {
        calls.push({
          strike: c.strike,
          openInterest: c.openInterest,
          volume: c.volume,
          expiration: c.expiration,
        });
      }
      for (const p of chain.puts) {
        puts.push({
          strike: p.strike,
          openInterest: p.openInterest,
          volume: p.volume,
          expiration: p.expiration,
        });
      }
    }

    const result = aggregateLevels({
      calls,
      puts,
      underlyingPrice,
      expirationsUsed,
      dteRange,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Levels endpoint error:', error);
    return NextResponse.json({ error: 'Failed to compute price levels' }, { status: 500 });
  }
}
