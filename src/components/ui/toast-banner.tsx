'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 left-5 z-50 flex max-w-[calc(100vw-6.5rem)] sm:max-w-sm"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--border-brand)] bg-[var(--bg-surface)] px-4 py-3.5 shadow-[var(--shadow-popover)]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-positive)]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fechar notificação"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
