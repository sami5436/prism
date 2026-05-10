// Math helpers for the Compare module.
// Inputs assume an array of { date: 'YYYY-MM-DD', close: number } sorted ascending.

export interface PricePoint {
  date: string;
  close: number;
}

export interface CrisisWindow {
  id: string;
  label: string;
  start: string; // inclusive
  end: string;   // inclusive
  blurb: string; // short user-facing description
}

// User-selected crisis windows. Dates are intentionally generous on the right
// edge so a fund that recovered later still has its trough captured.
export const CRISIS_WINDOWS: CrisisWindow[] = [
  {
    id: 'gfc-2008',
    label: '2008 Financial Crisis',
    start: '2007-10-09',
    end: '2009-03-09',
    blurb: 'Peak-to-trough during the global financial crisis.',
  },
  {
    id: 'covid-2020',
    label: 'COVID Crash',
    start: '2020-02-19',
    end: '2020-03-23',
    blurb: 'Fast 30%+ drawdown over five weeks in early 2020.',
  },
  {
    id: 'bear-2022',
    label: '2022 Bear Market',
    start: '2022-01-03',
    end: '2022-10-12',
    blurb: 'Inflation and rate-hike-driven decline through 2022.',
  },
  {
    id: 'tariff-iran-2025',
    label: '2025 Tariff & Iran Volatility',
    start: '2025-04-01',
    end: '2025-06-30',
    blurb: 'April tariff selloff and June Iran-related volatility.',
  },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toMs(date: string): number {
  return new Date(date + 'T00:00:00Z').getTime();
}

/** First index where points[i].date >= target. -1 if none. */
function firstIndexFromDate(points: PricePoint[], target: string): number {
  const t = toMs(target);
  for (let i = 0; i < points.length; i++) {
    if (toMs(points[i].date) >= t) return i;
  }
  return -1;
}

/** Last index where points[i].date <= target. -1 if none. */
function lastIndexUpTo(points: PricePoint[], target: string): number {
  const t = toMs(target);
  let answer = -1;
  for (let i = 0; i < points.length; i++) {
    if (toMs(points[i].date) <= t) answer = i;
    else break;
  }
  return answer;
}

/** Trailing CAGR over `years`. Returns null if the series is shorter than that. */
export function trailingCAGR(points: PricePoint[], years: number): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const targetMs = toMs(last.date) - years * 365.25 * MS_PER_DAY;
  // Find the first point at or after the target date — but only if we have data
  // that old. If the earliest point is later than the target, we don't have
  // enough history for this period.
  if (toMs(points[0].date) > targetMs + 30 * MS_PER_DAY) return null;

  // Snap to closest point >= target.
  let startIdx = 0;
  for (let i = 0; i < points.length; i++) {
    if (toMs(points[i].date) >= targetMs) {
      startIdx = i;
      break;
    }
  }
  const start = points[startIdx];
  if (start.close <= 0 || last.close <= 0) return null;
  const actualYears = (toMs(last.date) - toMs(start.date)) / (365.25 * MS_PER_DAY);
  if (actualYears <= 0.05) return null;
  return Math.pow(last.close / start.close, 1 / actualYears) - 1;
}

/** Total return % over a window between two ISO dates (inclusive). */
export function totalReturnInWindow(
  points: PricePoint[],
  start: string,
  end: string,
): number | null {
  if (points.length === 0) return null;
  const startIdx = firstIndexFromDate(points, start);
  const endIdx = lastIndexUpTo(points, end);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  const a = points[startIdx].close;
  const b = points[endIdx].close;
  if (a <= 0) return null;
  return b / a - 1;
}

/**
 * Peak-to-trough drawdown within a window. Looks for the lowest close after
 * the running peak inside [start, end]. Returns a non-positive number, e.g.
 * -0.34 for -34%. null if window has no data.
 */
export function maxDrawdownInWindow(
  points: PricePoint[],
  start: string,
  end: string,
): { drawdown: number; peakDate: string; troughDate: string } | null {
  if (points.length === 0) return null;
  const startIdx = firstIndexFromDate(points, start);
  const endIdx = lastIndexUpTo(points, end);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;

  let peak = points[startIdx].close;
  let peakDate = points[startIdx].date;
  let worstDD = 0;
  let worstPeakDate = peakDate;
  let worstTroughDate = peakDate;

  for (let i = startIdx; i <= endIdx; i++) {
    const p = points[i];
    if (p.close > peak) {
      peak = p.close;
      peakDate = p.date;
    }
    if (peak > 0) {
      const dd = p.close / peak - 1;
      if (dd < worstDD) {
        worstDD = dd;
        worstPeakDate = peakDate;
        worstTroughDate = p.date;
      }
    }
  }

  return { drawdown: worstDD, peakDate: worstPeakDate, troughDate: worstTroughDate };
}

