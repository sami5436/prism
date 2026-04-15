"""
XBRL/XML balance sheet parser.
Parses SEC XBRL filings by mapping US-GAAP taxonomy tags to normalized fields.
"""

from __future__ import annotations

import re
from typing import Any

from lxml import etree

from parsers.base import BaseParser

# Mapping from US-GAAP XBRL taxonomy element names to normalized field keys
GAAP_TAG_MAP: dict[str, str] = {
    # Cash
    "CashAndCashEquivalentsAtCarryingValue": "cash_and_equivalents",
    "Cash": "cash_and_equivalents",
    "CashCashEquivalentsAndShortTermInvestments": "cash_and_equivalents",
    # Short-term investments
    "ShortTermInvestments": "short_term_investments",
    "MarketableSecuritiesCurrent": "short_term_investments",
    "AvailableForSaleSecuritiesCurrent": "short_term_investments",
    # Accounts receivable
    "AccountsReceivableNetCurrent": "accounts_receivable",
    "AccountsReceivableNet": "accounts_receivable",
    "ReceivablesNetCurrent": "accounts_receivable",
    # Inventory
    "InventoryNet": "inventory",
    "Inventories": "inventory",
    # Total current assets
    "AssetsCurrent": "total_current_assets",
    # PP&E
    "PropertyPlantAndEquipmentNet": "property_plant_equipment",
    "PropertyPlantAndEquipmentGross": "property_plant_equipment",
    # Goodwill
    "Goodwill": "goodwill",
    # Intangible assets
    "IntangibleAssetsNetExcludingGoodwill": "intangible_assets",
    "FiniteLivedIntangibleAssetsNet": "intangible_assets",
    # Total assets
    "Assets": "total_assets",
    # Accounts payable
    "AccountsPayableCurrent": "accounts_payable",
    "AccountsPayable": "accounts_payable",
    # Short-term debt
    "ShortTermBorrowings": "short_term_debt",
    "CurrentPortionOfLongTermDebt": "short_term_debt",
    "LongTermDebtCurrent": "short_term_debt",
    # Total current liabilities
    "LiabilitiesCurrent": "total_current_liabilities",
    # Long-term debt
    "LongTermDebtNoncurrent": "long_term_debt",
    "LongTermDebt": "long_term_debt",
    "LongTermBorrowings": "long_term_debt",
    # Total liabilities
    "Liabilities": "total_liabilities",
    # Retained earnings
    "RetainedEarningsAccumulatedDeficit": "retained_earnings",
    "RetainedEarnings": "retained_earnings",
    # Total equity
    "StockholdersEquity": "total_equity",
    "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest": "total_equity",
    "Equity": "total_equity",
}

# Common XBRL namespaces
NS_PATTERNS = {
    "us-gaap": re.compile(r"\{http://fasb\.org/us-gaap/\d{4}(?:-\d{2}-\d{2})?\}(.+)"),
    "dei": re.compile(r"\{http://xbrl\.sec\.gov/dei/\d{4}(?:-\d{2}-\d{2})?\}(.+)"),
}


def _local_name(tag: str) -> str:
    """Extract local name from a qualified tag."""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _parse_value(text: str | None) -> float | None:
    """Parse a numeric value from element text."""
    if not text:
        return None
    cleaned = text.strip().replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


class XBRLParser(BaseParser):
    """Parse balance sheets from XBRL/XML filings."""

    def parse(self, file_path: str) -> dict[str, Any]:
        tree = etree.parse(file_path)
        root = tree.getroot()

        company_name: str | None = None
        filing_date: str | None = None
        periods_by_context: dict[str, dict[str, float | None]] = {}
        context_dates: dict[str, str] = {}
        confidence_scores: dict[str, int] = {}

        # First pass: extract context periods
        for elem in root.iter():
            local = _local_name(elem.tag)
            if local == "context":
                ctx_id = elem.get("id", "")
                # Look for instant date (balance sheet is point-in-time)
                for child in elem.iter():
                    child_local = _local_name(child.tag)
                    if child_local == "instant" and child.text:
                        context_dates[ctx_id] = child.text.strip()

        # Second pass: extract facts
        for elem in root.iter():
            local = _local_name(elem.tag)

            # Try to get company name from DEI
            if local == "EntityRegistrantName" and elem.text:
                company_name = elem.text.strip()
            elif local == "DocumentPeriodEndDate" and elem.text:
                filing_date = elem.text.strip()

            # Map GAAP tags
            if local in GAAP_TAG_MAP:
                field_key = GAAP_TAG_MAP[local]
                value = _parse_value(elem.text)

                if value is None:
                    continue

                # Handle scale/decimals attribute
                decimals = elem.get("decimals", "")
                scale = elem.get("scale", "")

                if scale:
                    try:
                        value *= 10 ** int(scale)
                    except ValueError:
                        pass

                ctx_ref = elem.get("contextRef", "default")
                period_label = context_dates.get(ctx_ref, ctx_ref)

                if period_label not in periods_by_context:
                    periods_by_context[period_label] = {}

                # First match wins
                if field_key not in periods_by_context[period_label]:
                    periods_by_context[period_label][field_key] = value
                    confidence_scores[field_key] = 95  # High confidence for structured data

        # Build periods list, sorted by date (most recent first)
        sorted_periods = sorted(
            periods_by_context.items(),
            key=lambda x: x[0],
            reverse=True,
        )

        periods_data = []
        for label, items in sorted_periods[:4]:  # Limit to 4 most recent periods
            periods_data.append({
                "label": label,
                "raw_items": items,
            })

        # Detect unit (XBRL data is usually in raw units)
        # Check if values are very large (likely in raw units vs thousands/millions)
        all_values = [
            v for p in periods_data
            for v in p["raw_items"].values()
            if v is not None and v != 0
        ]
        unit = "units"
        if all_values:
            avg_val = sum(abs(v) for v in all_values) / len(all_values)
            if avg_val > 1e9:
                unit = "units"  # Raw large numbers
            elif avg_val > 1e6:
                unit = "units"
            elif avg_val > 1e3:
                unit = "thousands"

        return {
            "company_name": company_name,
            "filing_date": filing_date,
            "currency": "USD",
            "unit": unit,
            "periods": periods_data,
            "confidence_scores": confidence_scores,
        }
