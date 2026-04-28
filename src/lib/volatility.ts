// Volatility analytics — realized-vol-based IV Rank / Percentile proxy.
// Since Yahoo Finance doesn't expose historical implied volatility, we use
// 30-day annualized realized volatility (HV) over the trailing year as the
// ranking basis, then compare current ATM IV against current HV to gauge
// whether options are priced rich or cheap.

const TRADING_DAYS_PER_YEAR = 252;
const HV_WINDOW = 30;

export interface VolSeriesPoint {
  date: string;
  hv: number; // annualized
}

export interface IVRankResult {
  currentHV: number;           // today's 30d annualized HV (e.g. 0.28 = 28%)
  hv52wLow: number;
  hv52wHigh: number;
  hvRank: number;              // 0–100
  hvPercentile: number;        // 0–100
  currentIV: number | null;    // ATM call IV from chain
  ivHvRatio: number | null;    // currentIV / currentHV
  interpretation: 'rich' | 'cheap' | 'neutral' | 'insufficient_data';
  series: VolSeriesPoint[];    // for sparkline rendering
}

/** Annualized log-return standard deviation over a trailing window. */
export function rollingRealizedVol(
  closes: { date: string; close: number }[],
  window: number = HV_WINDOW,
): VolSeriesPoint[] {
  if (closes.length < window + 1) return [];

  const logReturns: { date: string; r: number }[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1].close;
    const curr = closes[i].close;
    if (prev > 0 && curr > 0) {
      logReturns.push({ date: closes[i].date, r: Math.log(curr / prev) });
    }
  }

  const out: VolSeriesPoint[] = [];
  for (let i = window - 1; i < logReturns.length; i++) {
    const slice = logReturns.slice(i - window + 1, i + 1);
    const mean = slice.reduce((s, x) => s + x.r, 0) / slice.length;
    const variance = slice.reduce((s, x) => s + (x.r - mean) ** 2, 0) / (slice.length - 1);
    const hv = Math.sqrt(variance * TRADING_DAYS_PER_YEAR);
    out.push({ date: slice[slice.length - 1].date, hv });
  }
  return out;
}

/**
 * IV Rank = (current − min) / (max − min) × 100 over a 1y window.
 * IV Percentile = share of days in the window where HV ≤ current.
 */
export function computeIVRank(
  series: VolSeriesPoint[],
  currentIV: number | null,
): IVRankResult {
  if (series.length < 20) {
    return {
      currentHV: 0,
      hv52wLow: 0,
      hv52wHigh: 0,
      hvRank: 0,
      hvPercentile: 0,
      currentIV,
      ivHvRatio: null,
      interpretation: 'insufficient_data',
      series,
    };
  }

  // Trailing year — cap at 252 points
  const trailing = series.slice(-TRADING_DAYS_PER_YEAR);
  const hvs = trailing.map(p => p.hv);
  const currentHV = hvs[hvs.length - 1];
  const hv52wLow = Math.min(...hvs);
  const hv52wHigh = Math.max(...hvs);

  const hvRank = hv52wHigh === hv52wLow
    ? 50
    : ((currentHV - hv52wLow) / (hv52wHigh - hv52wLow)) * 100;

  const belowOrEqual = hvs.filter(v => v <= currentHV).length;
  const hvPercentile = (belowOrEqual / hvs.length) * 100;

  const ivHvRatio = currentIV && currentHV > 0 ? currentIV / currentHV : null;

  // Interpretation: richness relative to realized vol is the actionable signal.
  // > 1.3 → IV premium high → favor selling; < 0.9 → IV discount → favor buying.
  let interpretation: IVRankResult['interpretation'] = 'neutral';
  if (ivHvRatio != null) {
    if (ivHvRatio >= 1.3) interpretation = 'rich';
    else if (ivHvRatio <= 0.9) interpretation = 'cheap';
  }

  return {
    currentHV,
    hv52wLow,
    hv52wHigh,
    hvRank: Math.round(hvRank * 10) / 10,
    hvPercentile: Math.round(hvPercentile * 10) / 10,
    currentIV,
    ivHvRatio: ivHvRatio != null ? Math.round(ivHvRatio * 100) / 100 : null,
    interpretation,
    series: trailing,
  };
}

/**
 * Pick the expiration closest to a target DTE (default ~30) so the IV we
 * sample is on the same time horizon as the 30-day HV we compare it to.
 * Prefers expirations >= 7 DTE to avoid 0DTE pin risk and weekend skew.
 */
export function selectIVExpiration(
  expirations: string[],
  targetDte = 30,
  now: Date = new Date(),
): string | null {
  if (!expirations.length) return null;
  const today = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z').getTime();
  const dted = expirations
    .map(d => ({
      date: d,
      dte: Math.round((new Date(d + 'T00:00:00Z').getTime() - today) / (1000 * 60 * 60 * 24)),
    }))
    .filter(e => e.dte >= 0);
  if (!dted.length) return null;
  const liquid = dted.filter(e => e.dte >= 7);
  const pool = liquid.length ? liquid : dted;
  pool.sort((a, b) => Math.abs(a.dte - targetDte) - Math.abs(b.dte - targetDte));
  return pool[0].date;
}

/**
 * Average IV of liquid calls within ±2.5% of spot. Filters out contracts with
 * zero IV (Yahoo placeholder), zero OI, and zero bid (untradeable). One stale
 * contract pinning IV to 80% should not move the answer.
 */
export function atmCallIV(
  calls: {
    strike: number;
    impliedVolatility: number;
    openInterest?: number;
    bid?: number;
    ask?: number;
  }[],
  underlyingPrice: number,
): number | null {
  if (!calls.length || !underlyingPrice) return null;

  const isLiquid = (c: { openInterest?: number; bid?: number; ask?: number }) => {
    const oi = c.openInterest ?? 0;
    const bid = c.bid ?? 0;
    const ask = c.ask ?? 0;
    if (oi < 10) return false;
    if (bid <= 0) return false;
    if (ask <= 0) return false;
    // Reject absurd bid-ask spreads (>50% of mid) — IV from those is noise.
    const mid = (bid + ask) / 2;
    if (mid > 0 && (ask - bid) / mid > 0.5) return false;
    return true;
  };

  const valid = calls.filter(c => c.impliedVolatility > 0 && c.strike > 0);
  if (!valid.length) return null;

  const inBand = valid.filter(
    c => Math.abs(c.strike - underlyingPrice) / underlyingPrice <= 0.025,
  );
  const candidates = inBand.length >= 2 ? inBand : valid;
  const liquid = candidates.filter(isLiquid);
  const pool = liquid.length >= 2 ? liquid : candidates;

  // Sort by distance to spot, take the 3 nearest, average.
  const nearest = pool
    .slice()
    .sort((a, b) => Math.abs(a.strike - underlyingPrice) - Math.abs(b.strike - underlyingPrice))
    .slice(0, 3);

  if (!nearest.length) return null;
  const avg = nearest.reduce((s, c) => s + c.impliedVolatility, 0) / nearest.length;
  return avg > 0 ? avg : null;
}
