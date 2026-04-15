import { NextRequest, NextResponse } from 'next/server';
import { parsePDF } from '@/lib/balance-sheet/pdfParser';
import { parseXBRL } from '@/lib/balance-sheet/xbrlParser';
import { normalize } from '@/lib/balance-sheet/normalize';
import { computeRatios } from '@/lib/balance-sheet/ratios';
import { generateSummary } from '@/lib/balance-sheet/summary';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.xml', '.xbrl']);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate extension
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ success: false, error: `Unsupported file type (${ext}). Accepted: PDF, XML, XBRL.` }, { status: 400 });
    }

    // Validate size
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: `File too large. Maximum: 25MB.` }, { status: 400 });
    }
    if (buffer.length === 0) {
      return NextResponse.json({ success: false, error: 'File is empty.' }, { status: 400 });
    }

    // Parse based on file type
    const rawExtraction = ext === '.pdf'
      ? await parsePDF(buffer)
      : parseXBRL(buffer.toString('utf-8'));

    // Normalize
    const periods = normalize(rawExtraction);

    // Compute ratios
    const ratios = computeRatios(periods);

    // Generate summary
    const summary = generateSummary(periods, ratios);

    // Aggregate confidence
    const allConf = periods.flatMap(p => p.confidence.map(c => c.confidence));
    const overallConfidence = allConf.length ? Math.round(allConf.reduce((a, b) => a + b, 0) / allConf.length) : 0;

    // Map to camelCase for the frontend
    const result = {
      companyName: rawExtraction.companyName,
      filingDate: rawExtraction.filingDate,
      currency: rawExtraction.currency,
      unit: rawExtraction.unit,
      periods: periods.map(p => ({
        label: p.label,
        lineItems: {
          cashAndEquivalents: p.lineItems.cash_and_equivalents ?? null,
          shortTermInvestments: p.lineItems.short_term_investments ?? null,
          accountsReceivable: p.lineItems.accounts_receivable ?? null,
          inventory: p.lineItems.inventory ?? null,
          totalCurrentAssets: p.lineItems.total_current_assets ?? null,
          propertyPlantEquipment: p.lineItems.property_plant_equipment ?? null,
          goodwill: p.lineItems.goodwill ?? null,
          intangibleAssets: p.lineItems.intangible_assets ?? null,
          totalAssets: p.lineItems.total_assets ?? null,
          accountsPayable: p.lineItems.accounts_payable ?? null,
          shortTermDebt: p.lineItems.short_term_debt ?? null,
          totalCurrentLiabilities: p.lineItems.total_current_liabilities ?? null,
          longTermDebt: p.lineItems.long_term_debt ?? null,
          totalLiabilities: p.lineItems.total_liabilities ?? null,
          retainedEarnings: p.lineItems.retained_earnings ?? null,
          totalEquity: p.lineItems.total_equity ?? null,
        },
        confidence: p.confidence,
      })),
      ratios,
      summary,
      sourceType: ext === '.pdf' ? 'pdf' : 'xbrl',
      overallConfidence,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Balance sheet analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed. The file may not contain recognizable balance sheet data.' },
      { status: 500 }
    );
  }
}
