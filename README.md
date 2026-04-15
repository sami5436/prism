# Prism.

Stock analysis and financial statement tools built with Next.js.

## Modules

### Prism — Stock Analysis
Technical indicators (RSI, MACD, SMA, Bollinger Bands), interactive charts, options chains, and algorithmic signals.

### Balance Sheet Analyzer
Upload balance sheet documents (PDF, XBRL, XML) to extract, normalize, and analyze key financial data.

**What it does:**
- Extracts key balance sheet line items (cash, assets, liabilities, equity, etc.)
- Computes financial ratios: current ratio, debt-to-equity, working capital
- Detects YoY changes and flags potential concerns
- Generates deterministic, template-based summaries (no LLM)
- Supports PDF table extraction and XBRL/US-GAAP taxonomy parsing

**Current limitations (V1):**
- Single-document analysis only (no multi-statement support)
- PDF parsing relies on table extraction — unstructured or image-based PDFs may not parse well
- No persistent storage — results are session-only
- No authentication
- XBRL parser covers common US-GAAP tags but not all possible taxonomies
- No IFRS support yet

**Extension points:**
- Additional parsers can be added in `services/balance-sheet/parsers/` (implement `BaseParser`)
- New ratio computations in `services/balance-sheet/engine/ratios.py`
- New flag rules in `services/balance-sheet/engine/summary.py`
- Income statement and cash flow analysis modules
- Cross-linking with Prism stock indicators for the same company
- Persistent storage and comparison history
- IFRS taxonomy support in the XBRL parser

## Getting Started

### Frontend (Next.js)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Balance Sheet Python Service

```bash
cd services/balance-sheet
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The service runs at `http://localhost:8000`. The Next.js dev server proxies `/api/balance-sheet/*` requests to it automatically.

## Architecture

```
prism/
├── src/                              # Next.js frontend
│   ├── app/                          # App Router pages
│   │   ├── page.tsx                  # Prism stock analysis home
│   │   ├── balance-sheet/            # Balance Sheet Analyzer
│   │   │   ├── layout.tsx            # Shared header/nav
│   │   │   ├── page.tsx              # Upload page
│   │   │   └── results/page.tsx      # Results display
│   │   └── api/                      # API routes
│   ├── components/
│   │   ├── balance-sheet/            # BS-specific components
│   │   └── shared/                   # Cross-module components
│   ├── types/                        # TypeScript interfaces
│   └── lib/                          # Client utilities
├── services/
│   └── balance-sheet/                # Python FastAPI service
│       ├── parsers/                  # PDF + XBRL parsers
│       ├── normalizer/               # Field normalization
│       ├── engine/                   # Ratios + summary generation
│       ├── models/                   # Pydantic schemas
│       └── routers/                  # API endpoints
└── docs/
    └── changelog.md                  # Development log
```

## Deploy on Vercel

The Next.js frontend deploys to Vercel. The Python service needs a separate hosting solution (Railway, Fly.io, etc.).

Set `BALANCE_SHEET_SERVICE_URL` environment variable in Vercel to point to your deployed Python service.
