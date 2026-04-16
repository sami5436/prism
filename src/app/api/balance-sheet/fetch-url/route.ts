import { NextRequest, NextResponse } from 'next/server';
import { parseXBRL } from '@/lib/balance-sheet/xbrlParser';
import { parseHTML } from '@/lib/balance-sheet/htmlParser';
import { buildResult, SourceType } from '@/lib/balance-sheet/pipeline';

const MAX_SIZE = 25 * 1024 * 1024;

// SEC EDGAR requires a descriptive User-Agent with contact info.
const FETCH_HEADERS = {
  'User-Agent': 'Prism Financial Tools sami5436@prism.local',
  'Accept': 'text/html,application/xml,*/*',
};

function pickSourceType(url: string, contentType: string | null): SourceType | null {
  const lowerUrl = url.toLowerCase().split('?')[0];
  const ct = (contentType || '').toLowerCase();

  if (lowerUrl.endsWith('.xbrl') || lowerUrl.endsWith('.xml') || ct.includes('xml')) {
    if (ct.includes('html')) return 'html';
    return 'xbrl';
  }
  if (lowerUrl.endsWith('.htm') || lowerUrl.endsWith('.html') || ct.includes('html')) return 'html';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const rawUrl: string | undefined = body?.url;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'No URL provided.' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL.' }, { status: 400 });
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ success: false, error: 'URL must use http or https.' }, { status: 400 });
    }

    // Block private network ranges (SSRF protection)
    const host = parsed.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return NextResponse.json({ success: false, error: 'URL host is not allowed.' }, { status: 400 });
    }

    const res = await fetch(parsed.toString(), { headers: FETCH_HEADERS, redirect: 'follow' });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL (${res.status} ${res.statusText}).` },
        { status: 400 }
      );
    }

    const contentType = res.headers.get('content-type');
    const sourceType = pickSourceType(parsed.toString(), contentType);
    if (!sourceType) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported content type (${contentType || 'unknown'}). Expected HTM/HTML or XML/XBRL. For PDFs, use the ticker lookup instead.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json({ success: false, error: 'Fetched document is empty.' }, { status: 400 });
    }
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'Fetched document exceeds 25MB limit.' }, { status: 400 });
    }

    const text = Buffer.from(arrayBuffer).toString('utf-8');
    const rawExtraction = sourceType === 'html' ? parseHTML(text) : parseXBRL(text);

    return NextResponse.json({ success: true, data: buildResult(rawExtraction, sourceType) });
  } catch (error) {
    console.error('Balance sheet URL fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyse the URL. The document may not contain recognisable balance sheet data.' },
      { status: 500 }
    );
  }
}
