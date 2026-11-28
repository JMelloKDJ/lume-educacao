'use client';

import { cn } from '../../lib/utils';

export type KpiBadgeTone = 'positive' | 'neutral' | 'info' | 'gold' | 'critical';

export interface KpiCardProps {
  title: string;
  value: string;
  badgeText: string;
  badgeTone?: KpiBadgeTone;
  insight: string;
  className?: string;
}

const badgeToneStyles: Record<KpiBadgeTone, string> = {
  positive: 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]',
  neutral: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  gold: 'bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]',
  critical: 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]',
};

export function KpiCard({
  title,
  value,
  badgeText,
  badgeTone = 'neutral',
  insight,
  className,
}: KpiCardProps) {
  return (
    <article
      className={cn(
        'group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--border-strong)]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-[var(--text-secondary)] leading-snug">
          {title}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap shrink-0',
            badgeToneStyles[badgeTone]
          )}
        >
          {badgeText}
        </span>
      </div>

      <div className="mt-3 font-mono text-[28px] sm:text-[30px] font-bold tracking-tight text-[var(--text-primary)] tabular-nums leading-none">
        {value}
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
        {insight}
      </p>
    </article>
  );
}
