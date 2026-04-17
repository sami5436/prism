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

/** Pick the call contract whose strike is closest to the underlying price. */
export function atmCallIV(
  calls: { strike: number; impliedVolatility: number }[],
  underlyingPrice: number,
): number | null {
  if (!calls.length || !underlyingPrice) return null;
  let best = calls[0];
  let bestDiff = Math.abs(best.strike - underlyingPrice);
  for (const c of calls) {
    const diff = Math.abs(c.strike - underlyingPrice);
    if (diff < bestDiff) {
      best = c;
      bestDiff = diff;
    }
  }
  return best.impliedVolatility > 0 ? best.impliedVolatility : null;
}
