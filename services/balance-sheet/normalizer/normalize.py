"""
Normalization layer — converts raw parser output into structured ExtractionPeriod objects.
Handles field mapping, unit normalization, and confidence tracking.
"""

from __future__ import annotations

from typing import Any

from models.schemas import (
    ExtractionPeriod,
    FieldConfidence,
    FieldSource,
    NormalizedLineItems,
)

# All fields we track in the normalized schema
ALL_FIELDS = [
    "cash_and_equivalents",
    "short_term_investments",
    "accounts_receivable",
    "inventory",
    "total_current_assets",
    "property_plant_equipment",
    "goodwill",
    "intangible_assets",
    "total_assets",
    "accounts_payable",
    "short_term_debt",
    "total_current_liabilities",
    "long_term_debt",
    "total_liabilities",
    "retained_earnings",
    "total_equity",
]


def _infer_missing_fields(items: dict[str, float | None]) -> tuple[dict[str, float | None], list[str]]:
    """
    Try to infer missing totals from available sub-components.
    Returns updated items dict and list of inferred field names.
    """
    inferred: list[str] = []

    # Infer total_current_assets if missing
    if items.get("total_current_assets") is None:
        components = ["cash_and_equivalents", "short_term_investments", "accounts_receivable", "inventory"]
        available = [items.get(c) for c in components if items.get(c) is not None]
        if len(available) >= 2:
            items["total_current_assets"] = sum(v for v in available if v is not None)
            inferred.append("total_current_assets")

    # Infer total_current_liabilities from accounts_payable + short_term_debt
    if items.get("total_current_liabilities") is None:
        components = ["accounts_payable", "short_term_debt"]
        available = [items.get(c) for c in components if items.get(c) is not None]
        if len(available) >= 1:
            items["total_current_liabilities"] = sum(v for v in available if v is not None)
            inferred.append("total_current_liabilities")

    return items, inferred


def normalize_extraction(raw: dict[str, Any]) -> list[ExtractionPeriod]:
    """
    Convert raw extraction output into a list of ExtractionPeriod objects.
    """
    raw_periods = raw.get("periods", [])
    confidence_scores = raw.get("confidence_scores", {})

    result: list[ExtractionPeriod] = []

    for period_data in raw_periods:
        label = period_data.get("label", "Unknown")
        raw_items = period_data.get("raw_items", {})

        # Try to infer missing fields
        raw_items, inferred_fields = _infer_missing_fields(raw_items)

        # Build NormalizedLineItems
        line_items = NormalizedLineItems(**{
            field: raw_items.get(field)
            for field in ALL_FIELDS
        })

        # Build confidence entries
        confidence: list[FieldConfidence] = []
        for field in ALL_FIELDS:
            value = raw_items.get(field)
            if value is not None:
                if field in inferred_fields:
                    source = FieldSource.inferred
                    conf = 50
                else:
                    source = FieldSource.parsed
                    conf = confidence_scores.get(field, 60)
            else:
                source = FieldSource.missing
                conf = 0

            confidence.append(FieldConfidence(
                field=field,
                confidence=conf,
                source=source,
            ))

        result.append(ExtractionPeriod(
            label=label,
            line_items=line_items,
            confidence=confidence,
        ))

    return result
