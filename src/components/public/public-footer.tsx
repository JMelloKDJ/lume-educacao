'use client';

import { Lock } from 'lucide-react';
import type { AppScreen } from './public-navbar';

interface PublicFooterProps {
  onNavigate: (screen: AppScreen) => void;
}

export function PublicFooter({ onNavigate }: PublicFooterProps) {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 px-4 py-7 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="text-xs text-[var(--text-muted)]">
          Lume Educação · Preparação híbrida para o ENEM na Bahia
        </p>

        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          Acesso ao workspace
        </button>
      </div>
    </footer>
  );
}
