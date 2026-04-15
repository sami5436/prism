'use client';

import { AnalysisFlag, FlagSeverity } from '@/types/balanceSheet';

interface HighlightsPanelProps {
  flags: AnalysisFlag[];
}

const severityConfig: Record<FlagSeverity, { bg: string; color: string; icon: string }> = {
  info: {
    bg: 'var(--bs-info-bg)',
    color: 'var(--bs-info)',
    icon: 'ℹ',
  },
  warning: {
    bg: 'var(--bs-warning-bg)',
    color: 'var(--bs-warning)',
    icon: '⚠',
  },
  critical: {
    bg: 'var(--bs-critical-bg)',
    color: 'var(--bs-critical)',
    icon: '⚡',
  },
};

export default function HighlightsPanel({ flags }: HighlightsPanelProps) {
  if (flags.length === 0) return null;

  return (
    <div className="bs-card bs-fade-in" id="bs-highlights">
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Watch Items
      </h3>

      <div className="space-y-3">
        {flags.map((flag, i) => {
          const config = severityConfig[flag.severity];
          return (
            <div
              key={flag.id}
              className={`flex items-start gap-3 p-3 rounded-lg bs-fade-in bs-stagger-${Math.min(i + 1, 6)}`}
              style={{ background: config.bg }}
            >
              <span className="text-sm mt-0.5 flex-shrink-0" role="img" aria-label={flag.severity}>
                {config.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: config.color }}>
                  {flag.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {flag.description}
                </p>
              </div>
              {flag.value !== undefined && (
                <span
                  className="text-sm font-mono flex-shrink-0"
                  style={{ color: config.color }}
                >
                  {typeof flag.value === 'number' ? flag.value.toFixed(2) : flag.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
