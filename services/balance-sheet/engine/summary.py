"""
Template-based summary and flag generation.
Produces deterministic, rule-based analysis from computed ratios and extracted data.
"""

from __future__ import annotations

from models.schemas import (
    AnalysisFlag,
    BalanceSheetRatios,
    BalanceSheetSummary,
    ExtractionPeriod,
    FlagSeverity,
)


def generate_summary(
    periods: list[ExtractionPeriod],
    ratios: BalanceSheetRatios,
) -> BalanceSheetSummary:
    """
    Generate a deterministic summary with ratio notes and analysis flags.
    """
    if not periods:
        return BalanceSheetSummary(
            overview="No balance sheet data was extracted.",
            ratio_notes=[],
            flags=[],
        )

    latest = periods[0]
    items = latest.line_items
    flags: list[AnalysisFlag] = []
    ratio_notes: list[str] = []

    # --- Build overview ---
    overview_parts: list[str] = []

    if items.total_assets is not None:
        overview_parts.append(f"Total assets of {_fmt(items.total_assets)}")
    if items.total_liabilities is not None:
        overview_parts.append(f"total liabilities of {_fmt(items.total_liabilities)}")
    if items.total_equity is not None:
        overview_parts.append(f"total equity of {_fmt(items.total_equity)}")

    if overview_parts:
        overview = "The balance sheet shows " + ", ".join(overview_parts) + "."
    else:
        overview = "Balance sheet data was partially extracted. Some fields may be missing."

    # --- Ratio analysis ---

    # Current ratio
    if ratios.current_ratio is not None:
        if ratios.current_ratio >= 2.0:
            ratio_notes.append(
                f"Current ratio of {ratios.current_ratio:.2f}x indicates strong short-term liquidity."
            )
        elif ratios.current_ratio >= 1.0:
            ratio_notes.append(
                f"Current ratio of {ratios.current_ratio:.2f}x indicates adequate short-term liquidity."
            )
        else:
            ratio_notes.append(
                f"Current ratio of {ratios.current_ratio:.2f}x is below 1.0 — current liabilities exceed current assets."
            )
            flags.append(AnalysisFlag(
                id="low_current_ratio",
                label="Low Current Ratio",
                description="Current liabilities exceed current assets, which may indicate short-term liquidity pressure.",
                severity=FlagSeverity.warning,
                metric="current_ratio",
                value=ratios.current_ratio,
            ))

    # Debt to equity
    if ratios.debt_to_equity is not None:
        if ratios.debt_to_equity > 3.0:
            ratio_notes.append(
                f"Debt-to-equity of {ratios.debt_to_equity:.2f}x is very high — the company is heavily leveraged."
            )
            flags.append(AnalysisFlag(
                id="high_leverage",
                label="High Leverage",
                description=f"Debt-to-equity ratio of {ratios.debt_to_equity:.2f}x significantly exceeds the 2.0x threshold commonly considered high.",
                severity=FlagSeverity.critical,
                metric="debt_to_equity",
                value=ratios.debt_to_equity,
            ))
        elif ratios.debt_to_equity > 1.5:
            ratio_notes.append(
                f"Debt-to-equity of {ratios.debt_to_equity:.2f}x is elevated."
            )
            flags.append(AnalysisFlag(
                id="elevated_leverage",
                label="Elevated Leverage",
                description=f"Debt-to-equity of {ratios.debt_to_equity:.2f}x is above the 1.5x moderate threshold.",
                severity=FlagSeverity.warning,
                metric="debt_to_equity",
                value=ratios.debt_to_equity,
            ))
        elif ratios.debt_to_equity < 0:
            ratio_notes.append(
                f"Negative debt-to-equity ({ratios.debt_to_equity:.2f}x) — indicates negative equity."
            )
            flags.append(AnalysisFlag(
                id="negative_equity",
                label="Negative Equity",
                description="Total equity is negative, meaning liabilities exceed assets plus equity contributions.",
                severity=FlagSeverity.critical,
                metric="debt_to_equity",
                value=ratios.debt_to_equity,
            ))
        else:
            ratio_notes.append(
                f"Debt-to-equity of {ratios.debt_to_equity:.2f}x is within a moderate range."
            )

    # Working capital
    if ratios.working_capital is not None:
        if ratios.working_capital < 0:
            flags.append(AnalysisFlag(
                id="negative_working_capital",
                label="Negative Working Capital",
                description=f"Working capital is {_fmt(ratios.working_capital)} — current liabilities exceed current assets.",
                severity=FlagSeverity.warning,
                metric="working_capital",
                value=ratios.working_capital,
            ))

    # Goodwill as share of total assets
    if ratios.goodwill_to_assets is not None and ratios.goodwill_to_assets > 0.3:
        flags.append(AnalysisFlag(
            id="high_goodwill",
            label="High Goodwill Share",
            description=f"Goodwill represents {ratios.goodwill_to_assets * 100:.1f}% of total assets. "
                        "A high goodwill share may indicate acquisition-driven growth and impairment risk.",
            severity=FlagSeverity.info if ratios.goodwill_to_assets <= 0.4 else FlagSeverity.warning,
            metric="goodwill_to_assets",
            value=ratios.goodwill_to_assets,
        ))

    # Intangibles share
    if ratios.intangibles_to_assets is not None and ratios.intangibles_to_assets > 0.3:
        flags.append(AnalysisFlag(
            id="high_intangibles",
            label="High Intangibles Share",
            description=f"Intangible assets represent {ratios.intangibles_to_assets * 100:.1f}% of total assets.",
            severity=FlagSeverity.info,
            metric="intangibles_to_assets",
            value=ratios.intangibles_to_assets,
        ))

    # --- YoY change detection (if we have 2+ periods) ---
    if len(periods) >= 2:
        prev = periods[1]
        yoy_flags = _detect_yoy_changes(latest, prev)
        flags.extend(yoy_flags)

    # Add info flag for good standing if no issues
    if not flags:
        flags.append(AnalysisFlag(
            id="no_issues",
            label="No Notable Issues",
            description="No significant red flags detected based on available data.",
            severity=FlagSeverity.info,
        ))

    return BalanceSheetSummary(
        overview=overview,
        ratio_notes=ratio_notes,
        flags=flags,
    )


