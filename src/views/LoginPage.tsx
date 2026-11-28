'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react';
import type { WorkspaceUserProfile } from '../components/layout/sidebar';
import { LumeLogoMark, type AppScreen } from '../components/public/public-navbar';
import { useTheme } from '../components/theme-provider';

interface LoginPageProps {
  onLoginSuccess: (profile: WorkspaceUserProfile) => void;
  onNavigate: (screen: AppScreen) => void;
}

const QUICK_PROFILES: Record<'diretoria' | 'coordenacao', WorkspaceUserProfile> = {
  diretoria: {
    name: 'Nara Pereira',
    role: 'Comitê Diretor',
    initials: 'NP',
    email: 'diretoria@lumeeducacao.org',
  },
  coordenacao: {
    name: 'João Victor',
    role: 'Coordenação',
    initials: 'JV',
    email: 'coordenacao@lumeeducacao.org',
  },
};

function deriveProfileFromEmail(email: string): WorkspaceUserProfile {
  const localPart = email.split('@')[0] || 'Coordenação';
  const parts = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return QUICK_PROFILES.coordenacao;
  }

  const formattedName = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : formattedName.slice(0, 2).toUpperCase();

  return {
    name: formattedName,
    role: 'Coordenação',
    initials,
    email,
  };
}

export function LoginPage({ onLoginSuccess, onNavigate }: LoginPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('nome@lumeeducacao.org');
  const [password, setPassword] = useState('lume2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Informe um e-mail institucional válido.');
      return;
    }
    if (password.trim().length < 4) {
      setError('Digite sua senha para acessar o workspace.');
      return;
    }
    setError('');
    onLoginSuccess(deriveProfileFromEmail(trimmedEmail));
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--bg-canvas)] text-[var(--text-primary)] lg:grid-cols-[44%_56%]">
      {/* Left Split-Screen Visual Brand Panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
        {/* Decorative radial glow and concentric rings matching Figma Login */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-1/2 h-[440px] w-[440px] -translate-y-1/2"
        >
          <div
            className="absolute inset-0 rounded-full opacity-25 dark:opacity-40 blur-[90px]"
            style={{
              background:
                'radial-gradient(circle, var(--brand-primary) 0%, transparent 68%)',
            }}
          />
          <div className="absolute inset-2 rounded-full border border-[var(--border-brand)]/25" />
          <div className="absolute inset-14 rounded-full border border-dashed border-[var(--brand-gold)]/25" />
        </div>

        {/* Top Brand (returns to landing) */}
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 rounded-lg"
          >
            <LumeLogoMark />
            <span className="font-[var(--font-display)] text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
              Lume Educação
            </span>
          </button>
        </div>

        {/* Center Message */}
        <div className="relative z-10 my-12 max-w-md lg:my-0">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
            Workspace Executivo
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-[38px] leading-[1.12]">
            Acompanhe metas, prazos e cenários em um único lugar.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Visão consolidada do programa educacional com atualização contínua e apoio do assistente Lumi.
          </p>
        </div>

        {/* Bottom Copyright */}
        <p className="relative z-10 text-xs text-[var(--text-muted)]">
          © 2026 Lume Educação · Bahia
        </p>
      </aside>

      {/* Right Split-Screen Form Panel */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[440px] rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 sm:p-9 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Entrar no workspace
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Use suas credenciais institucionais
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'
              }
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {theme === 'dark' ? (
                <Moon className="h-4 w-4 text-[var(--brand-gold)]" />
              ) : (
                <Sun className="h-4 w-4 text-[var(--brand-primary)]" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                E-mail
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@lumeeducacao.org"
                  className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pl-10 pr-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                Senha
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pl-10 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-[var(--status-critical)]">{error}</p>
            )}

            <button
              type="submit"
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--brand-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 cursor-pointer"
            >
              Entrar
            </button>
          </form>

          {/* Discreet Quick Access by Profile */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
              <span className="absolute bg-[var(--bg-surface)] px-3 text-[11px] text-[var(--text-muted)]">
                ou acesso por perfil
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onLoginSuccess(QUICK_PROFILES.diretoria)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Comitê Diretor
              </button>
              <button
                type="button"
                onClick={() => onLoginSuccess(QUICK_PROFILES.coordenacao)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Coordenação
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
