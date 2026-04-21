// Deterministic SWOT + forward-looking analysis for income / cash-flow data.
// Rule-based, no LLM. Same pattern as the balance-sheet summary module.

import type {
  FinancialsPeriod,
  IncomeRatios,
  CashFlowRatios,
  FinancialsSummary,
} from './types';
import type { SWOTItem, AnalysisFlag, ForwardSignal } from '../balance-sheet/types';

function fmt(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}T`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}B`;
  return `${sign}$${abs.toFixed(1)}M`;
}

function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function yoyPct(curr: number | null | undefined, prev: number | null | undefined): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

function buildSWOT(
  periods: FinancialsPeriod[],
  income: IncomeRatios,
  cashFlow: CashFlowRatios,
): { strengths: SWOTItem[]; weaknesses: SWOTItem[]; opportunities: SWOTItem[]; threats: SWOTItem[] } {
  const strengths: SWOTItem[] = [];
  const weaknesses: SWOTItem[] = [];
  const opportunities: SWOTItem[] = [];
  const threats: SWOTItem[] = [];

  const curr = periods[0];
  const prev = periods[1];
  const twoPrev = periods[2];

  // ── Margins ──
  if (income.grossMargin != null) {
    if (income.grossMargin > 0.6) {
      strengths.push({
        id: 's_gross_margin',
        label: 'High gross margin',
        detail: `Gross margin of ${pct(income.grossMargin)} signals pricing power and/or low marginal cost — the hallmark of a business with real economic moats (software, premium brands, platforms).`,
        metric: 'gross_margin', value: income.grossMargin,
      });
    } else if (income.grossMargin < 0.2 && income.grossMargin > 0) {
      weaknesses.push({
        id: 'w_thin_gross',
        label: 'Thin gross margin',
        detail: `Gross margin of ${pct(income.grossMargin)} leaves little room for OpEx, interest, and taxes. Small input-cost moves hit the bottom line disproportionately.`,
        metric: 'gross_margin', value: income.grossMargin,
      });
    } else if (income.grossMargin <= 0) {
      weaknesses.push({
        id: 'w_negative_gross',
        label: 'Negative gross margin',
        detail: `Revenue doesn't cover the direct cost of producing it. Either pricing is broken or unit economics aren't yet viable at scale.`,
        metric: 'gross_margin', value: income.grossMargin,
      });
    }
  }

  if (income.operatingMargin != null) {
    if (income.operatingMargin > 0.25) {
      strengths.push({
        id: 's_op_margin',
        label: 'Strong operating margin',
        detail: `Operating margin of ${pct(income.operatingMargin)} means the core business converts revenue to profit efficiently — before financing and tax effects.`,
        metric: 'operating_margin', value: income.operatingMargin,
      });
    } else if (income.operatingMargin < 0) {
      weaknesses.push({
        id: 'w_neg_op',
        label: 'Operating losses',
        detail: `Operating margin is ${pct(income.operatingMargin)}. The business is not yet profitable on an operating basis — dependent on external financing or a path to scale.`,
        metric: 'operating_margin', value: income.operatingMargin,
      });
    }
  }

  if (income.netMargin != null && income.operatingMargin != null) {
    // Net margin materially lower than op margin = interest + tax eating profits
    const gap = income.operatingMargin - income.netMargin;
    if (gap > 0.1 && income.operatingMargin > 0.05) {
      threats.push({
        id: 't_leakage',
        label: 'Profit leakage below operating line',
        detail: `Net margin (${pct(income.netMargin)}) is ${(gap * 100).toFixed(1)} pp below operating margin. Interest expense, taxes, or non-operating items are eating a meaningful share of operating profit.`,
      });
    }
  }

  // Margin trend
  if (prev && income.grossMargin != null) {
    const prevGross = prev.income.revenue && prev.income.grossProfit
      ? prev.income.grossProfit / prev.income.revenue
      : null;
    if (prevGross != null) {
      const delta = income.grossMargin - prevGross;
      if (delta > 0.02) {
        strengths.push({
          id: 's_gm_expanding',
          label: 'Gross margin expanding',
          detail: `Gross margin rose ${(delta * 100).toFixed(1)} pp vs ${prev.label}. Consistent with improving pricing, mix, or scale-driven cost leverage.`,
        });
      } else if (delta < -0.02) {
        threats.push({
          id: 't_gm_contracting',
          label: 'Gross margin contracting',
          detail: `Gross margin fell ${(Math.abs(delta) * 100).toFixed(1)} pp vs ${prev.label}. Possible causes: input-cost pressure, pricing competition, or adverse product mix.`,
        });
      }
    }
  }

  // ── Growth ──
  if (income.revenueGrowthYoY != null) {
    if (income.revenueGrowthYoY > 0.2) {
      strengths.push({
        id: 's_rev_growth',
        label: 'Strong revenue growth',
        detail: `Revenue up ${pct(income.revenueGrowthYoY)} vs ${prev?.label ?? 'prior period'}. Top-line growth is the most durable source of long-term value if margins hold.`,
        metric: 'revenue_growth', value: income.revenueGrowthYoY,
      });
    } else if (income.revenueGrowthYoY < -0.05) {
      threats.push({
        id: 't_rev_decline',
        label: 'Revenue declining',
        detail: `Revenue down ${pct(Math.abs(income.revenueGrowthYoY))} vs ${prev?.label ?? 'prior period'}. Requires understanding whether cyclical, competitive, or structural.`,
        metric: 'revenue_growth', value: income.revenueGrowthYoY,
      });
    }
  }

  if (income.netIncomeGrowthYoY != null && income.revenueGrowthYoY != null) {
    // Operating leverage: net income growing meaningfully faster than revenue
    if (income.netIncomeGrowthYoY - income.revenueGrowthYoY > 0.1 && income.revenueGrowthYoY > 0) {
      strengths.push({
        id: 's_op_leverage',
        label: 'Operating leverage expanding',
        detail: `Net income (+${pct(income.netIncomeGrowthYoY)}) growing faster than revenue (+${pct(income.revenueGrowthYoY)}) — costs are scaling sub-linearly. Classic operating-leverage story.`,
      });
    } else if (income.netIncomeGrowthYoY < income.revenueGrowthYoY - 0.1 && income.netIncomeGrowthYoY < 0.05) {
      threats.push({
        id: 't_negative_leverage',
        label: 'Negative operating leverage',
        detail: `Net income growth (${pct(income.netIncomeGrowthYoY)}) trailing revenue growth (${pct(income.revenueGrowthYoY)}). Costs are outpacing the top line.`,
      });
    }
  }

  // Multi-year consistency
  if (prev && twoPrev && income.revenueGrowthYoY != null) {
    const prevRevGrowth = yoyPct(prev.income.revenue, twoPrev.income.revenue);
    if (prevRevGrowth != null && prevRevGrowth > 0.1 && income.revenueGrowthYoY > 0.1) {
      strengths.push({
        id: 's_consistent_growth',
        label: 'Multi-year growth consistency',
        detail: `Revenue has grown double-digits for at least two consecutive periods (${pct(prevRevGrowth)} then ${pct(income.revenueGrowthYoY)}). Durable top-line momentum.`,
      });
    }
  }

  // ── Cash flow quality ──
  if (cashFlow.freeCashFlow != null && cashFlow.freeCashFlow > 0 && curr.income.revenue != null) {
    if (cashFlow.fcfMargin != null && cashFlow.fcfMargin > 0.2) {
      strengths.push({
        id: 's_fcf_margin',
        label: 'High FCF margin',
        detail: `Free cash flow of ${fmt(cashFlow.freeCashFlow)} = ${pct(cashFlow.fcfMargin)} of revenue. Each dollar of sales generates ${(cashFlow.fcfMargin * 100).toFixed(0)} cents of distributable cash.`,
        metric: 'fcf_margin', value: cashFlow.fcfMargin,
      });
    }
  } else if (cashFlow.freeCashFlow != null && cashFlow.freeCashFlow < 0) {
    weaknesses.push({
      id: 'w_neg_fcf',
      label: 'Negative free cash flow',
      detail: `FCF of ${fmt(cashFlow.freeCashFlow)} — operating cash flow isn't covering capital investment. Sustainable only with external financing or anticipated future scale.`,
      metric: 'fcf', value: cashFlow.freeCashFlow,
    });
  }

  if (cashFlow.earningsQuality != null) {
    if (cashFlow.earningsQuality >= 1 && curr.income.netIncome != null && curr.income.netIncome > 0) {
      strengths.push({
        id: 's_earnings_quality',
        label: 'High-quality earnings',
        detail: `Operating cash flow is ${cashFlow.earningsQuality.toFixed(2)}x net income — reported profits are backed by actual cash, not accrual estimates.`,
        metric: 'earnings_quality', value: cashFlow.earningsQuality,
      });
    } else if (cashFlow.earningsQuality < 0.6 && curr.income.netIncome != null && curr.income.netIncome > 0) {
      threats.push({
        id: 't_low_quality',
        label: 'Low earnings quality',
        detail: `CFO is only ${cashFlow.earningsQuality.toFixed(2)}x net income. Profits are outrunning cash collection — could signal aggressive revenue recognition or growing receivables.`,
        metric: 'earnings_quality', value: cashFlow.earningsQuality,
      });
    }
  }

  // ── Capital structure / interest ──
  if (income.interestCoverage != null) {
    if (income.interestCoverage < 2 && income.interestCoverage > 0) {
      threats.push({
        id: 't_interest_cov',
        label: 'Thin interest coverage',
        detail: `Operating income covers interest only ${income.interestCoverage.toFixed(2)}x. A moderate earnings decline or rate reset could push coverage below 1.0.`,
        metric: 'interest_coverage', value: income.interestCoverage,
      });
    } else if (income.interestCoverage > 10) {
      strengths.push({
        id: 's_interest_cov',
        label: 'Robust interest coverage',
        detail: `Operating income covers interest ${income.interestCoverage.toFixed(1)}x over — debt service is a non-issue at current earnings power.`,
        metric: 'interest_coverage', value: income.interestCoverage,
      });
    }
  }

  // ── SBC ──
  if (cashFlow.sbcIntensity != null && cashFlow.sbcIntensity > 0.1) {
    threats.push({
      id: 't_sbc',
      label: 'High stock-based compensation',
      detail: `SBC is ${pct(cashFlow.sbcIntensity)} of revenue — dilutes existing shareholders and inflates reported non-GAAP margins. Treat GAAP net income as the honest number.`,
      metric: 'sbc_intensity', value: cashFlow.sbcIntensity,
    });
  }

  // ── Capital return ──
  if (cashFlow.dividendCoverage != null) {
    if (cashFlow.dividendCoverage > 2) {
      strengths.push({
        id: 's_div_safe',
        label: 'Dividend well-covered',
        detail: `FCF covers dividends ${cashFlow.dividendCoverage.toFixed(2)}x — payout is sustainable with room for buybacks or reinvestment.`,
        metric: 'dividend_coverage', value: cashFlow.dividendCoverage,
      });
    } else if (cashFlow.dividendCoverage < 1) {
      threats.push({
        id: 't_div_uncovered',
        label: 'Dividend exceeds free cash flow',
        detail: `Dividends are ${(1 / cashFlow.dividendCoverage).toFixed(2)}x current FCF. Payout is being funded by debt or balance-sheet cash — not sustainable indefinitely.`,
        metric: 'dividend_coverage', value: cashFlow.dividendCoverage,
      });
    }
  }

  if (cashFlow.netShareholderReturn != null) {
    if (cashFlow.netShareholderReturn > 0.8 && cashFlow.netShareholderReturn < 1.2) {
      strengths.push({
        id: 's_balanced_return',
        label: 'Balanced capital return',
        detail: `Dividends + buybacks = ${pct(cashFlow.netShareholderReturn)} of FCF. Management is returning what it earns while preserving some reinvestment capacity.`,
      });
    } else if (cashFlow.netShareholderReturn > 1.3) {
      threats.push({
        id: 't_over_distributing',
        label: 'Capital return exceeds FCF',
        detail: `Total shareholder return is ${pct(cashFlow.netShareholderReturn)} of FCF — spending more than the business generates. Being funded by debt issuance or cash drawdown.`,
      });
    }
  }

  // ── Opportunities ──
  if (income.operatingMargin != null && income.operatingMargin > 0.05 && income.operatingMargin < 0.15) {
    opportunities.push({
      id: 'o_margin_room',
      label: 'Room for margin expansion',
      detail: `Operating margin of ${pct(income.operatingMargin)} sits below best-in-class peers. Incremental efficiency or pricing moves could meaningfully lift profitability.`,
    });
  }
  if (
    cashFlow.freeCashFlow != null &&
    cashFlow.freeCashFlow > 0 &&
    (curr?.cashFlow.dividendsPaid == null || curr.cashFlow.dividendsPaid === 0) &&
    (curr?.cashFlow.buybacks == null || curr.cashFlow.buybacks === 0)
  ) {
    opportunities.push({
      id: 'o_capital_return',
      label: 'No current capital return programme',
      detail: `Positive FCF with neither dividends nor buybacks. A future return-of-capital policy is optionality that's currently un-priced.`,
    });
  }

  return { strengths, weaknesses, opportunities, threats };
}

