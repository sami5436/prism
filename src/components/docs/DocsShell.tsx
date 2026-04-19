'use client';

import { ReactNode, useState } from 'react';

interface TOCEntry {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
}

interface Props {
  toc: TOCEntry[];
  children: ReactNode;
}

function TocNav({ toc, onLinkClick }: { toc: TOCEntry[]; onLinkClick?: () => void }) {
  return (
    <nav aria-label="Docs navigation">
      <p className="text-[10px] uppercase tracking-wider font-medium mb-3"
         style={{ color: 'var(--text-muted)' }}>
        Contents
      </p>
      <ul className="space-y-1">
        {toc.map(entry => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              onClick={onLinkClick}
              className="block text-sm py-1 transition-colors hover:opacity-100"
              style={{ color: 'var(--text-primary)', fontWeight: 500 }}
            >
              {entry.label}
            </a>
            {entry.children && (
              <ul className="ml-3 mt-1 space-y-0.5 border-l pl-3"
                  style={{ borderColor: 'var(--border-color)' }}>
                {entry.children.map(c => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      onClick={onLinkClick}
                      className="block text-xs py-0.5 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function DocsShell({ toc, children }: Props) {
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">

        {/* Mobile TOC toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setTocOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg w-full"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            aria-expanded={tocOpen}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="3" x2="13" y2="3" />
              <line x1="1" y1="7" x2="9" y2="7" />
              <line x1="1" y1="11" x2="11" y2="11" />
            </svg>
            Contents
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              className="ml-auto transition-transform"
              style={{ transform: tocOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </button>
          {tocOpen && (
            <div className="mt-2 px-3 py-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <TocNav toc={toc} onLinkClick={() => setTocOpen(false)} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <TocNav toc={toc} />
          </aside>

          {/* Content */}
          <article className="min-w-0">{children}</article>
        </div>
      </div>
    </main>
  );
}

export function Section({
  id,
  title,
  children,
  lead,
}: {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-28">
      <h2 className="text-2xl font-semibold mb-2 tracking-tight"
          style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {lead && (
        <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {lead}
        </p>
      )}
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md px-4 py-3 text-sm font-mono tabular-nums"
         style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
      {children}
    </div>
  );
}

export function Callout({
  kind = 'insight',
  title,
  children,
}: {
  kind?: 'insight' | 'warning' | 'example';
  title: string;
  children: ReactNode;
}) {
  const colors = {
    insight: { accent: '#3b82f6', label: 'Why it works' },
    warning: { accent: '#f59e0b', label: 'Watch out' },
    example: { accent: '#22c55e', label: 'Example' },
  }[kind];
  return (
    <div className="rounded-lg p-4"
         style={{ background: 'var(--bg-secondary)', border: `1px solid ${colors.accent}33` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.accent }} />
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: colors.accent }}>
          {title ? `${colors.label} — ${title}` : colors.label}
        </span>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

export function Term({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[0.9em] px-1 py-0.5 rounded"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      {children}
    </span>
  );
}
