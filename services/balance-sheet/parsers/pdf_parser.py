"""
PDF balance sheet parser.
Uses pdfplumber to extract tables and text, then applies pattern matching
to identify common balance sheet line items.
"""

from __future__ import annotations

import re
from typing import Any

import pdfplumber

from parsers.base import BaseParser

# Patterns mapping common balance sheet labels to normalized field keys.
# Each tuple: (normalized_key, list of regex patterns to match)
FIELD_PATTERNS: list[tuple[str, list[str]]] = [
    ("cash_and_equivalents", [
        r"cash\s*(?:and|&)\s*cash\s*equiv",
        r"cash\s*(?:and|&)\s*equiv",
        r"^cash$",
        r"cash\s*(?:and|&)\s*short[- ]term\s*invest",
    ]),
    ("short_term_investments", [
        r"short[- ]term\s*(?:market|invest)",
        r"marketable\s*securities",
        r"current\s*investments",
    ]),
    ("accounts_receivable", [
        r"accounts?\s*receiv",
        r"trade\s*receiv",
        r"net\s*receiv",
    ]),
    ("inventory", [
        r"inventor",
    ]),
    ("total_current_assets", [
        r"total\s*current\s*assets",
    ]),
    ("property_plant_equipment", [
        r"property.*(?:plant|equip)",
        r"pp\s*(?:&|and)\s*e",
        r"net\s*property",
    ]),
    ("goodwill", [
        r"^goodwill$",
        r"goodwill\b",
    ]),
    ("intangible_assets", [
        r"intangible\s*assets",
        r"other\s*intangible",
    ]),
    ("total_assets", [
        r"total\s*assets",
    ]),
    ("accounts_payable", [
        r"accounts?\s*payable",
        r"trade\s*payable",
    ]),
    ("short_term_debt", [
        r"short[- ]term\s*(?:debt|borrow)",
        r"current\s*(?:portion|maturit).*(?:debt|loan)",
        r"notes?\s*payable",
    ]),
    ("total_current_liabilities", [
        r"total\s*current\s*liabilit",
    ]),
    ("long_term_debt", [
        r"long[- ]term\s*debt",
        r"long[- ]term\s*borrow",
        r"non[- ]?current.*debt",
    ]),
    ("total_liabilities", [
        r"total\s*liabilit",
    ]),
    ("retained_earnings", [
        r"retained\s*earn",
        r"accumulated\s*(?:deficit|earnings)",
    ]),
    ("total_equity", [
        r"total\s*(?:stockholders?|shareholders?|owners?)?\s*equity",
        r"total\s*equity",
    ]),
]


def _parse_number(text: str) -> float | None:
    """Try to parse a numeric value from a cell string."""
    if not text:
        return None
    # Clean the string
    cleaned = text.strip()
    cleaned = cleaned.replace(",", "").replace("$", "").replace("€", "").replace("£", "")
    # Handle parenthetical negatives: (123) -> -123
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = "-" + cleaned[1:-1]
    # Handle em-dash or similar as "no value"
    if cleaned in ("—", "-", "–", "N/A", "n/a", ""):
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _match_field(label: str) -> str | None:
    """Match a row label to a normalized field key."""
    label_lower = label.strip().lower()
    for field_key, patterns in FIELD_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, label_lower):
                return field_key
    return None


def _detect_unit(text: str) -> str:
    """Detect the unit scale from header/note text."""
    lower = text.lower()
    if "in billions" in lower or "(billions)" in lower:
        return "billions"
    if "in millions" in lower or "(millions)" in lower:
        return "millions"
    if "in thousands" in lower or "(thousands)" in lower:
        return "thousands"
    return "units"


