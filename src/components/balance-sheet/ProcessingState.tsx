'use client';

export default function ProcessingState() {
  return (
    <div className="space-y-6 bs-fade-in" id="bs-processing-state">
      {/* Summary skeleton */}
      <div className="bs-card">
        <div className="bs-skeleton h-5 w-32 mb-4" />
        <div className="space-y-2">
          <div className="bs-skeleton h-4 w-full" />
          <div className="bs-skeleton h-4 w-4/5" />
          <div className="bs-skeleton h-4 w-3/5" />
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bs-card">
            <div className="bs-skeleton h-3 w-20 mb-3" />
            <div className="bs-skeleton h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bs-card">
        <div className="bs-skeleton h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex justify-between">
              <div className="bs-skeleton h-4 w-36" />
              <div className="bs-skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Processing indicator */}
      <div className="text-center py-4">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: 'var(--bs-accent-dim)', color: 'var(--bs-accent)' }}
        >
          <svg
            className="w-4 h-4"
            style={{ animation: 'bs-spin 1s linear infinite' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Extracting financial data…
        </div>
      </div>
    </div>
  );
}
