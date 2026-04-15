'use client';

export default function BalanceSheetPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1
            className="text-3xl sm:text-5xl font-semibold tracking-tight mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Balance Sheet
          </h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Upload a balance sheet to extract, normalize, and analyze key financial data.
          </p>
        </div>

        {/* Upload zone will be added in Branch 3 */}
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'var(--bg-secondary)',
            border: '2px dashed var(--border-color)',
          }}
        >
          <p style={{ color: 'var(--text-muted)' }}>Upload component coming soon</p>
        </div>
      </div>
    </main>
  );
}
