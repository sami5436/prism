// Aggregate open interest and volume per strike across multiple expirations
// and return a strike ladder centered on the current price. Every output field
// is directly derived from the options chain — no Black-Scholes, no synthetic
// numbers. Strikes with no OI on either side are skipped.

import { daysToExpiration } from './optionsMath';

export interface RawOption {
  strike: number;
  openInterest: number;
  volume: number;
  expiration: string;
}

export interface StrikeLevel {
  strike: number;
  callOI: number;
  putOI: number;
  callVolume: number;
  putVolume: number;
  distancePct: number; // signed: negative below spot, positive above
}

export interface LevelsResult {
  underlyingPrice: number;
  expirationsUsed: string[];
  dteRange: { min: number; max: number };
  // Strikes within ±15% of spot, sorted by strike ascending.
  strikes: StrikeLevel[];
}

export interface AggregateInput {
  calls: RawOption[];
  puts: RawOption[];
  underlyingPrice: number;
  expirationsUsed: string[];
  dteRange: { min: number; max: number };
}

const BAND_PCT = 0.15;
const MAX_STRIKES = 25;

/**
 * Filter an expiration list to a DTE window. When more than maxCount match,
 * sample evenly across the range so a wide window (e.g. 1–365 DTE) gets
 * coverage from near-term to LEAPS instead of just the nearest N.
 */
export function selectExpirationsForLevels(
  allExpirations: string[],
  minDte: number,
  maxDte: number,
  now: Date = new Date(),
  maxCount = 24,
): string[] {
  const inRange = allExpirations.filter(d => {
    const dte = daysToExpiration(d, now);
    return dte >= minDte && dte <= maxDte;
  });
  if (inRange.length <= maxCount) return inRange;
  const step = (inRange.length - 1) / (maxCount - 1);
  const sampled: string[] = [];
  for (let i = 0; i < maxCount; i++) {
    sampled.push(inRange[Math.round(i * step)]);
  }
  return Array.from(new Set(sampled));
}

/**
 * Aggregate per-strike OI/volume and return a strike ladder around spot.
 *
 * Keeps strikes within ±15% of spot with OI > 0 on either side. If more than
 * MAX_STRIKES qualify, keeps the top MAX_STRIKES by total (call + put) OI and
 * re-sorts by strike ascending.
 */
export function aggregateLevels({
  calls,
  puts,
  underlyingPrice,
  expirationsUsed,
  dteRange,
}: AggregateInput): LevelsResult {
  if (underlyingPrice <= 0) {
    return { underlyingPrice, expirationsUsed, dteRange, strikes: [] };
  }

  const byStrike = new Map<number, StrikeLevel>();

  const touch = (strike: number): StrikeLevel => {
    const existing = byStrike.get(strike);
    if (existing) return existing;
    const fresh: StrikeLevel = {
      strike,
      callOI: 0,
      putOI: 0,
      callVolume: 0,
      putVolume: 0,
      distancePct: (strike - underlyingPrice) / underlyingPrice,
    };
    byStrike.set(strike, fresh);
    return fresh;
  };

  for (const c of calls) {
    if (c.strike <= 0) continue;
    const level = touch(c.strike);
    level.callOI += c.openInterest || 0;
    level.callVolume += c.volume || 0;
  }
  for (const p of puts) {
    if (p.strike <= 0) continue;
    const level = touch(p.strike);
    level.putOI += p.openInterest || 0;
    level.putVolume += p.volume || 0;
  }

  const inBand = Array.from(byStrike.values()).filter(
    l => Math.abs(l.distancePct) <= BAND_PCT && (l.callOI + l.putOI) > 0,
  );

  const trimmed =
    inBand.length > MAX_STRIKES
      ? inBand
          .slice()
          .sort((a, b) => b.callOI + b.putOI - (a.callOI + a.putOI))
          .slice(0, MAX_STRIKES)
      : inBand;

  const strikes = trimmed.sort((a, b) => a.strike - b.strike);

  return { underlyingPrice, expirationsUsed, dteRange, strikes };
}
