'use client';

import ThemeToggle from '@/components/ThemeToggle';
import ModuleNav from '@/components/shared/ModuleNav';

export default function OptionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{
          background: 'var(--bg-primary)',
          opacity: 0.95,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Prism.
              </a>
              <ModuleNav />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