// Emit only the forward-looking signals where the current period shows a real
// delta worth discussing — ranked by magnitude, capped to 2.
function buildForwardLooking(periods: FinancialsPeriod[]): ForwardSignal[] {
  if (periods.length < 2) return [];

  const curr = periods[0];
  const prev = periods[1];

  const dRev = yoyPct(curr.income.revenue, prev.income.revenue);
  const dNi = yoyPct(curr.income.netIncome, prev.income.netIncome);
  const prevGross = prev.income.grossProfit && prev.income.revenue
    ? prev.income.grossProfit / prev.income.revenue : null;
  const currGross = curr.income.grossProfit && curr.income.revenue
    ? curr.income.grossProfit / curr.income.revenue : null;
  const dGm = prevGross != null && currGross != null ? currGross - prevGross : null;
  const dCfo = yoyPct(curr.cashFlow.operatingCashFlow, prev.cashFlow.operatingCashFlow);

  const candidates: Array<{ weight: number; signal: ForwardSignal }> = [];

  if (dRev != null && Math.abs(dRev) > 0.03) {
    candidates.push({
      weight: Math.abs(dRev),
      signal: {
        id: 'fwd_revenue',
        area: 'working_capital',
        improvement: `Revenue ${dRev >= 0 ? 'up' : 'down'} ${(Math.abs(dRev) * 100).toFixed(1)}% vs ${prev.label}. Sustained double-digit growth with stable gross margin is the textbook sign of durable momentum.`,
        deterioration: `Revenue decelerating while SG&A holds flat produces negative operating leverage — margins compress fast.`,
      },
    });
  }

  if (dGm != null && Math.abs(dGm) > 0.005) {
    candidates.push({
      weight: Math.abs(dGm) * 10,
      signal: {
        id: 'fwd_margin',
        area: 'working_capital',
        improvement: `Gross margin ${dGm >= 0 ? 'expanded' : 'contracted'} ${(Math.abs(dGm) * 100).toFixed(1)} pp. Even modest sustained expansion compounds into meaningful profit growth.`,
        deterioration: `Margins contracting with revenue growth holding = cost pressure or pricing erosion.`,
      },
    });
  }

  if (dCfo != null && Math.abs(dCfo) > 0.05) {
    candidates.push({
      weight: Math.abs(dCfo),
      signal: {
        id: 'fwd_fcf',
        area: 'cash',
        improvement: `Operating cash flow ${dCfo >= 0 ? 'grew' : 'shrank'} ${(Math.abs(dCfo) * 100).toFixed(1)}%. CFO keeping pace with net income confirms earnings are backed by real cash.`,
        deterioration: `FCF shrinking while reported net income grows widens the earnings-quality gap — watch receivables and one-off accruals.`,
      },
    });
  }

  if (dNi != null && Math.abs(dNi) > 0.05) {
    candidates.push({
      weight: Math.abs(dNi),
      signal: {
        id: 'fwd_capital_return',
        area: 'debt',
        improvement: `Net income ${dNi >= 0 ? 'up' : 'down'} ${(Math.abs(dNi) * 100).toFixed(1)}%. Buybacks or dividends at or below FCF means capital return is self-funded.`,
        deterioration: `Capital return rising while FCF falls (or debt rising to fund buybacks) indicates borrowed-from-the-future returns.`,
      },
    });
  }

  candidates.sort((a, b) => b.weight - a.weight);
  return candidates.slice(0, 2).map(c => c.signal);
}

