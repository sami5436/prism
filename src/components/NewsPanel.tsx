'use client';

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}

interface Props {
  items: NewsItem[];
  loading?: boolean;
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NewsPanel({ items, loading }: Props) {
  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          News
        </h3>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          via Yahoo Finance
        </span>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent headlines.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((n) => (
            <li key={n.link}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <p
                  className="text-sm leading-snug group-hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {n.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {n.publisher} · {relTime(n.publishedAt)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
