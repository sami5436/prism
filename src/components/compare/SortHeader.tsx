'use client';

import type { ReactNode } from 'react';

export type SortDir = 'asc' | 'desc';

interface Props {
  active: boolean;
  direction: SortDir;
  onClick: () => void;
  align?: 'left' | 'right';
  children: ReactNode;
}

/**
 * Clickable table header with stacked-chevron sort indicator. Highlights the
 * active direction; the inactive arrow stays dimmed so headers don't reflow.
 */
export default function SortHeader({ active, direction, onClick, align = 'left', children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 cursor-pointer hover:opacity-100 transition-opacity ${active ? 'opacity-100' : 'opacity-70'} ${align === 'right' ? 'justify-end' : 'justify-start'}`}
      style={{ color: active ? 'var(--text-primary)' : 'inherit' }}
    >
      {align === 'right' ? (
        <>
          <SortGlyph active={active} direction={direction} />
          <span>{children}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <SortGlyph active={active} direction={direction} />
        </>
      )}
    </button>
  );
}

function SortGlyph({ active, direction }: { active: boolean; direction: SortDir }) {
  const upActive = active && direction === 'asc';
  const downActive = active && direction === 'desc';
  return (
    <span aria-hidden className="inline-flex flex-col text-[8px] leading-[8px]">
      <span style={{ opacity: upActive ? 1 : 0.3, color: upActive ? 'var(--text-primary)' : 'currentColor' }}>▲</span>
      <span style={{ opacity: downActive ? 1 : 0.3, color: downActive ? 'var(--text-primary)' : 'currentColor', marginTop: '1px' }}>▼</span>
    </span>
  );
}

/**
 * Compare two values for sorting. Nulls/undefined always sort to the bottom
 * regardless of direction — that's the standard spreadsheet behavior and
 * reads better than "—" jumping to the top on asc.
 */
export function compareValues(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
  dir: SortDir,
): number {
  const aNull = a === null || a === undefined || (typeof a === 'number' && !Number.isFinite(a));
  const bNull = b === null || b === undefined || (typeof b === 'number' && !Number.isFinite(b));
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a;
  }
  const sa = String(a);
  const sb = String(b);
  return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
}