/**
 * Normalize a series so the first point equals `initial` (e.g. $10,000),
 * sampled to at most `maxPoints` for chart rendering. Returns aligned
 * series across multiple inputs by date intersection.
 */
export function alignedGrowthSeries(
  series: { id: string; points: PricePoint[] }[],
  initial: number,
  maxPoints = 400,
): { date: string; values: Record<string, number> }[] {
  if (series.length === 0) return [];

  // Find the latest "first date" — that's the earliest date all series cover.
  let commonStart = series[0].points[0]?.date ?? '';
  for (const s of series) {
    const first = s.points[0]?.date;
    if (!first) return [];
    if (first > commonStart) commonStart = first;
  }

  // Build a single date axis from the longest series, restricted to >= commonStart.
  const longest = series.reduce((a, b) => (a.points.length >= b.points.length ? a : b));
  const axis = longest.points.filter(p => p.date >= commonStart).map(p => p.date);

  // Per-series base price at commonStart.
  const bases: Record<string, number> = {};
  for (const s of series) {
    const idx = firstIndexFromDate(s.points, commonStart);
    bases[s.id] = idx === -1 ? s.points[0]?.close ?? 0 : s.points[idx].close;
  }

  // Build a quick lookup per series for date → close.
  const lookup: Record<string, Map<string, number>> = {};
  for (const s of series) {
    const m = new Map<string, number>();
    for (const p of s.points) m.set(p.date, p.close);
    lookup[s.id] = m;
  }

  // Carry-forward last known close per series so a missing weekly bar
  // doesn't break the line.
  const carry: Record<string, number> = {};
  for (const s of series) carry[s.id] = bases[s.id];

  const rows: { date: string; values: Record<string, number> }[] = [];
  for (const date of axis) {
    const values: Record<string, number> = {};
    for (const s of series) {
      const close = lookup[s.id].get(date);
      if (typeof close === 'number') carry[s.id] = close;
      const base = bases[s.id];
      values[s.id] = base > 0 ? (carry[s.id] / base) * initial : initial;
    }
    rows.push({ date, values });
  }

  // Downsample evenly to keep the chart light.
  if (rows.length > maxPoints) {
    const step = Math.ceil(rows.length / maxPoints);
    const downsampled: typeof rows = [];
    for (let i = 0; i < rows.length; i += step) downsampled.push(rows[i]);
    // Always include the last point.
    if (downsampled[downsampled.length - 1] !== rows[rows.length - 1]) {
      downsampled.push(rows[rows.length - 1]);
    }
    return downsampled;
  }
  return rows;
}

/**
 * Monte Carlo cone using bootstrapped historical periodic returns.
 * - Resamples weekly log returns from the trailing `lookbackYears` of data
 *   (or all of it if shorter).
 * - Returns p10 / median / p90 trajectories at evenly-spaced future dates.
 *
 * `paths` is the number of simulations per percentile. 1500 is fine — we're
 * computing percentiles, not means, so noise is small.
 */
export function monteCarloCone(
  points: PricePoint[],
  initialValue: number,
  horizonYears: number,
  options: { paths?: number; lookbackYears?: number; samplesOut?: number } = {},
): {
  dates: string[];
  p10: number[];
  median: number[];
  p90: number[];
  finalP10: number;
  finalMedian: number;
  finalP90: number;
} | null {
  const paths = options.paths ?? 1500;
  const lookbackYears = options.lookbackYears ?? 10;
  const samplesOut = options.samplesOut ?? 60;

  if (points.length < 30) return null;

  // Build weekly log returns from the trailing window.
  const cutoffMs = toMs(points[points.length - 1].date) - lookbackYears * 365.25 * MS_PER_DAY;
  const window = points.filter(p => toMs(p.date) >= cutoffMs);
  const series = window.length >= 30 ? window : points;

  const logReturns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].close;
    const curr = series[i].close;
    if (prev > 0 && curr > 0) logReturns.push(Math.log(curr / prev));
  }
  if (logReturns.length < 20) return null;

  // Determine the periodic step (avg days between samples) so the horizon
  // maps to roughly the right number of steps.
  const totalDays = (toMs(series[series.length - 1].date) - toMs(series[0].date)) / MS_PER_DAY;
  const avgStepDays = Math.max(1, totalDays / Math.max(1, series.length - 1));
  const totalSteps = Math.max(2, Math.round((horizonYears * 365.25) / avgStepDays));

  // Bucket positions where we want percentiles (including final).
  const stride = Math.max(1, Math.floor(totalSteps / samplesOut));
  const sampleSteps: number[] = [];
  for (let s = stride; s <= totalSteps; s += stride) sampleSteps.push(s);
  if (sampleSteps[sampleSteps.length - 1] !== totalSteps) sampleSteps.push(totalSteps);

  // Run simulations, recording log price (we exponentiate at the end).
  const sampleValues: number[][] = sampleSteps.map(() => new Array(paths));
  for (let p = 0; p < paths; p++) {
    let logVal = Math.log(initialValue);
    let nextSampleIdx = 0;
    let nextSampleAt = sampleSteps[0];
    for (let s = 1; s <= totalSteps; s++) {
      logVal += logReturns[Math.floor(Math.random() * logReturns.length)];
      while (nextSampleAt !== undefined && s === nextSampleAt) {
        sampleValues[nextSampleIdx][p] = Math.exp(logVal);
        nextSampleIdx++;
        nextSampleAt = sampleSteps[nextSampleIdx];
      }
    }
  }

  // Sort each sample column once, pull percentiles.
  const p10: number[] = [];
  const median: number[] = [];
  const p90: number[] = [];
  for (const col of sampleValues) {
    col.sort((a, b) => a - b);
    p10.push(col[Math.floor(paths * 0.1)]);
    median.push(col[Math.floor(paths * 0.5)]);
    p90.push(col[Math.floor(paths * 0.9)]);
  }

  // Future dates corresponding to each sample step.
  const lastDateMs = toMs(points[points.length - 1].date);
  const dates = sampleSteps.map(s => {
    const ms = lastDateMs + s * avgStepDays * MS_PER_DAY;
    return new Date(ms).toISOString().split('T')[0];
  });

  return {
    dates,
    p10,
    median,
    p90,
    finalP10: p10[p10.length - 1],
    finalMedian: median[median.length - 1],
    finalP90: p90[p90.length - 1],
  };
}

