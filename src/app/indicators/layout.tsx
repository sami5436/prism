import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indicators — Prism',
  description: 'Technical indicators, price action, news, and analyst sentiment for any US-listed equity.',
};

export default function IndicatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
