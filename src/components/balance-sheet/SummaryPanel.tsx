'use client';

import { BalanceSheetSummary, SWOTItem, ForwardSignal } from '@/types/balanceSheet';

interface SummaryPanelProps {
  summary: BalanceSheetSummary;
  companyName?: string | null;
}

const QUADRANTS: Array<{
  key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  title: string;
  subtitle: string;
  accent: string;
  emptyFallback: string;
}> = [
  {
    key: 'strengths',
    title: 'Strengths',
    subtitle: 'Structural advantages in liquidity, capital efficiency, or financing.',
    accent: '#16a34a',
    emptyFallback: 'No distinctive structural advantages surfaced from the current-period balance sheet.',
  },
  {
    key: 'weaknesses',
    title: 'Weaknesses',
    subtitle: 'Structural fragility or dependence visible in the capital stack.',
    accent: '#dc2626',
    emptyFallback: 'No material structural weaknesses detected at current ratios.',
  },
  {
    key: 'opportunities',
    title: 'Opportunities',
    subtitle: 'Ways the company could improve its position given current structure.',
    accent: '#2563eb',
    emptyFallback: 'No obvious structural optimisations suggested by the current balance sheet.',
  },
  {
    key: 'threats',
    title: 'Threats',
    subtitle: 'Scenarios where the current balance sheet becomes problematic.',
    accent: '#f59e0b',
    emptyFallback: 'No near-term structural threats flagged at current ratios.',
  },
];

function SwotList({ items, emptyFallback }: { items: SWOTItem[]; emptyFallback: string }) {
  if (!items.length) {
    return (
      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
        {emptyFallback}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.id}>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {item.label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {item.detail}
          </p>
        </li>
      ))}
    </ul>
  );
}

const AREA_LABEL: Record<ForwardSignal['area'], string> = {
  accounts_receivable: 'Accounts Receivable',
  accounts_payable: 'Accounts Payable',
  debt: 'Debt Levels',
  working_capital: 'Working Capital',
  equity: 'Equity Base',
  cash: 'Cash Position',
};

export default function SummaryPanel({ summary, companyName }: SummaryPanelProps) {
  return (
    <div className="bs-card bs-fade-in" id="bs-summary-panel">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Analyst Summary
          </h2>
          {companyName && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {companyName}
            </p>
          )}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bs-accent-dim)' }}
        >
          <svg className="w-4 h-4" style={{ color: 'var(--bs-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
        {summary.overview}
      </p>

      {summary.ratioNotes.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
          {summary.ratioNotes.map((note, i) => (
            <li
              key={i}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {note}
            </li>
          ))}
        </ul>
      )}

      {/* SWOT grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map(q => (
          <section
            key={q.key}
            className="rounded-lg p-4"
            style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${q.accent}33`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: q.accent }} />
              <span
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: q.accent }}
              >
                {q.title}
              </span>
            </div>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              {q.subtitle}
            </p>
            <SwotList items={summary[q.key]} emptyFallback={q.emptyFallback} />
          </section>
        ))}
      </div>

      {/* Forward-looking insight */}
      {summary.forwardLooking.length > 0 && (
        <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Forward-Looking Signals
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            What future changes in these line items would confirm improvement or signal deterioration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.forwardLooking.map(sig => (
              <div
                key={sig.id}
                className="rounded-lg p-3"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {AREA_LABEL[sig.area] ?? sig.area}
                </p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#16a34a' }}>
                      Improvement
                    </span>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {sig.improvement}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#dc2626' }}>
                      Deterioration
                    </span>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {sig.deterioration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
