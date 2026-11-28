'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  FileCheck2,
  Layers,
  Play,
  School,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import type { ProductSlide } from '../../data/mock-project';
import { cn } from '../../lib/utils';

export interface MockupCarouselProps {
  slides: ProductSlide[];
  className?: string;
  /** Controlled active index (optional, used when header controls sit outside the card) */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  /** 'workspace' renders interactive UI preview & internal header; 'landing' matches the Figma Landing Page slot card */
  variant?: 'workspace' | 'landing';
}

function LandingSlotStage({ slide }: { slide: ProductSlide }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (slide.image && !imgFailed) {
    return (
      <img
        src={slide.image}
        alt={slide.title}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-[var(--bg-canvas)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
        <Layers className="h-5 w-5" />
      </div>
      <p className="mt-4 font-mono text-xs sm:text-[13px] font-medium text-[var(--text-primary)]">
        [SLOT PRINT 16:10 · {slide.code} {slide.shortTitle}]
      </p>
      <p className="mt-1.5 max-w-sm text-xs text-[var(--text-muted)]">
        Substitua o preenchimento deste frame pelo print de alta resolução
      </p>
    </div>
  );
}

function WorkspaceSlidePreview({ slide }: { slide: ProductSlide }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (slide.image && !imgFailed) {
    return (
      <img
        src={slide.image}
        alt={slide.title}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-between p-5 sm:p-6 bg-[var(--bg-canvas)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] font-mono text-[11px] font-bold text-[var(--brand-primary)] shrink-0">
            {slide.code}
          </span>
          <div className="min-w-0">
            <p className="truncate font-[var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
              {slide.shortTitle}
            </p>
            <p className="truncate text-[11px] text-[var(--text-muted)]">
              {slide.shortSubtitle}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[var(--text-muted)]">{slide.metricLabel}</p>
          <p className="font-mono text-sm font-bold text-[var(--brand-primary)] tabular-nums">
            {slide.metricValue}
          </p>
        </div>
      </div>

      <div className="relative z-10 my-4 flex-1 flex items-center">
        {slide.code === 'T02' && (
          <div className="w-full space-y-2.5">
            {[
              { day: 'Seg', subject: 'Matemática · Funções e Gráficos', pct: 100, done: true },
              { day: 'Ter', subject: 'Linguagens · Interpretação ENEM', pct: 100, done: true },
              { day: 'Qua', subject: 'Ciências da Natureza · Ecologia', pct: 74, done: false },
              { day: 'Qui', subject: 'Redação · Proposta de Intervenção', pct: 40, done: false },
            ].map((row) => (
              <div
                key={row.day}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5"
              >
                <span className="w-8 font-mono text-[11px] font-semibold text-[var(--text-muted)]">
                  {row.day}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {row.subject}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                      {row.pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${row.pct}%`,
                        backgroundColor: row.done ? 'var(--status-positive)' : 'var(--brand-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {slide.code === 'T04' && (
          <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                <WifiOff className="h-4 w-4 text-[var(--brand-gold)]" />
                <span>Pacote Offline · Aula 08 (16,4 MB)</span>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--status-positive)]">
                <Download className="h-3.5 w-3.5" /> Salvo
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-xl bg-[var(--bg-elevated)] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shrink-0">
                <Play className="h-4 w-4 ml-0.5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                  Física · Termodinâmica aplicada ao cotidiano
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-[var(--brand-primary)]" />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[var(--text-muted)] tabular-nums">
                  <span>12:40</span>
                  <span>19:15</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {slide.code === 'T06' && (
          <div className="grid w-full grid-cols-2 gap-3">
            {[
              { area: 'Matemática', score: '742', delta: '+48 pts' },
              { area: 'Linguagens', score: '688', delta: '+31 pts' },
              { area: 'Humanas', score: '715', delta: '+26 pts' },
              { area: 'Natureza', score: '664', delta: '+39 pts' },
            ].map((item) => (
              <div
                key={item.area}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{item.area}</span>
                  <span className="font-mono text-[11px] text-[var(--status-positive)] tabular-nums">
                    {item.delta}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-mono text-xl font-bold text-[var(--text-primary)] tabular-nums">
                    {item.score}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">TRI</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {slide.code === 'T07' && (
          <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <FileCheck2 className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Correção por Competência</span>
              </div>
              <span className="font-mono text-sm font-bold text-[var(--brand-gold)] tabular-nums">
                920 / 1000
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { c: 'C1', v: 180 },
                { c: 'C2', v: 200 },
                { c: 'C3', v: 180 },
                { c: 'C4', v: 180 },
                { c: 'C5', v: 180 },
              ].map((comp) => (
                <div
                  key={comp.c}
                  className="rounded-lg bg-[var(--bg-elevated)] p-2.5 text-center"
                >
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">{comp.c}</p>
                  <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                    {comp.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.code === 'T09' && (
          <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Tutor Lume IA · Resolução Guiada</span>
              </div>
              <span className="font-mono text-[10px] text-[var(--status-positive)]">
                Passo 2 de 3
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-[var(--text-secondary)]">
                Como montar a equação da função afim usando os dois pontos do gráfico?
              </div>
              <div className="rounded-lg border border-[var(--border-brand)]/45 bg-[var(--brand-primary-soft)]/50 px-3 py-2 text-[var(--text-primary)]">
                Primeiro encontramos a taxa de variação <span className="font-mono">a = Δy / Δx</span>. Com (2, 10) e (6, 22), temos <span className="font-mono font-semibold">a = 3</span>.
              </div>
            </div>
          </div>
        )}

        {slide.code === 'T10' && (
          <div className="w-full space-y-2.5">
            {[
              { polo: 'Regional Cariri · 28 escolas', eng: '89,4%', status: 'Meta superada' },
              { polo: 'Vale do São Francisco · 34 escolas', eng: '82,1%', status: 'No ritmo' },
              { polo: 'Sertão Central · 22 escolas', eng: '74,8%', status: 'Reforço ativo' },
            ].map((row) => (
              <div
                key={row.polo}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <School className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                  <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {row.polo}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                    {row.status}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--status-positive)] tabular-nums">
                    {row.eng}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" />
          <span className="truncate">{slide.highlights[0]}</span>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)] shrink-0">
          <Layers className="h-3 w-3" />
          16:10 · {slide.code} {slide.shortTitle}
        </span>
      </div>
    </div>
  );
}

export function MockupCarousel({
  slides,
  className,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  variant = 'workspace',
}: MockupCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const safeSlides = slides.length > 0 ? slides : [];
  const activeIndex = controlledIndex ?? internalIndex;
  const activeSlide = safeSlides[activeIndex];

  if (!activeSlide) return null;

  const setIndex = (nextIdx: number) => {
    const wrapped = (nextIdx + safeSlides.length) % safeSlides.length;
    setDirection(wrapped >= activeIndex ? 1 : -1);
    if (onActiveIndexChange) {
      onActiveIndexChange(wrapped);
    } else {
      setInternalIndex(wrapped);
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    const wrapped = (activeIndex - 1 + safeSlides.length) % safeSlides.length;
    if (onActiveIndexChange) onActiveIndexChange(wrapped);
    else setInternalIndex(wrapped);
  };

  const handleNext = () => {
    setDirection(1);
    const wrapped = (activeIndex + 1) % safeSlides.length;
    if (onActiveIndexChange) onActiveIndexChange(wrapped);
    else setInternalIndex(wrapped);
  };

  return (
    <section
      aria-label="Carrossel de telas do produto"
      className={cn(
        'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)] overflow-hidden',
        className
      )}
    >
      {/* Internal header only shown in Workspace mode; Landing Page renders section controls above the card */}
      {variant === 'workspace' && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
              {activeSlide.title}
            </h3>
            <p className="mt-1 text-xs sm:text-[13px] text-[var(--text-secondary)]">
              {activeSlide.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Tela anterior"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próxima tela"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 12-column grid with min-w-0 overflow-hidden to prevent any overlap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: 7 columns — 16:10 dashed stage */}
        <div className="min-w-0 overflow-hidden lg:col-span-7 flex flex-col">
          <div className="relative w-full overflow-hidden rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] aspect-[16/10] lg:flex-1 lg:aspect-auto lg:min-h-[360px]">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={activeSlide.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -18 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full"
              >
                {variant === 'landing' ? (
                  <LandingSlotStage slide={activeSlide} />
                ) : (
                  <WorkspaceSlidePreview slide={activeSlide} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: 5 columns — vertical selector list with visible badges */}
        <div
          className="min-w-0 overflow-hidden lg:col-span-5 flex flex-col justify-between gap-2.5"
          role="tablist"
          aria-label="Telas disponíveis"
        >
          {safeSlides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setIndex(idx)}
                className={cn(
                  'group flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40',
                  isActive
                    ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/55 dark:bg-[var(--bg-elevated)] shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-10 items-center justify-center rounded-lg font-mono text-[11px] font-semibold transition-colors shrink-0',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                  )}
                >
                  {slide.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-xs sm:text-[13px] font-semibold transition-colors',
                      isActive
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                    )}
                  >
                    {slide.shortTitle}
                  </p>
                  <p className="truncate text-[11px] text-[var(--text-muted)] mt-0.5">
                    {slide.shortSubtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer of card */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-1">
        {variant === 'landing' ? (
          <>
            <div className="flex items-center gap-1.5">
              {safeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Ir para ${slide.shortTitle}`}
                  onClick={() => setIndex(idx)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                    idx === activeIndex
                      ? 'w-5 bg-[var(--brand-primary)]'
                      : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                  )}
                />
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Fluxo completo do produto mapeado nas telas T00 a T14
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')} / {String(safeSlides.length).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {safeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Ir para ${slide.shortTitle}`}
                  onClick={() => setIndex(idx)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                    idx === activeIndex
                      ? 'w-6 bg-[var(--brand-primary)]'
                      : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
