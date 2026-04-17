import { NextRequest, NextResponse } from 'next/server';
import { lookupCik, fetchCompanyFacts, companyFactsToRawExtraction } from '@/lib/balance-sheet/edgarApi';
import { buildResult } from '@/lib/balance-sheet/pipeline';
import { rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = rateLimitResponse(request, { limit: 20, windowMs: 60_000, scope: 'bs-ticker' });
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    const ticker: string | undefined = body?.ticker;

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json({ success: false, error: 'No ticker provided.' }, { status: 400 });
    }

    const sanitized = ticker.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(sanitized)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ticker. Use 1–5 uppercase letters (e.g. AAPL).' },
        { status: 400 }
      );
    }

    const cik = await lookupCik(sanitized);
    if (!cik) {
      return NextResponse.json(
        { success: false, error: `Ticker "${sanitized}" not found in SEC EDGAR.` },
        { status: 404 }
      );
    }

    const facts = await fetchCompanyFacts(cik);
    const rawExtraction = companyFactsToRawExtraction(facts);

    return NextResponse.json({ success: true, data: buildResult(rawExtraction, 'xbrl') });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Ticker analysis error:', message);
    return NextResponse.json(
      { success: false, error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
