// Deterministic balance-sheet analysis — generates SWOT + forward-looking insight
// purely from ratios and line-item trends. No external calls, no LLM.

import {
  NormalizedPeriod,
  ComputedRatios,
  AnalysisFlag,
  AnalysisSummaryResult,
  SWOTItem,
  ForwardSignal,
} from './types';

const UNIT_SCALE: Record<string, number> = {
  units: 1,
  thousands: 1e3,
  millions: 1e6,
  billions: 1e9,
};

function fmt(value: number, unit: string): string {
  const scale = UNIT_SCALE[unit] ?? 1;
  const absUsd = Math.abs(value) * scale;
  const sign = value < 0 ? '-' : '';
  if (absUsd >= 1e12) return `${sign}$${(absUsd / 1e12).toFixed(2)}T`;
  if (absUsd >= 1e9) return `${sign}$${(absUsd / 1e9).toFixed(2)}B`;
  if (absUsd >= 1e6) return `${sign}$${(absUsd / 1e6).toFixed(1)}M`;
  if (absUsd >= 1e3) return `${sign}$${(absUsd / 1e3).toFixed(0)}K`;
  return `${sign}$${absUsd.toFixed(0)}`;
}

function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function yoyPct(curr: number | null | undefined, prev: number | null | undefined): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

function detectYoYChanges(current: NormalizedPeriod, previous: NormalizedPeriod): AnalysisFlag[] {
  const flags: AnalysisFlag[] = [];
  const checks: [string, string][] = [
    ['total_assets', 'Total Assets'],
    ['total_liabilities', 'Total Liabilities'],
    ['total_equity', 'Total Equity'],
    ['long_term_debt', 'Long-term Debt'],
    ['cash_and_equivalents', 'Cash & Equivalents'],
    ['total_current_assets', 'Current Assets'],
    ['total_current_liabilities', 'Current Liabilities'],
    ['accounts_receivable', 'Accounts Receivable'],
    ['accounts_payable', 'Accounts Payable'],
    ['inventory', 'Inventory'],
  ];

  for (const [key, display] of checks) {
    const pctChange = yoyPct(current.lineItems[key], previous.lineItems[key]);
    if (pctChange == null) continue;
    const abs = Math.abs(pctChange);
    if (abs > 0.3) {
      flags.push({
        id: `yoy_${key}`,
        label: `Large change in ${display}`,
        description: `${display} ${pctChange > 0 ? 'rose' : 'fell'} ${(abs * 100).toFixed(1)}% from ${previous.label} to ${current.label}.`,
        severity: abs > 0.5 ? 'warning' : 'info',
        metric: key,
        value: Math.round(pctChange * 1000) / 10,
      });
    }
  }
  return flags;
}

// ── SWOT generation ──────────────────────────────────────────────────────────

function pushIf<T>(arr: T[], item: T | null): void {
  if (item) arr.push(item);
}

