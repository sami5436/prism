'use client';

import { BalanceSheetSummary } from '@/types/balanceSheet';

interface SummaryPanelProps {
  summary: BalanceSheetSummary;
  companyName?: string | null;
}

export default function SummaryPanel({ summary, companyName }: SummaryPanelProps) {
  return (
    <div className="bs-card bs-fade-in" id="bs-summary-panel">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Summary
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
        <ul className="space-y-1.5">
          {summary.ratioNotes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--bs-accent)' }}>·</span>
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