const SWOT_CAP = 3;
function capSwot<T>(arr: T[]): T[] {
  return arr.slice(0, SWOT_CAP);
}

export function generateFinancialsSummary(
  periods: FinancialsPeriod[],
  income: IncomeRatios,
  cashFlow: CashFlowRatios,
): FinancialsSummary {
  if (!periods.length) {
    return {
      overview: 'No income statement or cash flow data was extracted.',
      ratioNotes: [], flags: [],
      strengths: [], weaknesses: [], opportunities: [], threats: [],
      forwardLooking: [],
    };
  }

  const curr = periods[0];
  const overviewParts: string[] = [];
  if (curr.income.revenue != null) overviewParts.push(`revenue of ${fmt(curr.income.revenue)}`);
  if (curr.income.netIncome != null) overviewParts.push(`net income of ${fmt(curr.income.netIncome)}`);
  if (cashFlow.freeCashFlow != null) overviewParts.push(`free cash flow of ${fmt(cashFlow.freeCashFlow)}`);
  const overview = overviewParts.length
    ? `${curr.label} reports ${overviewParts.join(', ')}.`
    : 'Financial data was only partially extracted.';

  const ratioNotes: string[] = [];
  if (income.grossMargin != null) ratioNotes.push(`Gross margin: ${pct(income.grossMargin)}`);
  if (income.operatingMargin != null) ratioNotes.push(`Operating margin: ${pct(income.operatingMargin)}`);
  if (income.netMargin != null) ratioNotes.push(`Net margin: ${pct(income.netMargin)}`);
  if (cashFlow.fcfMargin != null) ratioNotes.push(`FCF margin: ${pct(cashFlow.fcfMargin)}`);
  if (cashFlow.earningsQuality != null) ratioNotes.push(`CFO/NI: ${cashFlow.earningsQuality.toFixed(2)}x`);
  if (income.revenueGrowthYoY != null) ratioNotes.push(`Revenue YoY: ${pct(income.revenueGrowthYoY)}`);

  const flags: AnalysisFlag[] = [];
  if (income.operatingMargin != null && income.operatingMargin < 0) {
    flags.push({ id: 'op_loss', label: 'Operating Losses', description: `Operating margin ${pct(income.operatingMargin)}.`, severity: 'warning', metric: 'operating_margin', value: income.operatingMargin });
  }
  if (cashFlow.freeCashFlow != null && cashFlow.freeCashFlow < 0) {
    flags.push({ id: 'neg_fcf', label: 'Negative FCF', description: `Free cash flow is ${fmt(cashFlow.freeCashFlow)}.`, severity: 'warning', metric: 'fcf', value: cashFlow.freeCashFlow });
  }
  if (income.interestCoverage != null && income.interestCoverage < 2 && income.interestCoverage > 0) {
    flags.push({ id: 'thin_cov', label: 'Thin Interest Coverage', description: `Coverage ${income.interestCoverage.toFixed(2)}x.`, severity: 'warning', metric: 'interest_coverage', value: income.interestCoverage });
  }
  if (income.revenueGrowthYoY != null && income.revenueGrowthYoY < -0.05) {
    flags.push({ id: 'rev_decline', label: 'Revenue Decline', description: `Revenue down ${pct(Math.abs(income.revenueGrowthYoY))}.`, severity: 'info', metric: 'revenue_growth', value: income.revenueGrowthYoY });
  }

  if (!flags.length) {
    flags.push({ id: 'no_issues', label: 'No Major Red Flags', description: 'No major structural concerns detected.', severity: 'info' });
  }

  const swot = buildSWOT(periods, income, cashFlow);
  const forwardLooking = buildForwardLooking(periods);

  return {
    overview,
    ratioNotes,
    flags,
    strengths: capSwot(swot.strengths),
    weaknesses: capSwot(swot.weaknesses),
    opportunities: capSwot(swot.opportunities),
    threats: capSwot(swot.threats),
    forwardLooking,
  };
}