function buildSWOT(
  curr: NormalizedPeriod,
  prev: NormalizedPeriod | undefined,
  ratios: ComputedRatios,
  unit: string,
): { strengths: SWOTItem[]; weaknesses: SWOTItem[]; opportunities: SWOTItem[]; threats: SWOTItem[] } {
  const strengths: SWOTItem[] = [];
  const weaknesses: SWOTItem[] = [];
  const opportunities: SWOTItem[] = [];
  const threats: SWOTItem[] = [];

  const i = curr.lineItems;

  // ── Liquidity ──
  if (ratios.currentRatio != null) {
    if (ratios.currentRatio >= 2) {
      strengths.push({
        id: 's_liquidity',
        label: 'Robust short-term liquidity',
        detail: `Current ratio of ${ratios.currentRatio.toFixed(2)}x means current assets cover short-term obligations roughly ${ratios.currentRatio.toFixed(1)} times over. Structural buffer against a cash-flow shock.`,
        metric: 'current_ratio', value: ratios.currentRatio,
      });
    } else if (ratios.currentRatio < 1) {
      weaknesses.push({
        id: 'w_liquidity',
        label: 'Current liabilities exceed current assets',
        detail: `Current ratio of ${ratios.currentRatio.toFixed(2)}x indicates short-term obligations outstrip liquid resources. The firm is reliant on continued revenue inflows or refinancing to meet near-term bills.`,
        metric: 'current_ratio', value: ratios.currentRatio,
      });
    } else if (ratios.currentRatio < 1.2) {
      threats.push({
        id: 't_thin_liquidity',
        label: 'Thin liquidity cushion',
        detail: `Current ratio of ${ratios.currentRatio.toFixed(2)}x leaves little margin. A slowdown in receivables collection or an inventory write-down could push working capital negative.`,
        metric: 'current_ratio', value: ratios.currentRatio,
      });
    }
  }

  if (ratios.quickRatio != null && ratios.quickRatio < 0.8 && ratios.currentRatio != null && ratios.currentRatio >= 1) {
    weaknesses.push({
      id: 'w_quick',
      label: 'Liquidity depends on inventory',
      detail: `Quick ratio of ${ratios.quickRatio.toFixed(2)}x is materially below the current ratio — the firm's short-term coverage hinges on selling inventory, not realising cash or receivables.`,
      metric: 'quick_ratio', value: ratios.quickRatio,
    });
  }

  if (ratios.cashRatio != null && ratios.cashRatio >= 1) {
    strengths.push({
      id: 's_cash_fortress',
      label: 'Cash alone covers current liabilities',
      detail: `Cash & short-term investments exceed every dollar of current liabilities (cash ratio ${ratios.cashRatio.toFixed(2)}x). This is a genuine balance-sheet fortress — no dependence on AR collection or inventory turnover.`,
      metric: 'cash_ratio', value: ratios.cashRatio,
    });
  } else if (ratios.cashRatio != null && ratios.cashRatio < 0.1 && i.total_current_liabilities != null && i.total_current_liabilities > 0) {
    threats.push({
      id: 't_cash_thin',
      label: 'Minimal cash vs current liabilities',
      detail: `Cash ratio of ${ratios.cashRatio.toFixed(2)}x means outright cash is a small fraction of near-term obligations. Sensitive to any disruption in receivables or operating cash flow.`,
      metric: 'cash_ratio', value: ratios.cashRatio,
    });
  }

  // ── Leverage & capital structure ──
  if (ratios.debtToEquity != null && i.total_equity != null && i.total_equity < 0) {
    weaknesses.push({
      id: 'w_neg_equity',
      label: 'Negative shareholders\' equity',
      detail: `Total equity is ${fmt(i.total_equity, unit)}. Liabilities exceed book assets — usually the residue of buybacks or sustained losses. Standard leverage ratios lose meaning here.`,
      metric: 'total_equity', value: i.total_equity,
    });
  } else if (ratios.debtToEquity != null) {
    if (ratios.debtToEquity > 3) {
      threats.push({
        id: 't_high_leverage',
        label: 'Very high financial leverage',
        detail: `Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x leaves the firm structurally exposed — a rate-up cycle or covenant breach forces either equity issuance or asset sales.`,
        metric: 'debt_to_equity', value: ratios.debtToEquity,
      });
    } else if (ratios.debtToEquity > 1.5) {
      weaknesses.push({
        id: 'w_elevated_leverage',
        label: 'Elevated leverage',
        detail: `Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x is above the 1.5x comfort band. Refinancing capacity narrows as rates rise or earnings dip.`,
        metric: 'debt_to_equity', value: ratios.debtToEquity,
      });
    } else if (ratios.debtToEquity < 0.5 && ratios.debtToEquity > 0) {
      strengths.push({
        id: 's_low_leverage',
        label: 'Conservative capital structure',
        detail: `Debt-to-equity of ${ratios.debtToEquity.toFixed(2)}x gives the firm substantial unused debt capacity — strategic flexibility for M&A, buybacks, or weathering a downturn.`,
        metric: 'debt_to_equity', value: ratios.debtToEquity,
      });
      opportunities.push({
        id: 'o_debt_capacity',
        label: 'Untapped debt capacity',
        detail: `Low leverage is the cheapest form of optionality. Management could issue term debt to fund acquisitions or returns without stressing the capital structure.`,
      });
    }
  }

  if (ratios.shortTermDebtShareOfDebt != null && ratios.shortTermDebtShareOfDebt > 0.5) {
    threats.push({
      id: 't_refi_wall',
      label: 'Debt maturity wall near-term',
      detail: `${pct(ratios.shortTermDebtShareOfDebt, 0)} of outstanding debt is current. That creates a refinancing event within 12 months — any spread widening hits the P&L directly.`,
      metric: 'short_term_debt_share', value: ratios.shortTermDebtShareOfDebt,
    });
  }

  // ── Asset quality ──
  if (ratios.goodwillToAssets != null) {
    if (ratios.goodwillToAssets > 0.4) {
      threats.push({
        id: 't_goodwill',
        label: 'Goodwill-heavy balance sheet',
        detail: `Goodwill is ${pct(ratios.goodwillToAssets, 0)} of total assets. An impairment test failure — triggered by a down-cycle in acquired units — would carve a large hole in book equity.`,
        metric: 'goodwill_to_assets', value: ratios.goodwillToAssets,
      });
    } else if (ratios.goodwillToAssets > 0.2) {
      weaknesses.push({
        id: 'w_goodwill',
        label: 'Material goodwill exposure',
        detail: `Goodwill accounts for ${pct(ratios.goodwillToAssets, 0)} of assets. Reported book value is partly M&A premium, not tangible productive capacity.`,
        metric: 'goodwill_to_assets', value: ratios.goodwillToAssets,
      });
    }
  }

  if (ratios.tangibleEquity != null && ratios.tangibleEquity < 0 && i.total_equity != null && i.total_equity >= 0) {
    weaknesses.push({
      id: 'w_neg_tangible',
      label: 'Negative tangible equity',
      detail: `Stripping goodwill and intangibles leaves tangible book equity of ${fmt(ratios.tangibleEquity, unit)}. Stated equity is entirely supported by acquisition-era intangibles.`,
      metric: 'tangible_equity', value: ratios.tangibleEquity,
    });
  }

  // ── Working capital composition ──
  if (ratios.workingCapital != null && ratios.workingCapital > 0) {
    strengths.push({
      id: 's_pos_wc',
      label: 'Positive working capital',
      detail: `Working capital of ${fmt(ratios.workingCapital, unit)} funds operating needs without relying on short-term financing.`,
      metric: 'working_capital', value: ratios.workingCapital,
    });
  } else if (ratios.workingCapital != null && ratios.workingCapital < 0) {
    threats.push({
      id: 't_neg_wc',
      label: 'Negative working capital',
      detail: `Working capital is ${fmt(ratios.workingCapital, unit)}. Can be healthy (fast-inventory retailers) or fragile (stretched payables) — confirmation requires seeing how AP and AR move alongside revenue.`,
      metric: 'working_capital', value: ratios.workingCapital,
    });
  }

  if (ratios.inventoryShareOfCurrentAssets != null && ratios.inventoryShareOfCurrentAssets > 0.4) {
    threats.push({
      id: 't_inv_heavy',
      label: 'Inventory-heavy current assets',
      detail: `Inventory is ${pct(ratios.inventoryShareOfCurrentAssets, 0)} of current assets — obsolescence or markdown risk sits inside headline liquidity metrics.`,
      metric: 'inventory_share', value: ratios.inventoryShareOfCurrentAssets,
    });
  }

  if (ratios.arShareOfCurrentAssets != null && ratios.arShareOfCurrentAssets > 0.5) {
    weaknesses.push({
      id: 'w_ar_concentration',
      label: 'Liquidity concentrated in receivables',
      detail: `Accounts receivable is ${pct(ratios.arShareOfCurrentAssets, 0)} of current assets. Short-term solvency is a bet on customer payment behaviour.`,
      metric: 'ar_share', value: ratios.arShareOfCurrentAssets,
    });
  }

  // ── Retained earnings ──
  if (i.retained_earnings != null) {
    if (i.retained_earnings < 0) {
      weaknesses.push({
        id: 'w_accum_deficit',
        label: 'Accumulated deficit',
        detail: `Retained earnings of ${fmt(i.retained_earnings, unit)} — cumulative losses (or returns) exceed cumulative profits. Dividend capacity and reinvestment flexibility are constrained.`,
        metric: 'retained_earnings', value: i.retained_earnings,
      });
    } else if (i.total_assets != null && i.total_assets > 0 && i.retained_earnings / i.total_assets > 0.4) {
      strengths.push({
        id: 's_retained_earnings',
        label: 'Strong retained earnings base',
        detail: `Retained earnings of ${fmt(i.retained_earnings, unit)} (${pct(i.retained_earnings / i.total_assets, 0)} of assets) reflect a long history of self-financed capital.`,
        metric: 'retained_earnings', value: i.retained_earnings,
      });
    }
  }

  // ── YoY deltas as opportunity/threat signals ──
  if (prev) {
    const deltaCash = yoyPct(i.cash_and_equivalents, prev.lineItems.cash_and_equivalents);
    const deltaAR = yoyPct(i.accounts_receivable, prev.lineItems.accounts_receivable);
    const deltaAP = yoyPct(i.accounts_payable, prev.lineItems.accounts_payable);
    const deltaDebt = yoyPct(
      (i.long_term_debt ?? 0) + (i.short_term_debt ?? 0),
      (prev.lineItems.long_term_debt ?? 0) + (prev.lineItems.short_term_debt ?? 0),
    );
    const deltaInv = yoyPct(i.inventory, prev.lineItems.inventory);
    const deltaEquity = yoyPct(i.total_equity, prev.lineItems.total_equity);

    if (deltaCash != null && deltaCash > 0.2) {
      strengths.push({
        id: 's_cash_build',
        label: 'Cash balance building',
        detail: `Cash up ${(deltaCash * 100).toFixed(0)}% vs ${prev.label}. Consistent with either strong operating cash flow or deliberate liquidity stockpiling.`,
      });
    }
    if (deltaAR != null && deltaAR > 0.25 && (prev.lineItems.accounts_receivable ?? 0) > 0) {
      threats.push({
        id: 't_ar_outpacing',
        label: 'Receivables growing fast',
        detail: `AR up ${(deltaAR * 100).toFixed(0)}% — if revenue did not rise in line, this signals slower collections or channel-stuffing risk. Needs revenue context to interpret.`,
      });
    }
    if (deltaAP != null && deltaAP > 0.3 && (prev.lineItems.accounts_payable ?? 0) > 0) {
      threats.push({
        id: 't_ap_stretch',
        label: 'Payables expanding materially',
        detail: `AP up ${(deltaAP * 100).toFixed(0)}%. Vendor financing can be cheap capital — but persistent stretching signals working-capital strain.`,
      });
    }
    if (deltaDebt != null && deltaDebt > 0.25) {
      threats.push({
        id: 't_debt_up',
        label: 'Leverage expanding',
        detail: `Total debt up ${(deltaDebt * 100).toFixed(0)}% vs ${prev.label}. Worth understanding whether proceeds funded organic growth, M&A, or buybacks.`,
      });
    } else if (deltaDebt != null && deltaDebt < -0.1) {
      strengths.push({
        id: 's_delevering',
        label: 'Active deleveraging',
        detail: `Total debt down ${(Math.abs(deltaDebt) * 100).toFixed(0)}% from ${prev.label}. Reduces fixed obligations and frees future cash flow.`,
      });
    }
    if (deltaInv != null && deltaInv > 0.3 && (prev.lineItems.inventory ?? 0) > 0) {
      threats.push({
        id: 't_inv_build',
        label: 'Inventory accumulation',
        detail: `Inventory up ${(deltaInv * 100).toFixed(0)}% — either a deliberate build for anticipated demand or a demand miss. Watch AR + revenue to disambiguate.`,
      });
    }
    if (deltaEquity != null && deltaEquity < -0.1) {
      weaknesses.push({
        id: 'w_equity_erosion',
        label: 'Equity base eroding',
        detail: `Total equity down ${(Math.abs(deltaEquity) * 100).toFixed(0)}% vs ${prev.label}. Could be losses, aggressive buybacks, or dividends outpacing earnings.`,
      });
    }
  }

  // ── Opportunities derived from current structure ──
  if (ratios.cashRatio != null && ratios.cashRatio > 0.5 && ratios.debtToEquity != null && ratios.debtToEquity < 1) {
    opportunities.push({
      id: 'o_capital_return',
      label: 'Room for capital return',
      detail: `Excess cash alongside moderate leverage creates space for buybacks, dividends, or bolt-on M&A without stressing the balance sheet.`,
    });
  }
  if (ratios.currentRatio != null && ratios.currentRatio > 2.5 && ratios.cashRatio != null && ratios.cashRatio > 1) {
    opportunities.push({
      id: 'o_excess_liquidity',
      label: 'Liquidity may be over-provisioned',
      detail: `A current ratio above 2.5x and cash ratio above 1.0x suggests working capital is idle. Redeploying into higher-return assets or returning capital would improve efficiency.`,
    });
  }
  if (ratios.apShareOfCurrentLiab != null && ratios.apShareOfCurrentLiab < 0.2 && i.accounts_payable != null && i.accounts_payable > 0) {
    opportunities.push({
      id: 'o_supplier_terms',
      label: 'Room to extend supplier terms',
      detail: `AP is only ${pct(ratios.apShareOfCurrentLiab, 0)} of current liabilities — negotiating longer payment terms could free working capital without new financing.`,
    });
  }

  return { strengths, weaknesses, opportunities, threats };
}