/**
 * Build a date → log-return map from a price series. The date is the END of
 * the period (i.e. the bar where the return is realized).
 */
export function logReturnsByDate(points: PricePoint[]): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].close;
    const curr = points[i].close;
    if (prev > 0 && curr > 0) out.set(points[i].date, Math.log(curr / prev));
  }
  return out;
}

/** Pearson correlation. Returns null if not enough overlapping data. */
export function pearsonCorrelation(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 30) return null;
  const n = a.length;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  const den = Math.sqrt(varA * varB);
  if (den === 0) return null;
  return cov / den;
}

/**
 * Build a correlation matrix across multiple price series. Aligns on the
 * intersection of dates that all series share (so a fund with shorter history
 * still gets correlated against everyone over the common window).
 *
 * `lookbackYears` caps the window from the most-recent shared date.
 */
export function correlationMatrix(
  series: { id: string; points: PricePoint[] }[],
  lookbackYears = 5,
): {
  ids: string[];
  matrix: (number | null)[][];
  observationCount: number;
  windowStart: string | null;
  windowEnd: string | null;
} {
  const ids = series.map(s => s.id);
  const returns = series.map(s => logReturnsByDate(s.points));

  if (returns.length === 0) {
    return { ids, matrix: [], observationCount: 0, windowStart: null, windowEnd: null };
  }

  // Intersection of dates across all series.
  let common = new Set(returns[0].keys());
  for (let i = 1; i < returns.length; i++) {
    const next = new Set<string>();
    for (const d of common) if (returns[i].has(d)) next.add(d);
    common = next;
  }
  let dates = Array.from(common).sort();

  // Cap to lookback window from the latest shared date.
  if (dates.length > 0) {
    const lastMs = new Date(dates[dates.length - 1] + 'T00:00:00Z').getTime();
    const cutoffMs = lastMs - lookbackYears * 365.25 * 24 * 60 * 60 * 1000;
    dates = dates.filter(d => new Date(d + 'T00:00:00Z').getTime() >= cutoffMs);
  }

  // Aligned arrays per series.
  const aligned = returns.map(m => dates.map(d => m.get(d)!));

  const n = ids.length;
  const matrix: (number | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const c = i === j ? 1 : pearsonCorrelation(aligned[i], aligned[j]);
      matrix[i][j] = c;
      matrix[j][i] = c;
    }
  }

  return {
    ids,
    matrix,
    observationCount: dates.length,
    windowStart: dates[0] ?? null,
    windowEnd: dates[dates.length - 1] ?? null,
  };
}

/** Annualized stddev of weekly log returns × √(periods/yr). */
export function annualizedVolatility(points: PricePoint[]): number | null {
  if (points.length < 30) return null;
  const rets: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].close;
    const curr = points[i].close;
    if (prev > 0 && curr > 0) rets.push(Math.log(curr / prev));
  }
  if (rets.length < 20) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (rets.length - 1);
  const sd = Math.sqrt(variance);
  // Infer periods/year from average spacing.
  const totalDays = (toMs(points[points.length - 1].date) - toMs(points[0].date)) / MS_PER_DAY;
  const avgStepDays = Math.max(1, totalDays / Math.max(1, points.length - 1));
  const periodsPerYear = 365.25 / avgStepDays;
  return sd * Math.sqrt(periodsPerYear);
}
