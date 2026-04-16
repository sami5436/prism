'use client';

export interface ExampleFiling {
  ticker: string;
  company: string;
  period: string;
  url: string;
}

export const EXAMPLE_FILINGS: ExampleFiling[] = [
  {
    ticker: 'NVDA',
    company: 'NVIDIA',
    period: 'Q3 FY26 · Oct 26, 2025',
    url: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581025000230/nvda-20251026.htm',
  },
  {
    ticker: 'AAPL',
    company: 'Apple',
    period: 'Q1 FY26 · Dec 27, 2025',
    url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019326000006/aapl-20251227.htm',
  },
  {
    ticker: 'GOOGL',
    company: 'Alphabet',
    period: 'Q3 2025 · Sep 30, 2025',
    url: 'https://www.sec.gov/Archives/edgar/data/1652044/000165204425000091/goog-20250930.htm',
  },
  {
    ticker: 'MSFT',
    company: 'Microsoft',
    period: 'Q1 FY26 · Sep 30, 2025',
    url: 'https://www.sec.gov/Archives/edgar/data/789019/000119312525256321/msft-20250930.htm',
  },
];

interface ExampleFilingsProps {
  onSelect: (filing: ExampleFiling) => void;
  isBusy: boolean;
}

export default function ExampleFilings({ onSelect, isBusy }: ExampleFilingsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {EXAMPLE_FILINGS.map(f => (
        <button
          key={f.ticker}
          onClick={() => onSelect(f)}
          disabled={isBusy}
          className="flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bs-accent-dim)]"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--bs-card-border)',
          }}
          id={`bs-example-${f.ticker.toLowerCase()}`}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--bs-accent)' }}>
            {f.ticker}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
            {f.company}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {f.period}
          </span>
        </button>
      ))}
    </div>
  );
}