// ── Forward-looking signals ──────────────────────────────────────────────────

function buildForwardLooking(
  curr: NormalizedPeriod,
  prev: NormalizedPeriod | undefined,
): ForwardSignal[] {
  const signals: ForwardSignal[] = [];

  signals.push({
    id: 'fwd_ar',
    area: 'accounts_receivable',
    improvement: 'AR growing slower than revenue (or falling) indicates tighter collections — translates directly to operating cash flow.',
    deterioration: 'AR growing faster than revenue is a leading signal of deteriorating days-sales-outstanding, customer credit stress, or channel-stuffing.',
  });

  signals.push({
    id: 'fwd_ap',
    area: 'accounts_payable',
    improvement: 'AP rising modestly alongside purchases signals stronger supplier financing. A stable AP/COGS ratio means terms are holding.',
    deterioration: 'AP growing far faster than purchases — or sudden jumps without revenue growth — indicates payment stretching, often a precursor to a covenant or liquidity event.',
  });

  signals.push({
    id: 'fwd_debt',
    area: 'debt',
    improvement: 'Falling total debt, extended average maturity, or a shift from short-term to long-term debt lowers refinancing risk.',
    deterioration: 'Rising short-term debt share, new drawings on revolvers, or stable total debt with shrinking equity all signal a weakening capital structure.',
  });

  signals.push({
    id: 'fwd_wc',
    area: 'working_capital',
    improvement: 'Working capital rising slower than revenue is the textbook sign of improving capital efficiency. Inventory days falling is a particularly clean read.',
    deterioration: 'Working capital ballooning faster than revenue means each incremental dollar of sales ties up more cash — a quiet drain on free cash flow.',
  });

  if (prev) {
    const i = curr.lineItems;
    const p = prev.lineItems;
    const dAR = yoyPct(i.accounts_receivable, p.accounts_receivable);
    const dAP = yoyPct(i.accounts_payable, p.accounts_payable);
    const dWC = yoyPct(
      (i.total_current_assets ?? 0) - (i.total_current_liabilities ?? 0),
      (p.total_current_assets ?? 0) - (p.total_current_liabilities ?? 0),
    );
    const dDebt = yoyPct(
      (i.long_term_debt ?? 0) + (i.short_term_debt ?? 0),
      (p.long_term_debt ?? 0) + (p.short_term_debt ?? 0),
    );

    if (dAR != null) signals[0].improvement = `Currently AR ${dAR >= 0 ? 'rose' : 'fell'} ${(Math.abs(dAR) * 100).toFixed(1)}% vs ${prev.label}. ` + signals[0].improvement;
    if (dAP != null) signals[1].improvement = `Currently AP ${dAP >= 0 ? 'rose' : 'fell'} ${(Math.abs(dAP) * 100).toFixed(1)}% vs ${prev.label}. ` + signals[1].improvement;
    if (dDebt != null) signals[2].improvement = `Total debt ${dDebt >= 0 ? 'increased' : 'decreased'} ${(Math.abs(dDebt) * 100).toFixed(1)}%. ` + signals[2].improvement;
    if (dWC != null) signals[3].improvement = `Working capital ${dWC >= 0 ? 'expanded' : 'contracted'} ${(Math.abs(dWC) * 100).toFixed(1)}%. ` + signals[3].improvement;
  }

  return signals;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function generateSummary(
  periods: NormalizedPeriod[],
  ratios: ComputedRatios,
  unit: string = 'units',
): AnalysisSummaryResult {
  if (!periods.length) {
    return {
      overview: 'No balance sheet data was extracted.',
      ratioNotes: [],
      flags: [],
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      forwardLooking: [],
    };
  }

  const curr = periods[0];
  const prev = periods[1];
  const items = curr.lineItems;
  const flags: AnalysisFlag[] = [];
  const ratioNotes: string[] = [];

  // Overview — facts only
  const overviewParts: string[] = [];
  if (items.total_assets != null) overviewParts.push(`total assets of ${fmt(items.total_assets, unit)}`);
  if (items.total_liabilities != null) overviewParts.push(`total liabilities of ${fmt(items.total_liabilities, unit)}`);
  if (items.total_equity != null) overviewParts.push(`total equity of ${fmt(items.total_equity, unit)}`);
  const overview = overviewParts.length
    ? `Reporting period ${curr.label} shows ` + overviewParts.join(', ') + '.'
    : 'Balance sheet data was only partially extracted — some fields may be missing.';

  // Ratio notes (kept for backwards compatibility with earlier UI)
  if (ratios.currentRatio != null) ratioNotes.push(`Current ratio: ${ratios.currentRatio.toFixed(2)}x`);
  if (ratios.quickRatio != null) ratioNotes.push(`Quick ratio: ${ratios.quickRatio.toFixed(2)}x`);
  if (ratios.cashRatio != null) ratioNotes.push(`Cash ratio: ${ratios.cashRatio.toFixed(2)}x`);
  if (ratios.debtToEquity != null) ratioNotes.push(`Debt-to-equity: ${ratios.debtToEquity.toFixed(2)}x`);
  if (ratios.debtToAssets != null) ratioNotes.push(`Debt-to-assets: ${(ratios.debtToAssets * 100).toFixed(1)}%`);

  // Legacy flag generation (powers HighlightsPanel)
  if (ratios.currentRatio != null && ratios.currentRatio < 1) {
    flags.push({ id: 'low_current_ratio', label: 'Low Current Ratio', description: `Current liabilities exceed current assets (${ratios.currentRatio.toFixed(2)}x).`, severity: 'warning', metric: 'current_ratio', value: ratios.currentRatio });
  }
  if (ratios.debtToEquity != null) {
    if (ratios.debtToEquity > 3) flags.push({ id: 'high_leverage', label: 'High Leverage', description: `D/E of ${ratios.debtToEquity.toFixed(2)}x significantly exceeds 2.0x.`, severity: 'critical', metric: 'debt_to_equity', value: ratios.debtToEquity });
    else if (ratios.debtToEquity > 1.5) flags.push({ id: 'elevated_leverage', label: 'Elevated Leverage', description: `D/E of ${ratios.debtToEquity.toFixed(2)}x is above the 1.5x threshold.`, severity: 'warning', metric: 'debt_to_equity', value: ratios.debtToEquity });
    else if (ratios.debtToEquity < 0) flags.push({ id: 'negative_equity', label: 'Negative Equity', description: 'Total equity is negative.', severity: 'critical', metric: 'debt_to_equity', value: ratios.debtToEquity });
  }
  if (ratios.workingCapital != null && ratios.workingCapital < 0) {
    flags.push({ id: 'negative_working_capital', label: 'Negative Working Capital', description: `Working capital is ${fmt(ratios.workingCapital, unit)}.`, severity: 'warning', metric: 'working_capital', value: ratios.workingCapital });
  }
  if (ratios.goodwillToAssets != null && ratios.goodwillToAssets > 0.3) {
    flags.push({ id: 'high_goodwill', label: 'High Goodwill Share', description: `Goodwill is ${pct(ratios.goodwillToAssets, 1)} of assets.`, severity: ratios.goodwillToAssets > 0.4 ? 'warning' : 'info', metric: 'goodwill_to_assets', value: ratios.goodwillToAssets });
  }
  if (ratios.intangiblesToAssets != null && ratios.intangiblesToAssets > 0.3) {
    flags.push({ id: 'high_intangibles', label: 'High Intangibles Share', description: `Intangibles + goodwill are ${pct(ratios.intangiblesToAssets, 1)} of assets.`, severity: 'info', metric: 'intangibles_to_assets', value: ratios.intangiblesToAssets });
  }
  if (prev) flags.push(...detectYoYChanges(curr, prev));

  if (!flags.length) {
    flags.push({ id: 'no_issues', label: 'No Major Red Flags', description: 'No significant structural issues detected across the metrics tracked.', severity: 'info' });
  }

  const { strengths, weaknesses, opportunities, threats } = buildSWOT(curr, prev, ratios, unit);
  const forwardLooking = buildForwardLooking(curr, prev);

  return {
    overview,
    ratioNotes,
    flags,
    strengths,
    weaknesses,
    opportunities,
    threats,
    forwardLooking,
  };
}
