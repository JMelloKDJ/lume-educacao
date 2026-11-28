'use client';

import { Compass, Users, WifiOff } from 'lucide-react';
import { PublicFooter } from '../components/public/public-footer';
import { PublicNavbar, type AppScreen } from '../components/public/public-navbar';
import { LUME_TEAM } from '../data/mock-project';

interface SobrePageProps {
  onNavigate: (screen: AppScreen) => void;
}

const CONTEXT_CARDS = [
  {
    title: '12 polos',
    description: 'Cobertura regional a partir de Feira de Santana',
  },
  {
    title: '3G / Offline',
    description: 'Conteúdo compactado para funcionar sem instabilidade',
  },
  {
    title: 'Híbrido',
    description: 'Integração entre app do aluno, tutores e escolas',
  },
];

const PILLARS = [
  {
    icon: WifiOff,
    title: 'Acesso Offline First',
    description:
      'Materiais e videoaulas otimizados para rodar bem em redes móveis e áreas rurais.',
  },
  {
    icon: Compass,
    title: 'Trilha Personalizada',
    description:
      'Diagnóstico contínuo que prioriza as habilidades com maior ganho no ENEM.',
  },
  {
    icon: Users,
    title: 'Modelo Híbrido Real',
    description:
      'Integração direta entre plataforma digital, tutores locais e escolas parceiras.',
  },
];

export function SobrePage({ onNavigate }: SobrePageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <PublicNavbar currentScreen="sobre" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* Hero / Context Section */}
        <section className="relative overflow-hidden border-b border-[var(--border-subtle)] py-16 sm:py-24">
          {/* Subtle decorative orbital rings on right (matches Figma Sobre Nós) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-1/2 hidden h-[440px] w-[440px] -translate-y-1/2 lg:block"
          >
            <div
              className="absolute inset-0 rounded-full opacity-25 dark:opacity-35 blur-[80px]"
              style={{
                background:
                  'radial-gradient(circle, var(--brand-primary) 0%, transparent 68%)',
              }}
            />
            <div className="absolute inset-4 rounded-full border border-[var(--border-brand)]/25" />
            <div className="absolute inset-16 rounded-full border border-dashed border-[var(--brand-gold)]/25" />
          </div>

          <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                Sobre nós
              </p>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl leading-[1.08]">
                De Feira de Santana para 12 polos no interior da Bahia.
              </h1>
              <p className="mt-5 max-w-2xl text-sm sm:text-[15px] leading-relaxed text-[var(--text-secondary)]">
                A Lume Educação nasceu com o propósito de tornar a preparação para o ENEM acessível, contínua e adaptada à realidade das escolas públicas do interior, unindo tecnologia leve e tutoria local.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {CONTEXT_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)]"
                >
                  <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--brand-primary)]">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="border-b border-[var(--border-subtle)] py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              Como atuamos
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-[32px] font-bold tracking-tight text-[var(--text-primary)]">
              Três pilares que sustentam o aprendizado
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-[var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {pillar.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              A equipe
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-[32px] font-bold tracking-tight text-[var(--text-primary)]">
              Quem constrói a Lume Educação
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {LUME_TEAM.map((member) => (
                <article
                  key={member.name}
                  className="flex flex-col items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-7 text-center shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-brand)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-brand)]/40 bg-[var(--brand-primary-soft)] font-[var(--font-display)] text-base font-bold text-[var(--brand-primary)]">
                    {member.initials}
                  </div>
                  <h3 className="mt-4 font-[var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {member.role}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
