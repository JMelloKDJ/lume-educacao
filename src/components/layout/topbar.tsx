'use client';

import {
  Bell,
  Calendar,
  CheckCheck,
  Menu,
  Moon,
  Plus,
  Sun,
} from 'lucide-react';
import {
  CUTOFF_SNAPSHOTS,
  type CutoffId,
  type CutoffSnapshot,
  type ExecutiveAlert,
} from '../../data/mock-project';
import { cn } from '../../lib/utils';
import { useTheme } from '../theme-provider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface TopbarProps {
  title: string;
  subtitle: string;
  cutoffId: CutoffId;
  snapshot: CutoffSnapshot;
  onCutoffChange: (id: CutoffId) => void;
  alerts: ExecutiveAlert[];
  onMarkAllAlertsRead: () => void;
  onToggleAlertRead: (id: string) => void;
  onOpenUpdateModal: () => void;
  onOpenMobileMenu: () => void;
}

const CUTOFF_OPTIONS: Array<{ id: CutoffId; label: string }> = [
  { id: '2026-10', label: CUTOFF_SNAPSHOTS['2026-10'].label },
  { id: '2026-09', label: CUTOFF_SNAPSHOTS['2026-09'].label },
  { id: '2026-08', label: CUTOFF_SNAPSHOTS['2026-08'].label },
  { id: '2026-07', label: CUTOFF_SNAPSHOTS['2026-07'].label },
];

export function Topbar({
  title,
  subtitle,
  cutoffId,
  onCutoffChange,
  alerts,
  onMarkAllAlertsRead,
  onToggleAlertRead,
  onOpenUpdateModal,
  onOpenMobileMenu,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <header className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5 shadow-[var(--shadow-card)] sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile drawer button + Dynamic Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Abrir menu lateral"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] lg:hidden cursor-pointer shrink-0"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-[var(--font-display)] text-base sm:text-[18px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Period Select, Claro|Escuro Segmented Toggle, Alerts Bell Popover, + Atualizar Dados */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0">
          {/* Period Cutoff Select */}
          <Select
            value={cutoffId}
            onValueChange={(value) => onCutoffChange(value as CutoffId)}
          >
            <SelectTrigger aria-label="Selecionar período">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              {CUTOFF_OPTIONS.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Compact Mobile Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={
              theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
            }
            className="inline-flex sm:hidden h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 text-[var(--brand-gold)]" />
            ) : (
              <Sun className="h-4 w-4 text-[var(--brand-primary)]" />
            )}
          </button>

          {/* Segmented Theme Toggle (Claro | Escuro) */}
          <div
            role="group"
            aria-label="Selecionar tema da interface"
            className="hidden sm:inline-flex h-9 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-[9px] px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                theme === 'light'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-[9px] px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                theme === 'dark'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <Moon className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
              Escuro
            </button>
          </div>

          {/* Alerts Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={
                  unreadCount > 0
                    ? `Alertas (${unreadCount} não lidos)`
                    : 'Alertas executivos'
                }
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 cursor-pointer shrink-0"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--status-critical)] px-1 font-mono text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
                <div>
                  <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                    Alertas do Programa
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {unreadCount > 0
                      ? `${unreadCount} pendência${unreadCount > 1 ? 's' : ''} para revisão`
                      : 'Todos os alertas foram revisados'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAlertsRead}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft)] cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Ler todos
                  </button>
                )}
              </div>

              <div className="divide-y divide-[var(--border-subtle)] max-h-[300px] overflow-y-auto">
                {alerts.map((alert) => {
                  const toneColor =
                    alert.severity === 'critical'
                      ? 'bg-[var(--status-critical)]'
                      : alert.severity === 'gold'
                        ? 'bg-[var(--brand-gold)]'
                        : 'bg-[var(--status-positive)]';

                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => onToggleAlertRead(alert.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer',
                        !alert.read && 'bg-[var(--brand-primary-soft)]/35'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', toneColor)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {alert.detail}
                        </p>
                        <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
                          {alert.time}
                          {!alert.read ? ' · Novo' : ' · Lido'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Primary Action CTA: + Atualizar Dados */}
          <button
            type="button"
            onClick={onOpenUpdateModal}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Atualizar Dados</span>
            <span className="sm:hidden">Atualizar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
