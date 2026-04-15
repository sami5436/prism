"""
Abstract base parser and parser detection.
All parsers return a raw extraction dict that gets normalized downstream.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseParser(ABC):
    """Base class for balance sheet parsers."""

    @abstractmethod
    def parse(self, file_path: str) -> dict[str, Any]:
        """
        Parse a file and return a raw extraction dict.

        Expected return shape:
        {
            "company_name": str | None,
            "filing_date": str | None,
            "currency": str,
            "unit": str,  # "units", "thousands", "millions", "billions"
            "periods": [
                {
                    "label": str,
                    "raw_items": {
                        "normalized_key": float | None,
                        ...
                    }
                }
            ],
            "confidence_scores": {
                "field_name": int (0-100),
                ...
            }
        }
        """
        ...


def detect_parser(extension: str) -> BaseParser:
    """Return the appropriate parser based on file extension."""
    ext = extension.lower()

    if ext in (".xml", ".xbrl"):
        from parsers.xbrl_parser import XBRLParser
        return XBRLParser()
    elif ext == ".pdf":
        from parsers.pdf_parser import PDFParser
        return PDFParser()
    else:
        raise ValueError(f"No parser available for extension: {ext}")
