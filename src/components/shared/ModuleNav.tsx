'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  matchPrefix: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Indicators', href: '/', matchPrefix: '/' },
  { label: 'Balance Sheet (WIP)', href: '/balance-sheet', matchPrefix: '/balance-sheet' },
  { label: 'Options', href: '/options', matchPrefix: '/options' },
  { label: 'Docs', href: '/docs', matchPrefix: '/docs' },
];

export default function ModuleNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) => {
    if (item.matchPrefix === '/') return pathname === '/';
    return pathname.startsWith(item.matchPrefix);
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1" id="module-nav" aria-label="Module navigation">
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

      {/* Mobile hamburger */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          )}
        </button>

        {open && (
          <nav
            aria-label="Mobile navigation"
            className="absolute left-0 right-0 top-full z-50 px-4 py-3 flex flex-col gap-1 shadow-lg"
            style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}
          >
            {NAV_ITEMS.map(item => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
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
        )}
      </div>
    </>
  );
}
