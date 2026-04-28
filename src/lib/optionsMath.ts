// Black-Scholes delta + scoring helpers for call-contract screening.
// Yahoo Finance doesn't return greeks, so we compute delta from each
// contract's implied volatility. Good enough for ranking candidates.

const RISK_FREE_RATE = 0.045; // approximate 3-month T-bill

/** Abramowitz & Stegun normal CDF — accuracy ~7.5e-8, no deps. */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014337 * Math.exp(-(x * x) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

const NORMAL_PDF_COEFF = 0.3989422804014337; // 1/sqrt(2π)
function normalPdf(x: number): number {
  return NORMAL_PDF_COEFF * Math.exp(-(x * x) / 2);
}

/** Black-Scholes call price. */
export function bsCallPrice(
  spot: number,
  strike: number,
  yearsToExpiry: number,
  iv: number,
  rate: number = RISK_FREE_RATE,
): number {
  if (yearsToExpiry <= 0 || iv <= 0) return Math.max(0, spot - strike);
  const sqrtT = Math.sqrt(yearsToExpiry);
  const d1 = (Math.log(spot / strike) + (rate + (iv * iv) / 2) * yearsToExpiry) / (iv * sqrtT);
  const d2 = d1 - iv * sqrtT;
  return spot * normalCdf(d1) - strike * Math.exp(-rate * yearsToExpiry) * normalCdf(d2);
}

/**
 * Invert Black-Scholes for IV given a call's market price (Newton-Raphson,
 * starts at 30%, bounded [1%, 500%]). Returns null below intrinsic value or
 * if the solver leaves bounds — both signal a stale/garbage input price.
 */
export function impliedVolFromCall(
  spot: number,
  strike: number,
  yearsToExpiry: number,
  callPrice: number,
  rate: number = RISK_FREE_RATE,
): number | null {
  if (spot <= 0 || strike <= 0 || yearsToExpiry <= 0 || callPrice <= 0) return null;
  const intrinsic = Math.max(0, spot - strike * Math.exp(-rate * yearsToExpiry));
  if (callPrice < intrinsic - 1e-6) return null;

  let iv = 0.3;
  for (let i = 0; i < 50; i++) {
    const sqrtT = Math.sqrt(yearsToExpiry);
    const d1 = (Math.log(spot / strike) + (rate + (iv * iv) / 2) * yearsToExpiry) / (iv * sqrtT);
    const price = bsCallPrice(spot, strike, yearsToExpiry, iv, rate);
    const vega = spot * normalPdf(d1) * sqrtT;
    if (vega < 1e-8) return null;
    const diff = price - callPrice;
    if (Math.abs(diff) < 1e-4) return iv;
    iv -= diff / vega;
    if (iv < 0.01 || iv > 5) return null;
  }
  return null;
}

/** Call delta. Returns 0..1. */
export function callDelta(
  spot: number,
  strike: number,
  yearsToExpiry: number,
  iv: number,
  rate: number = RISK_FREE_RATE,
): number {
  if (yearsToExpiry <= 0 || iv <= 0 || spot <= 0 || strike <= 0) {
    return spot > strike ? 1 : 0;
  }
  const d1 =
    (Math.log(spot / strike) + (rate + (iv * iv) / 2) * yearsToExpiry) /
    (iv * Math.sqrt(yearsToExpiry));
  return normalCdf(d1);
}

export function daysToExpiration(expirationISO: string, now: Date = new Date()): number {
  const exp = new Date(expirationISO + 'T20:00:00Z'); // ~4pm ET close
  const ms = exp.getTime() - now.getTime();
  return Math.max(0, ms / 86_400_000);
}

export interface RawCall {
  contractSymbol: string;
  strike: number;
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  expiration: string;
}

export interface CallPick {
  contractSymbol: string;
  strike: number;
  expiration: string;
  dte: number;
  bid: number;
  ask: number;
  mid: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  // Sell metrics
  premiumYield?: number; // bid / underlying
  annualizedYield?: number; // premiumYield × (365/dte)
  // Buy metrics
  breakeven?: number;
  pctMoveNeeded?: number;
  // Shared
  score: number;
}

interface BuildInput {
  contract: RawCall;
  underlying: number;
}

function enrich({ contract, underlying }: BuildInput): CallPick | null {
  const dte = daysToExpiration(contract.expiration);
  if (dte <= 0) return null;
  if (!contract.impliedVolatility || contract.impliedVolatility <= 0) return null;

  const delta = callDelta(underlying, contract.strike, dte / 365, contract.impliedVolatility);
  const mid = contract.bid > 0 && contract.ask > 0 ? (contract.bid + contract.ask) / 2 : contract.lastPrice;

  return {
    contractSymbol: contract.contractSymbol,
    strike: contract.strike,
    expiration: contract.expiration,
    dte: Math.round(dte),
    bid: contract.bid,
    ask: contract.ask,
    mid,
    volume: contract.volume,
    openInterest: contract.openInterest,
    iv: contract.impliedVolatility,
    delta,
    score: 0,
  };
}

export interface DteRange {
  min: number;
  max: number;
}

export const DEFAULT_DTE: DteRange = { min: 15, max: 60 };

/**
 * Sell-call candidates: OTM, delta ~0.15–0.35, liquid, within DTE range.
 * Score = annualized premium yield × probability OTM.
 */
export function scoreSellCandidates(
  calls: RawCall[],
  underlying: number,
  dte: DteRange = DEFAULT_DTE,
): CallPick[] {
  const out: CallPick[] = [];
  for (const c of calls) {
    const p = enrich({ contract: c, underlying });
    if (!p) continue;
    if (p.strike <= underlying) continue;
    if (p.delta < 0.15 || p.delta > 0.35) continue;
    if (p.openInterest < 100) continue;
    if (p.bid < 0.1) continue;
    if (p.dte < dte.min || p.dte > dte.max) continue;

    p.premiumYield = p.bid / underlying;
    p.annualizedYield = p.premiumYield * (365 / p.dte);
    const probOtm = 1 - p.delta;
    p.score = p.annualizedYield * probOtm;
    out.push(p);
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Buy-call candidates: near-ATM, delta ~0.40–0.65, liquid, within DTE range.
 * Score favors leverage (delta / premium) over smaller required move.
 */
export function scoreBuyCandidates(
  calls: RawCall[],
  underlying: number,
  dte: DteRange = DEFAULT_DTE,
): CallPick[] {
  const out: CallPick[] = [];
  for (const c of calls) {
    const p = enrich({ contract: c, underlying });
    if (!p) continue;
    if (p.delta < 0.4 || p.delta > 0.65) continue;
    if (p.openInterest < 100) continue;
    if (p.ask < 0.1) continue;
    if (p.dte < dte.min || p.dte > dte.max) continue;

    p.breakeven = p.strike + p.ask;
    p.pctMoveNeeded = (p.breakeven - underlying) / underlying;
    // Leverage = delta per % of spot paid. Penalize large required moves.
    const leverage = p.delta / (p.ask / underlying);
    p.score = leverage * Math.max(0.1, 1 - Math.max(0, p.pctMoveNeeded));
    out.push(p);
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}
