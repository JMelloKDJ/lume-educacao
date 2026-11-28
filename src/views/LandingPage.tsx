'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { ProductCoverflowShowcase } from '../components/produto/ProductCoverflowShowcase';
import { PublicFooter } from '../components/public/public-footer';
import { PublicNavbar, type AppScreen } from '../components/public/public-navbar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { PUBLIC_FAQ_ITEMS } from '../data/mock-project';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onNavigate: (screen: AppScreen) => void;
  onOpenLumi: () => void;
}

type PlanInquiryMode = 'completo' | 'escolas' | null;

export function LandingPage({ onNavigate, onOpenLumi }: LandingPageProps) {
  const [openFaqId, setOpenFaqId] = useState<string>(PUBLIC_FAQ_ITEMS[0].id);
  const [inquiryMode, setInquiryMode] = useState<PlanInquiryMode>(null);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadOrg, setLeadOrg] = useState('');
  const [leadError, setLeadError] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const openInquiry = (mode: Exclude<PlanInquiryMode, null>) => {
    setInquiryMode(mode);
    setLeadError('');
    setLeadSubmitted(false);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.includes('@')) {
      setLeadError('Informe seu nome e um e-mail válido para continuar.');
      return;
    }
    setLeadError('');
    setLeadSubmitted(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <PublicNavbar currentScreen="landing" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
          {/* Subtle ambient brand glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 right-1/4 h-[420px] w-[520px] rounded-full opacity-20 dark:opacity-30 blur-[110px]"
            style={{
              background:
                'radial-gradient(circle, var(--brand-primary) 0%, transparent 70%)',
            }}
          />

          <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_1fr] lg:px-8 lg:py-24">
            {/* Hero Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-brand)]/45 bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-[var(--brand-gold)]"
                />
                <span>Ensino Híbrido · Interior da Bahia</span>
              </div>

              <h1 className="mt-6 font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[52px] leading-[1.08]">
                Preparação para o ENEM pensada para quem estuda no interior.
              </h1>

              <p className="mt-5 max-w-lg text-sm sm:text-[15px] leading-relaxed text-[var(--text-secondary)]">
                A Lume Educação combina trilhas adaptativas, aulas compactadas para redes instáveis e acompanhamento próximo das escolas parceiras.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => scrollToSection('produto')}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 whitespace-nowrap cursor-pointer"
                >
                  <span>Explorar plataforma</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('planos')}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 whitespace-nowrap cursor-pointer"
                >
                  Conhecer modalidades
                </button>
              </div>
            </div>

            {/* Hero Preview Card matching Figma Landing Page */}
            <div className="relative">
              <div className="rounded-2xl border border-[var(--border-brand)]/45 bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                    Trilha do Estudante · Semana 12
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-positive-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--status-positive)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-positive)]" />
                    Modo Offline ativo
                  </span>
                </div>

                {/* 3 Compact Metrics */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                    <p className="text-[11px] text-[var(--text-muted)]">Meta Semanal</p>
                    <p className="mt-1.5 font-mono text-base font-bold text-[var(--brand-primary)] tabular-nums">
                      14 / 16 aulas
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                    <p className="text-[11px] text-[var(--text-muted)]">Simulado TRI</p>
                    <p className="mt-1.5 font-mono text-base font-bold text-[var(--brand-gold)] tabular-nums">
                      728 pts
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                    <p className="text-[11px] text-[var(--text-muted)]">Redações</p>
                    <p className="mt-1.5 font-mono text-base font-bold text-[var(--status-positive)] tabular-nums">
                      3 corrigidas
                    </p>
                  </div>
                </div>

                {/* Domain Mastery Bars */}
                <div className="mt-4 space-y-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                  {[
                    { label: 'Matemática e suas Tecnologias', value: 82 },
                    { label: 'Ciências da Natureza', value: 68 },
                    { label: 'Linguagens e Redação', value: 91 },
                  ].map((area) => (
                    <div key={area.label}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-[var(--text-secondary)]">
                          {area.label}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)] tabular-nums">
                          {area.value}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500"
                          style={{ width: `${area.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NA PRÁTICA / O PRODUTO SECTION — idêntica à aba Produto com o protótipo navegável R12 */}
        <section
          id="produto"
          className="scroll-mt-20 border-b border-[var(--border-subtle)] py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                Na prática · Protótipo Navegável
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-[32px] font-bold tracking-tight text-[var(--text-primary)]">
                Uma plataforma desenhada para estudo contínuo
              </h2>
            </div>

            <ProductCoverflowShowcase />
          </div>
        </section>

        {/* PLANOS SECTION */}
        <section
          id="planos"
          className="scroll-mt-20 border-b border-[var(--border-subtle)] py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                Modalidades & Acesso
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-[32px] font-bold tracking-tight text-[var(--text-primary)]">
                Escolha o formato ideal para sua jornada
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
              {/* Plan 1: Lume Aberto */}
              <article className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-card)]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                      Lume Aberto
                    </h3>
                    <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-muted)]">
                      ACESSO GRATUITO
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                      Gratuito
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">sem custo</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Para começar sua rotina de estudos hoje
                  </p>

                  <ul className="mt-6 space-y-3 border-t border-[var(--border-subtle)] pt-6 text-xs sm:text-[13px] text-[var(--text-secondary)]">
                    {[
                      'Aulas essenciais em modo leve',
                      'Banco inicial de questões ENEM',
                      'Resumo semanal de progresso',
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-positive)]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-brand)] hover:bg-[var(--brand-primary-soft)] cursor-pointer"
                >
                  Criar conta gratuita
                </button>
              </article>

              {/* Plan 2: Lume Completo (Destaque central) */}
              <article className="relative flex flex-col justify-between rounded-2xl border-2 border-[var(--brand-primary)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-lumi)]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                      Lume Completo
                    </h3>
                    <span className="rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--brand-primary)]">
                      MAIS POPULAR
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-extrabold tracking-tight text-[var(--brand-primary)] tabular-nums">
                      R$ 24,90
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">/mês</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Preparação completa otimizada para 3G e offline
                  </p>

                  <ul className="mt-6 space-y-3 border-t border-[var(--border-subtle)] pt-6 text-xs sm:text-[13px] text-[var(--text-secondary)]">
                    {[
                      'Trilha adaptativa por área do ENEM',
                      'Player offline compactado',
                      'Simulados com cálculo TRI',
                      'Correção guiada de redação',
                      'Acesso ilimitado ao Tutor Lume IA',
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-positive)]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openInquiry('completo')}
                  className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--brand-primary)] text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] cursor-pointer"
                >
                  Assinar Lume Completo
                </button>
              </article>

              {/* Plan 3: Polos & Escolas */}
              <article className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-card)]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                      Polos & Escolas
                    </h3>
                    <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-muted)]">
                      INSTITUCIONAL
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                      Sob medida
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">por rede</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Implantação híbrida para municípios e escolas
                  </p>

                  <ul className="mt-6 space-y-3 border-t border-[var(--border-subtle)] pt-6 text-xs sm:text-[13px] text-[var(--text-secondary)]">
                    {[
                      'Painel completo da coordenação',
                      'Gestão de turmas e polos locais',
                      'Metas e frequência em tempo real',
                      'Formação de tutores presenciais',
                    ].map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-positive)]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openInquiry('escolas')}
                  className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-brand)] hover:bg-[var(--brand-primary-soft)] cursor-pointer"
                >
                  Solicitar proposta
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
            {/* Left Intro + Support Card */}
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                Tira-dúvidas
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl sm:text-[32px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                Perguntas frequentes sobre a Lume
              </h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                Entenda como o modo offline, os simulados e as parcerias escolares funcionam no dia a dia.
              </p>

              <div className="mt-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Fale com o time da Lume
                  </p>
                </div>
                <p className="mt-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Precisa implantar em um polo regional ou tirar dúvidas de acesso?
                </p>
                <button
                  type="button"
                  onClick={onOpenLumi}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer"
                >
                  <span>Abrir atendimento</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Smooth Accordion */}
            <div className="space-y-3">
              {PUBLIC_FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-[var(--bg-surface)] transition-colors',
                      isOpen
                        ? 'border-[var(--border-brand)]'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand-primary)]/40"
                    >
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform duration-200',
                          isOpen
                            ? 'rotate-180 text-[var(--brand-primary)]'
                            : 'text-[var(--text-muted)]'
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 text-xs sm:text-[13px] leading-relaxed text-[var(--text-secondary)]">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter onNavigate={onNavigate} />

      {/* Interactive Plan / Institutional Proposal Dialog */}
      <Dialog
        open={inquiryMode !== null}
        onOpenChange={(open) => {
          if (!open) setInquiryMode(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {inquiryMode === 'completo'
                ? 'Ativar Lume Completo'
                : 'Solicitar proposta para Polos & Escolas'}
            </DialogTitle>
            <DialogDescription>
              {inquiryMode === 'completo'
                ? 'Preencha seus dados para liberar a trilha completa de R$ 24,90/mês com modo offline.'
                : 'Conte um pouco sobre sua escola ou município para receber o plano de implantação.'}
            </DialogDescription>
          </DialogHeader>

          {leadSubmitted ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-[var(--status-positive-soft)] p-4 text-xs text-[var(--status-positive)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Solicitação registrada com sucesso</p>
                  <p className="mt-1 text-[var(--text-secondary)]">
                    Enviamos os próximos passos para <span className="font-mono">{leadEmail}</span>.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInquiryMode(null)}
                  className="inline-flex h-9 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInquiryMode(null);
                    onNavigate('login');
                  }}
                  className="inline-flex h-9 items-center rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white cursor-pointer"
                >
                  Ir para o acesso
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  E-mail
                </label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="voce@escola.ba.gov.br"
                  className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                />
              </div>

              {inquiryMode === 'escolas' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Município ou rede escolar
                  </label>
                  <input
                    type="text"
                    value={leadOrg}
                    onChange={(e) => setLeadOrg(e.target.value)}
                    placeholder="Ex.: Secretaria Municipal de Feira de Santana"
                    className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
                  />
                </div>
              )}

              {leadError && (
                <p className="text-xs font-medium text-[var(--status-critical)]">{leadError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryMode(null)}
                  className="inline-flex h-9 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)] cursor-pointer"
                >
                  Enviar solicitação
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
