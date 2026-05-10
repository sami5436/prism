// API route for the Compare module.
// /api/compare/VOO,QQQ,VTI?years=15
// Always includes the S&P 500 (^GSPC) as a benchmark unless one of the
// requested symbols already is the S&P (in which case it's just the primary).

import { NextRequest, NextResponse } from 'next/server';
import {
  getQuote,
  getLongHistoricalData,
  getFundProfile,
} from '@/lib/yahooFinance';

const BENCHMARK_SYMBOL = '^GSPC';
const BENCHMARK_LABEL = 'S&P 500';

const SP500_ALIASES = new Set(['^GSPC', 'SPY', 'VOO', 'IVV']);

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.toUpperCase();
    if (!seen.has(k) && k.length > 0) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

async function fetchAsset(symbol: string, years: number) {
  const [quote, historical, profile] = await Promise.all([
    getQuote(symbol).catch(() => null),
    getLongHistoricalData(symbol, years).catch(() => []),
    getFundProfile(symbol).catch(() => null),
  ]);

  if (!quote && historical.length === 0) {
    return { symbol, error: 'No data available' as const };
  }

  return {
    symbol,
    quote,
    historical,
    profile,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tickers: string }> },
) {
  const { tickers } = await params;
  // Default to 25y so the 2008 Financial Crisis (started Oct 2007) is always
  // covered for funds that existed back then, even though displayed CAGRs
  // only go up to 15y.
  const yearsParam = Number(request.nextUrl.searchParams.get('years') || '25');
  const years = Number.isFinite(yearsParam) ? Math.min(30, Math.max(1, yearsParam)) : 25;

  const symbols = dedupe(decodeURIComponent(tickers).split(',').map(s => s.trim()));
  if (symbols.length === 0) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
  }
  if (symbols.length > 6) {
    return NextResponse.json({ error: 'Too many tickers (max 6)' }, { status: 400 });
  }

  // Add benchmark unless the user already picked an S&P proxy (we'll still keep
  // the user pick — the benchmark just won't be added separately).
  const userHasSp = symbols.some(s => SP500_ALIASES.has(s));
  const allSymbols = userHasSp ? symbols : [...symbols, BENCHMARK_SYMBOL];

  try {
    const assets = await Promise.all(allSymbols.map(s => fetchAsset(s, years)));
    return NextResponse.json({
      requestedSymbols: symbols,
      benchmarkSymbol: userHasSp ? null : BENCHMARK_SYMBOL,
      benchmarkLabel: BENCHMARK_LABEL,
      years,
      assets,
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
  }
}
