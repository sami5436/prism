"""
Balance Sheet Analyzer — Pydantic models / API contracts.
Mirrors the TypeScript types in src/types/balanceSheet.ts.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    pdf = "pdf"
    xbrl = "xbrl"
    manual = "manual"


class FieldSource(str, Enum):
    parsed = "parsed"
    inferred = "inferred"
    missing = "missing"


class FlagSeverity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class NormalizedLineItems(BaseModel):
    cash_and_equivalents: Optional[float] = None
    short_term_investments: Optional[float] = None
    accounts_receivable: Optional[float] = None
    inventory: Optional[float] = None
    total_current_assets: Optional[float] = None
    property_plant_equipment: Optional[float] = None
    goodwill: Optional[float] = None
    intangible_assets: Optional[float] = None
    total_assets: Optional[float] = None
    accounts_payable: Optional[float] = None
    short_term_debt: Optional[float] = None
    total_current_liabilities: Optional[float] = None
    long_term_debt: Optional[float] = None
    total_liabilities: Optional[float] = None
    retained_earnings: Optional[float] = None
    total_equity: Optional[float] = None


class FieldConfidence(BaseModel):
    field: str
    confidence: int = Field(ge=0, le=100)
    source: FieldSource


class BalanceSheetRatios(BaseModel):
    current_ratio: Optional[float] = None
    debt_to_equity: Optional[float] = None
    working_capital: Optional[float] = None
    goodwill_to_assets: Optional[float] = None
    intangibles_to_assets: Optional[float] = None


class AnalysisFlag(BaseModel):
    id: str
    label: str
    description: str
    severity: FlagSeverity
    metric: Optional[str] = None
    value: Optional[float] = None


class BalanceSheetSummary(BaseModel):
    overview: str
    ratio_notes: list[str] = []
    flags: list[AnalysisFlag] = []


class ExtractionPeriod(BaseModel):
    label: str
    line_items: NormalizedLineItems
    confidence: list[FieldConfidence] = []


class BalanceSheetResult(BaseModel):
    company_name: Optional[str] = None
    filing_date: Optional[str] = None
    currency: str = "USD"
    unit: str = "units"
    periods: list[ExtractionPeriod] = []
    ratios: BalanceSheetRatios = BalanceSheetRatios()
    summary: BalanceSheetSummary = BalanceSheetSummary(overview="")
    source_type: SourceType = SourceType.pdf
    overall_confidence: int = Field(default=0, ge=0, le=100)


class UploadResponse(BaseModel):
    success: bool
    data: Optional[BalanceSheetResult] = None
    error: Optional[str] = None
