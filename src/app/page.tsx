import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import ModuleNav from '@/components/shared/ModuleNav';

interface ModuleCard {
  title: string;
  subtitle: string;
  features: string[];
  href: string;
  cta: string;
  icon: React.ReactNode;
}

const MODULES: ModuleCard[] = [
  {
    title: 'Indicators',
    subtitle: 'Technical analysis',
    href: '/indicators',
    cta: 'Open Indicators',
    features: [
      'RSI, MACD, SMA & Bollinger Bands',
      'Interactive price & volume charts',
      'Algorithmic signal analysis',
      'AI-generated market summary',
    ],
    icon: (
      <svg className="w-5 h-5" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: 'Balance Sheet',
    subtitle: 'SEC filings & ratios',
    href: '/balance-sheet',
    cta: 'Open Balance Sheet',
    features: [
      'Live EDGAR ticker lookup',
      'Key line item extraction',
      'Financial ratio computation',
      'Risk flagging & multi-period',
    ],
    icon: (
      <svg className="w-5 h-5" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Options',
    subtitle: 'Options chain analysis',
    href: '/options',
    cta: 'Open Options',
    features: [
      'Volume & open interest by strike',
      'Implied volatility by expiration',
      'Put/call ratio',
      'Expiration date selector',
    ],
    icon: (
      <svg className="w-5 h-5" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Compare',
    subtitle: 'ETFs, mutual funds, indices',
    href: '/compare',
    cta: 'Open Compare',
    features: [
      '1y / 5y / 10y / 15y CAGR',
      '$10K growth vs the S&P 500',
      'Drawdowns through real crises',
      'Monte Carlo projection cone',
    ],
    icon: (
      <svg className="w-5 h-5" style={{ color: '#a8a2ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17l6-6 4 4 8-8M14 7h7v7" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{ background: 'var(--bg-primary)', opacity: 0.95, borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Prism.
            </Link>
            <ModuleNav />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="pt-16">
        <div className="min-h-[90vh] flex flex-col items-center px-4 sm:px-6 pt-20 sm:pt-28">
          <div className="max-w-6xl w-full text-center">
            <h1
              className="text-5xl md:text-7xl font-semibold tracking-tight mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Prism.
            </h1>
            <p
              className="text-lg md:text-xl font-light mb-16 max-w-md mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your toolkit for stock analysis and financial intelligence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
              {MODULES.map(m => (
                <div
                  key={m.title}
                  className="rounded-2xl p-6 flex flex-col"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    minHeight: '300px',
                  }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(168,162,255,0.1)' }}
                    >
                      {m.icon}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {m.title}
                      </h2>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {m.features.map(f => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <svg
                          className="w-4 h-4 mt-0.5 shrink-0"
                          style={{ color: '#a8a2ff' }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={m.href}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                  >
                    {m.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
