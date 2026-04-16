import { NextRequest, NextResponse } from 'next/server';
import { parseXBRL } from '@/lib/balance-sheet/xbrlParser';
import { parseHTML } from '@/lib/balance-sheet/htmlParser';
import { buildResult, SourceType } from '@/lib/balance-sheet/pipeline';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.xml', '.xbrl', '.htm', '.html']);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type (${ext}). Accepted: HTM, HTML, XML, XBRL.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum: 25MB.' }, { status: 400 });
    }
    if (buffer.length === 0) {
      return NextResponse.json({ success: false, error: 'File is empty.' }, { status: 400 });
    }

    const text = buffer.toString('utf-8');
    let rawExtraction;
    let sourceType: SourceType;

    if (ext === '.htm' || ext === '.html') {
      rawExtraction = parseHTML(text);
      sourceType = 'html';
    } else {
      rawExtraction = parseXBRL(text);
      sourceType = 'xbrl';
    }

    return NextResponse.json({ success: true, data: buildResult(rawExtraction, sourceType) });
  } catch (error) {
    console.error('Balance sheet upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed. The file may not contain recognisable balance sheet data.' },
      { status: 500 }
    );
  }
}