def _detect_yoy_changes(
    current: ExtractionPeriod,
    previous: ExtractionPeriod,
) -> list[AnalysisFlag]:
    """Detect large year-over-year changes between two periods."""
    flags: list[AnalysisFlag] = []

    fields_to_check = [
        ("total_assets", "Total Assets"),
        ("total_liabilities", "Total Liabilities"),
        ("total_equity", "Total Equity"),
        ("long_term_debt", "Long-term Debt"),
        ("cash_and_equivalents", "Cash & Equivalents"),
        ("total_current_assets", "Current Assets"),
        ("total_current_liabilities", "Current Liabilities"),
    ]

    for field_key, display_name in fields_to_check:
        curr_val = getattr(current.line_items, field_key, None)
        prev_val = getattr(previous.line_items, field_key, None)

        if curr_val is None or prev_val is None or prev_val == 0:
            continue

        change_pct = (curr_val - prev_val) / abs(prev_val) * 100

        # Flag changes > 30%
        if abs(change_pct) > 30:
            direction = "increased" if change_pct > 0 else "decreased"
            severity = FlagSeverity.warning if abs(change_pct) > 50 else FlagSeverity.info

            flags.append(AnalysisFlag(
                id=f"yoy_{field_key}",
                label=f"Large YoY Change: {display_name}",
                description=f"{display_name} {direction} by {abs(change_pct):.1f}% from {previous.label} to {current.label}.",
                severity=severity,
                metric=field_key,
                value=round(change_pct, 1),
            ))

    return flags


def _fmt(value: float) -> str:
    """Format a large number for display."""
    abs_val = abs(value)
    sign = "-" if value < 0 else ""
    if abs_val >= 1e12:
        return f"{sign}${abs_val / 1e12:.1f}T"
    if abs_val >= 1e9:
        return f"{sign}${abs_val / 1e9:.1f}B"
    if abs_val >= 1e6:
        return f"{sign}${abs_val / 1e6:.1f}M"
    if abs_val >= 1e3:
        return f"{sign}${abs_val / 1e3:.0f}K"
    return f"{sign}${abs_val:,.0f}"
