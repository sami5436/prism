import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare — Prism',
  description: 'Compare ETFs, mutual funds, and indices across long-run growth, drawdowns, and projections.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
