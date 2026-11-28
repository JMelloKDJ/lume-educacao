'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../theme-provider';

export type AppScreen = 'landing' | 'sobre' | 'login' | 'app';

interface PublicNavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export function LumeLogoMark() {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-xs">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2.75L14.2 9.8L21.25 12L14.2 14.2L12 21.25L9.8 14.2L2.75 12L9.8 9.8L12 2.75Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function PublicNavbar({ currentScreen, onNavigate }: PublicNavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: Array<{
    label: string;
    screen: AppScreen;
    isActive: boolean;
  }> = [
    { label: 'Início', screen: 'landing', isActive: currentScreen === 'landing' },
    { label: 'Sobre Nós', screen: 'sobre', isActive: currentScreen === 'sobre' },
  ];

  const handleLinkClick = (screen: AppScreen) => {
    setMobileMenuOpen(false);
    onNavigate(screen);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('landing')}
          className="inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 rounded-lg"
        >
          <LumeLogoMark />
          <span className="font-[var(--font-display)] text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
            Lume Educação
          </span>
        </button>

        {/* Center: Only Início & Sobre Nós (exact match to Figma prints) */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-8"
        >
          {navLinks.map((link) => (
            <button
              key={link.screen}
              type="button"
              onClick={() => handleLinkClick(link.screen)}
              aria-current={link.isActive ? 'page' : undefined}
              className={cn(
                'relative py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:text-[var(--text-primary)]',
                link.isActive
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {link.label}
              {link.isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-[var(--brand-primary)]"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Theme Toggle + Entrar + Mobile Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Alternar tema claro ou escuro"
            className="hidden sm:inline-flex h-9 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Ativar tema claro"
              aria-pressed={theme === 'light'}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer',
                theme === 'light'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Ativar tema escuro"
              aria-pressed={theme === 'dark'}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer',
                theme === 'dark'
                  ? 'bg-[var(--bg-surface)] text-[var(--brand-gold)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleLinkClick('login')}
            className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--brand-primary)] px-5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] md:hidden"
          >
            <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <button
                  key={link.screen}
                  type="button"
                  onClick={() => handleLinkClick(link.screen)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer',
                    link.isActive
                      ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {link.label}
                </button>
              ))}

              <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                <span className="text-xs font-medium text-[var(--text-muted)]">Aparência</span>
                <div className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer',
                      theme === 'light'
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer',
                      theme === 'dark'
                        ? 'bg-[var(--bg-surface)] text-[var(--brand-gold)]'
                        : 'text-[var(--text-muted)]'
                    )}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Escuro
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
