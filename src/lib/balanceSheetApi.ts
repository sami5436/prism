// Balance Sheet Analyzer — Client-side API helpers

import { UploadResponse } from '@/types/balanceSheet';

const API_BASE = '/api/balance-sheet';

/**
 * Upload a balance sheet file (PDF, XBRL, XML) for analysis
 */
export async function uploadBalanceSheet(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    return {
      success: false,
      error: errorBody?.error || `Upload failed with status ${res.status}`,
    };
  }

  return res.json();
}

/**
 * Accepted file types for balance sheet upload
 */
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/xml': ['.xml'],
  'application/xml': ['.xml', '.xbrl'],
} as const;

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate a file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = file.name.toLowerCase().split('.').pop();
  const allowedExts = ['pdf', 'xml', 'xbrl'];

  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: `Unsupported file type (.${ext}). Accepted: PDF, XML, XBRL.` };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${MAX_FILE_SIZE_MB}MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true };
}
