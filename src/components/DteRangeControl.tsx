'use client';

import { useEffect, useMemo, useState } from 'react';

export interface DteRange {
  min: number;
  max: number;
}

export const DTE_PRESETS: { label: string; min: number; max: number }[] = [
  { label: 'Weekly', min: 0, max: 14 },
  { label: 'Monthly', min: 15, max: 60 },
  { label: 'Quarterly', min: 60, max: 120 },
  { label: 'LEAPS-ish', min: 120, max: 365 },
];

export const DTE_DEFAULT: DteRange = { min: 15, max: 60 };

interface Props {
  value: DteRange;
  onChange: (next: DteRange) => void;
}

/**
 * Single DTE-range selector. Owns local input state so typing into the boxes
 * doesn't trigger a refetch on every keystroke; commits to the parent after
 * a short debounce or when the user picks a preset.
 */
export default function DteRangeControl({ value, onChange }: Props) {
  const [draft, setDraft] = useState<DteRange>(value);
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft.min === value.min && draft.max === value.max) return;
    const t = setTimeout(() => onChange(draft), 350);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  const invalid = draft.min > draft.max;

  const activePreset = useMemo(
    () => DTE_PRESETS.find(p => p.min === draft.min && p.max === draft.max)?.label ?? 'Custom',
    [draft],
  );

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    border: `1px solid ${invalid ? '#f59e0b' : 'var(--border-color)'}`,
    color: 'var(--text-primary)',
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          DTE
        </span>
        <input
          type="number"
          min={0}
          max={730}
          value={draft.min}
          onChange={(e) => setDraft({ ...draft, min: Math.max(0, Number(e.target.value) || 0) })}
          className="w-16 text-xs tabular-nums rounded-md px-2 py-1 outline-none"
          style={inputStyle}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
        <input
          type="number"
          min={0}
          max={730}
          value={draft.max}
          onChange={(e) => setDraft({ ...draft, max: Math.max(0, Number(e.target.value) || 0) })}
          className="w-16 text-xs tabular-nums rounded-md px-2 py-1 outline-none"
          style={inputStyle}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {DTE_PRESETS.map((p) => {
          const active = activePreset === p.label;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => { setDraft({ min: p.min, max: p.max }); onChange({ min: p.min, max: p.max }); }}
              className="text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              style={{
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: `1px solid ${active ? '#3b82f6' : 'var(--border-color)'}`,
                color: active ? '#3b82f6' : 'var(--text-muted)',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {invalid && (
        <p className="text-[10px]" style={{ color: '#f59e0b' }}>
          Min must be ≤ max.
        </p>
      )}
    </div>
  );
}
