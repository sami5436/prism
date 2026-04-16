// Balance Sheet Analyzer — Client-side API helpers

import { UploadResponse } from '@/types/balanceSheet';

const API_BASE = '/api/balance-sheet';

/** Look up a company by ticker symbol via SEC EDGAR. */
export async function analyzeByTicker(ticker: string): Promise<UploadResponse> {
  const res = await fetch(`${API_BASE}/ticker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker: ticker.trim().toUpperCase() }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    return {
      success: false,
      error: errorBody?.error || `Request failed with status ${res.status}`,
    };
  }

  return res.json();
}

/** Upload an XBRL or iXBRL HTML file for analysis. */
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

/** Fetch and analyse a balance sheet from a remote URL (HTM, HTML, XML, XBRL). */
export async function analyzeBalanceSheetUrl(url: string): Promise<UploadResponse> {
  const res = await fetch(`${API_BASE}/fetch-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    return {
      success: false,
      error: errorBody?.error || `Request failed with status ${res.status}`,
    };
  }

  return res.json();
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'Please enter a URL.' };
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
  } catch {
    return { valid: false, error: "That doesn't look like a valid URL." };
  }
  return { valid: true };
}

export const ACCEPTED_FILE_TYPES = {
  'text/xml': ['.xml'],
  'application/xml': ['.xml', '.xbrl'],
  'text/html': ['.htm', '.html'],
} as const;

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = file.name.toLowerCase().split('.').pop();
  const allowedExts = ['xml', 'xbrl', 'htm', 'html'];

  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: `Unsupported file type (.${ext}). Accepted: XML, XBRL, HTM, HTML.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${MAX_FILE_SIZE_MB}MB.` };
  }
  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }
  return { valid: true };
}
