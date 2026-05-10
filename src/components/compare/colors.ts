// Stable color assignment so the same asset has the same color across panels.
// Index 0 is the user's first pick; index N+ wraps.
export const ASSET_COLORS = [
  '#a8a2ff', // purple (matches landing accent)
  '#34d399', // emerald
  '#fbbf24', // amber
  '#ec4899', // pink
  '#22d3ee', // cyan
  '#f87171', // red
];

export const BENCHMARK_COLOR = '#6b7280';

export function colorFor(index: number): string {
  return ASSET_COLORS[index % ASSET_COLORS.length];
}
