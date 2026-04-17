// Simple in-memory token-bucket rate limiter keyed by IP.
//
// Same serverless caveat as src/lib/cache.ts — swap for Upstash/Vercel KV if
// you need shared state across instances. For single-process or warm serverless
// this is adequate to stop casual abuse and protect upstream quota.

import { NextRequest, NextResponse } from 'next/server';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Periodic sweep so we don't retain buckets for IPs that haven't returned.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now - b.lastRefill > SWEEP_INTERVAL_MS * 2) buckets.delete(k);
  }
}

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Optional scope so /call-picks and /iv-rank have independent buckets. */
  scope?: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${opts.scope ?? 'default'}::${clientIp(req)}`;
  const refillRate = opts.limit / opts.windowMs; // tokens per ms

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: opts.limit, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(opts.limit, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
  }

  const msUntilOneToken = Math.ceil((1 - bucket.tokens) / refillRate);
  return { ok: false, remaining: 0, retryAfterMs: msUntilOneToken };
}

/** Returns a 429 response preconfigured with Retry-After — or null if the caller is under limit. */
export function rateLimitResponse(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const result = rateLimit(req, opts);
  if (result.ok) return null;
  const retryAfterSec = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(opts.limit),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}
