import DocsShell from '@/components/docs/DocsShell';
import IndicatorsDocs from '@/components/docs/IndicatorsDocs';
import BalanceSheetDocs from '@/components/docs/BalanceSheetDocs';
import OptionsDocs from '@/components/docs/OptionsDocs';

const TOC = [
  {
    id: 'indicators',
    label: 'Indicators',
    children: [
      { id: 'moving-averages', label: 'Moving Averages' },
      { id: 'rsi', label: 'RSI' },
      { id: 'macd', label: 'MACD' },
      { id: 'bollinger', label: 'Bollinger Bands' },
      { id: 'indicator-combo', label: 'Using them together' },
    ],
  },
  {
    id: 'balance-sheet',
    label: 'Balance Sheet',
    children: [
      { id: 'accounting-equation', label: 'The accounting equation' },
      { id: 'bs-structure', label: 'How it\u2019s organized' },
      { id: 'current-ratio', label: 'Current Ratio' },
      { id: 'debt-equity', label: 'Debt / Equity' },
      { id: 'working-capital', label: 'Working Capital' },
      { id: 'goodwill', label: 'Goodwill' },
      { id: 'intangibles', label: 'Intangibles' },
      { id: 'how-prism-ranks', label: 'How this module works' },
    ],
  },
  {
    id: 'options',
    label: 'Options',
    children: [
      { id: 'contract-basics', label: 'Contract basics' },
      { id: 'intrinsic-extrinsic', label: 'Intrinsic vs extrinsic' },
      { id: 'greeks', label: 'The Greeks' },
      { id: 'iv-hv', label: 'IV vs HV' },
      { id: 'iv-rank', label: 'IV Rank & Percentile' },
      { id: 'black-scholes', label: 'Black-Scholes' },
      { id: 'strategies', label: 'Strategies' },
      { id: 'screener-math', label: 'Screener math' },
      { id: 'options-glossary', label: 'Glossary' },
    ],
  },
];

export default function DocsPage() {
  return (
    <DocsShell toc={TOC}>
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3"
            style={{ color: 'var(--text-primary)' }}>
          Docs
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          A working knowledge of what each module means and, more importantly, <em>why</em> it means what
          it does. No filler &mdash; every section gives you the math, the intuition, and the trap to
          avoid.
        </p>
      </header>

      <IndicatorsDocs />
      <BalanceSheetDocs />
      <OptionsDocs />

      <footer className="pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Everything here is educational. Nothing in these docs is investment advice. Markets are
          adversarial systems &mdash; other participants are reading the same indicators and running the
          same models, which is why no single signal works forever. Understand the math, test with real
          data, and size positions like you expect to be wrong occasionally, because you will be.
        </p>
      </footer>
    </DocsShell>
  );
}
