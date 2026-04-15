import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.BALANCE_SHEET_SERVICE_URL || 'http://localhost:8000';

/**
 * Proxy file uploads to the Python balance-sheet service.
 * In production, the Next.js rewrite in next.config.ts handles this automatically.
 * This route serves as a direct fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const proxyFormData = new FormData();
    proxyFormData.append('file', file);

    const response = await fetch(`${PYTHON_SERVICE_URL}/api/upload`, {
      method: 'POST',
      body: proxyFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Analysis service error' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Balance sheet upload proxy error:', error);

    const isConnectionError =
      error instanceof TypeError && error.message.includes('fetch');

    return NextResponse.json(
      {
        success: false,
        error: isConnectionError
          ? 'Analysis service is unavailable. Please ensure the Python service is running.'
          : 'An unexpected error occurred during analysis.',
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
