'use client';

interface ConfidenceNoteProps {
  overallConfidence: number;
  sourceType: 'pdf' | 'xbrl' | 'html' | 'manual';
  fileName?: string;
}

const sourceLabels: Record<string, string> = {
  pdf: 'PDF extraction',
  xbrl: 'XBRL structured data',
  html: 'HTML filing',
  manual: 'Manual input',
};

export default function ConfidenceNote({ overallConfidence, sourceType, fileName }: ConfidenceNoteProps) {
  const confidenceColor =
    overallConfidence >= 80
      ? 'var(--bs-positive)'
      : overallConfidence >= 50
        ? 'var(--bs-warning)'
        : 'var(--bs-critical)';

  const confidenceLabel =
    overallConfidence >= 80
      ? 'High'
      : overallConfidence >= 50
        ? 'Medium'
        : 'Low';

  return (
    <div
      className="bs-card bs-fade-in flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs"
      id="bs-confidence-note"
    >
      {/* Source */}
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span style={{ color: 'var(--text-muted)' }}>
          Source: {sourceLabels[sourceType]}
          {fileName && <span className="ml-1 opacity-60">({fileName})</span>}
        </span>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: confidenceColor }}
        />
        <span style={{ color: 'var(--text-muted)' }}>
          Confidence: <span style={{ color: confidenceColor, fontWeight: 500 }}>{confidenceLabel} ({overallConfidence}%)</span>
        </span>
      </div>

      {/* Disclaimer */}
      <span className="sm:ml-auto" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
        Verify against source document
      </span>
    </div>
  );
}
