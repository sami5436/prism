"""
Financial ratio computation.
Computes key balance-sheet ratios from normalized extraction periods.
"""

from __future__ import annotations

from models.schemas import BalanceSheetRatios, ExtractionPeriod


def compute_ratios(periods: list[ExtractionPeriod]) -> BalanceSheetRatios:
    """
    Compute financial ratios from the most recent extraction period.
    Returns a BalanceSheetRatios object.
    """
    if not periods:
        return BalanceSheetRatios()

    # Use the most recent period
    latest = periods[0]
    items = latest.line_items

    current_ratio: float | None = None
    debt_to_equity: float | None = None
    working_capital: float | None = None
    goodwill_to_assets: float | None = None
    intangibles_to_assets: float | None = None

    # Current ratio = current assets / current liabilities
    if items.total_current_assets is not None and items.total_current_liabilities is not None:
        if items.total_current_liabilities != 0:
            current_ratio = items.total_current_assets / items.total_current_liabilities

    # Debt to equity = total liabilities / total equity
    if items.total_liabilities is not None and items.total_equity is not None:
        if items.total_equity != 0:
            debt_to_equity = items.total_liabilities / items.total_equity

    # Working capital = current assets - current liabilities
    if items.total_current_assets is not None and items.total_current_liabilities is not None:
        working_capital = items.total_current_assets - items.total_current_liabilities

    # Goodwill to total assets
    if items.goodwill is not None and items.total_assets is not None:
        if items.total_assets != 0:
            goodwill_to_assets = items.goodwill / items.total_assets

    # Intangibles to total assets
    if items.intangible_assets is not None and items.total_assets is not None:
        if items.total_assets != 0:
            intangibles_to_assets = items.intangible_assets / items.total_assets

    return BalanceSheetRatios(
        current_ratio=_round_safe(current_ratio, 3),
        debt_to_equity=_round_safe(debt_to_equity, 3),
        working_capital=_round_safe(working_capital, 2),
        goodwill_to_assets=_round_safe(goodwill_to_assets, 4),
        intangibles_to_assets=_round_safe(intangibles_to_assets, 4),
    )


def _round_safe(value: float | None, decimals: int) -> float | None:
    """Round a value safely, returning None if input is None."""
    if value is None:
        return None
    return round(value, decimals)
