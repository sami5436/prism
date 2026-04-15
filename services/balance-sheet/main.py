"""
Balance Sheet Analyzer — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.upload import router as upload_router

app = FastAPI(
    title="Prism Balance Sheet Analyzer",
    description="Deterministic balance sheet parsing, normalization, and analysis service.",
    version="0.1.0",
)

# CORS — allow the Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "balance-sheet-analyzer"}
