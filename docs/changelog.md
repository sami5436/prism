# Balance Sheet Analyzer — Changelog

## Development Log

### Branch 1: `feat/balance-sheet-scaffolding`
- **Added**: TypeScript types (`balanceSheet.ts`), placeholder pages, API proxy route, client-side API helpers
- **Commit**: `feat(balance-sheet): add module scaffolding with types, routes, and placeholder pages`
- **Merged**: → `main` (fast-forward)

### Branch 2: `feat/balance-sheet-design-system`
- **Added**: CSS design tokens (teal/emerald accent palette), animations (`bs-shimmer`, `bs-fade-in`, `bs-pulse-border`), component shells (UploadZone, ProcessingState, SummaryPanel, MetricsCards, BalanceSheetTable, HighlightsPanel, ConfidenceNote)
- **Commit**: `feat(balance-sheet): add mobile-first design system with tokens, animations, and component shells`
- **Merged**: → `main` (fast-forward)

### Branch 3: `feat/balance-sheet-upload-flow`
- **Added**: Full upload landing page with state management (idle/uploading/processing/error), drag-and-drop, file validation, animated states
- **Commit**: `feat(balance-sheet): implement upload flow with drag-drop, validation, and state management`
- **Merged**: → `main` (fast-forward)

### Branch 4: `feat/balance-sheet-python-service`
- **Added**: FastAPI service (`services/balance-sheet/`), Pydantic schemas, upload router, Next.js rewrite proxy, `.gitignore` updates for Python
- **Commit**: `feat(balance-sheet): add Python FastAPI service scaffolding with schemas, upload router, and Next.js proxy`
- **Merged**: → `main` (fast-forward)

### Branch 5: `feat/balance-sheet-parser-pipeline`
- **Added**: Abstract parser base, PDF parser (pdfplumber + regex pattern matching), XBRL parser (US-GAAP taxonomy mapping), normalization layer with field inference
- **Commit**: `feat(balance-sheet): implement PDF and XBRL parsers with normalization pipeline`
- **Merged**: → `main` (fast-forward)

### Branch 6: `feat/balance-sheet-summary-engine`
- **Added**: Ratio computation (current ratio, D/E, working capital, goodwill/assets, intangibles/assets), template-based summary generator, YoY change detection, severity-graded flags
- **Commit**: `feat(balance-sheet): add deterministic ratio computation and template-based summary engine`
- **Merged**: → `main` (fast-forward)

### Branch 7: `feat/balance-sheet-results-ui`
- **Added**: Full results page with snake_case→camelCase mapping, summary panel, metrics cards, balance sheet table, highlights panel, confidence note
- **Commit**: `feat(balance-sheet): implement full results page with summary, metrics, table, highlights, and confidence display`
- **Merged**: → `main` (fast-forward)

### Branch 8: `feat/balance-sheet-site-integration`
- **Added**: ModuleNav component, balance sheet route layout with shared header, home page cross-link, layout metadata updates, changelog, README update
- **Commit**: `feat(balance-sheet): integrate with existing site navigation, add changelog and README`
- **Merged**: → `main` (fast-forward)
