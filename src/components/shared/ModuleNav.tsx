'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  matchPrefix: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Stocks', href: '/', matchPrefix: '/' },
  { label: 'Balance Sheet', href: '/balance-sheet', matchPrefix: '/balance-sheet' },
];

export default function ModuleNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPrefix === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(item.matchPrefix);
  };

  return (
    <nav className="flex items-center gap-1" id="module-nav" aria-label="Module navigation">
      {NAV_ITEMS.map(item => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              background: active ? 'var(--bg-secondary)' : 'transparent',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
