"""
Upload endpoint — accepts balance sheet files, dispatches to appropriate parser,
runs normalization and analysis, returns structured result.
"""

from __future__ import annotations

import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import BalanceSheetResult, SourceType
from parsers.base import detect_parser
from normalizer.normalize import normalize_extraction
from engine.ratios import compute_ratios
from engine.summary import generate_summary

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".xml", ".xbrl"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/upload")
async def upload_balance_sheet(file: UploadFile = File(...)) -> BalanceSheetResult:
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type ({ext}). Accepted: PDF, XML, XBRL.",
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents) / 1024 / 1024:.1f}MB). Maximum: 25MB.",
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    # Write to temp file for parsing
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Detect and run parser
        parser = detect_parser(ext)
        raw_extraction = parser.parse(tmp_path)

        # Normalize extracted data
        periods = normalize_extraction(raw_extraction)

        # Compute ratios from most recent period
        ratios = compute_ratios(periods)

        # Generate summary
        summary = generate_summary(periods, ratios)

        # Aggregate confidence
        all_confidences = []
        for p in periods:
            all_confidences.extend([c.confidence for c in p.confidence])
        overall = int(sum(all_confidences) / len(all_confidences)) if all_confidences else 0

        source_type = SourceType.xbrl if ext in (".xml", ".xbrl") else SourceType.pdf

        return BalanceSheetResult(
            company_name=raw_extraction.get("company_name"),
            filing_date=raw_extraction.get("filing_date"),
            currency=raw_extraction.get("currency", "USD"),
            unit=raw_extraction.get("unit", "units"),
            periods=periods,
            ratios=ratios,
            summary=summary,
            source_type=source_type,
            overall_confidence=overall,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        ) from e
    finally:
        os.unlink(tmp_path)