def _extract_company_name(text: str) -> str | None:
    """Try to extract the company name from the first page text."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    for line in lines[:10]:
        # Skip common headers
        if any(skip in line.lower() for skip in [
            "balance sheet", "consolidated", "financial statement",
            "in millions", "in thousands", "in billions",
            "period ending", "as of", "date",
        ]):
            continue
        # Likely a company name if it's short-ish and uppercase-leaning
        if 3 < len(line) < 80:
            return line
    return None


def _extract_period_labels(header_row: list[str]) -> list[str]:
    """Extract period labels from table header row."""
    labels = []
    for cell in header_row:
        if cell and cell.strip():
            cleaned = cell.strip()
            # Check if it looks like a date
            if re.search(r"\d{4}", cleaned):
                labels.append(cleaned)
    return labels


class PDFParser(BaseParser):
    """Parse balance sheets from PDF files using pdfplumber table extraction."""

    def parse(self, file_path: str) -> dict[str, Any]:
        with pdfplumber.open(file_path) as pdf:
            all_text = ""
            all_tables: list[list[list[str]]] = []

            for page in pdf.pages:
                page_text = page.extract_text() or ""
                all_text += page_text + "\n"

                tables = page.extract_tables() or []
                all_tables.extend(tables)

        # Detect unit from overall text
        unit = _detect_unit(all_text)

        # Try to find company name
        company_name = _extract_company_name(all_text)

        # Process tables to find balance sheet data
        periods_data: list[dict[str, Any]] = []
        period_labels: list[str] = []
        confidence_scores: dict[str, int] = {}
        matched_fields: dict[int, dict[str, float | None]] = {}

        for table in all_tables:
            if not table or len(table) < 3:
                continue

            # First non-empty row is likely the header
            header_row = table[0] if table[0] else []

            # Extract period labels from header
            labels = _extract_period_labels(header_row)
            if not labels:
                # Try second row as header
                if len(table) > 1 and table[1]:
                    labels = _extract_period_labels(table[1])

            if not labels:
                labels = ["Period 1"]

            # Initialize period containers
            for idx, label in enumerate(labels):
                if idx not in matched_fields:
                    matched_fields[idx] = {}
                if label not in period_labels:
                    period_labels.append(label)

            # Process data rows
            for row in table[1:]:
                if not row or not row[0]:
                    continue

                label_text = str(row[0]).strip()
                field_key = _match_field(label_text)

                if field_key is None:
                    continue

                # Extract values for each period column
                value_cells = [c for c in row[1:] if c is not None]

                for col_idx, cell in enumerate(value_cells):
                    if col_idx >= len(labels):
                        break
                    value = _parse_number(str(cell))
                    if col_idx not in matched_fields:
                        matched_fields[col_idx] = {}
                    # Only set if not already set (first match wins for duplicates)
                    if field_key not in matched_fields[col_idx] or matched_fields[col_idx][field_key] is None:
                        matched_fields[col_idx][field_key] = value
                        confidence_scores[field_key] = 75  # Table extraction confidence

        # If no tables worked, try line-by-line text extraction
        if not matched_fields or all(len(v) == 0 for v in matched_fields.values()):
            matched_fields = {0: {}}
            period_labels = ["Extracted"]
            confidence_scores = {}

            lines = all_text.split("\n")
            for line in lines:
                # Try to match label and extract number from the same line
                field_key = _match_field(line)
                if field_key is None:
                    continue
                # Find numbers in the line
                numbers = re.findall(r"[\d,]+\.?\d*", line.replace(",", ""))
                if numbers:
                    val = _parse_number(numbers[-1])  # Take the last number
                    matched_fields[0][field_key] = val
                    confidence_scores[field_key] = 50  # Lower confidence for text extraction

        # Build periods
        for idx in sorted(matched_fields.keys()):
            label = period_labels[idx] if idx < len(period_labels) else f"Period {idx + 1}"
            periods_data.append({
                "label": label,
                "raw_items": matched_fields[idx],
            })

        return {
            "company_name": company_name,
            "filing_date": None,
            "currency": "USD",
            "unit": unit,
            "periods": periods_data,
            "confidence_scores": confidence_scores,
        }
