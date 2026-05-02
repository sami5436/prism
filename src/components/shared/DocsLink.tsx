import Link from 'next/link';

interface Props {
  /** Anchor target in /docs, e.g. "expected-move" */
  to: string;
  /** Tooltip / aria-label, e.g. "What is expected move?" */
  label: string;
  /** Optional size — default 12px */
  size?: number;
}

/**
 * Small info-circle that jumps from a portal panel to the matching docs
 * subsection. Designed to sit inline next to a heading or label without
 * shouting — opacity at rest, fades in on hover.
 */
export default function DocsLink({ to, label, size = 12 }: Props) {
  return (
    <Link
      href={`/docs#${to}`}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-full transition-opacity opacity-50 hover:opacity-100 align-middle"
      style={{ color: 'var(--text-muted)', width: size + 4, height: size + 4 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M6.3 6.1a1.7 1.7 0 1 1 2.4 1.6c-.5.3-.7.6-.7 1.1V9.3" />
        <circle cx="8" cy="11.4" r="0.55" fill="currentColor" stroke="none" />
      </svg>
    </Link>
  );
}
