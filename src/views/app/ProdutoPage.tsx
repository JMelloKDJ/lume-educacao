'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  FileCheck2,
  Headphones,
  Pause,
  Play,
  School,
  Sparkles,
  Users,
  WifiOff,
} from 'lucide-react';
import { KpiCard } from '../../components/ui/kpi-card';
import { PRODUCT_SLIDES, type ProductSlide } from '../../data/mock-project';
import { PRODUCT_SLIDE_META } from '../../data/round5Data';
import { cn } from '../../lib/utils';

const T02_INITIAL_ITEMS = [
  {
    day: 'Seg',
    subject: 'Matemática · Funções e Gráficos',
    duration: '25 min',
    done: true,
  },
  {
    day: 'Ter',
    subject: 'Linguagens · Interpretação ENEM',
    duration: '20 min',
    done: true,
  },
  {
    day: 'Qua',
    subject: 'Ciências da Natureza · Ecologia & Energia',
    duration: '25 min',
    done: false,
  },
  {
    day: 'Qui',
    subject: 'Redação · Proposta de Intervenção',
    duration: '30 min',
    done: false,
  },
];

const T06_AREAS = [
  {
    area: 'Matemática',
    score: '742',
    delta: '+48 pts',
    detail: '88% de coerência TRI em funções e geometria espacial.',
  },
  {
    area: 'Linguagens',
    score: '688',
    delta: '+31 pts',
    detail: 'Evolução consistente em leitura crítica e gêneros textuais.',
  },
  {
    area: 'Humanas',
    score: '715',
    delta: '+26 pts',
    detail: 'Alto desempenho em geografia agrária e história do Brasil.',
  },
  {
    area: 'Natureza',
    score: '664',
    delta: '+39 pts',
    detail: 'Recomendação automática: reforçar eletrodinâmica no ciclo C15.',
  },
];

const T07_COMPETENCIES = [
  {
    c: 'C1',
    v: 180,
    note: 'Domínio sólido da norma culta; apenas 1 desvio de vírgula no 2º parágrafo.',
  },
  {
    c: 'C2',
    v: 200,
    note: 'Repertório sociocultural pertinente e produtivo articulado ao tema.',
  },
  {
    c: 'C3',
    v: 180,
    note: 'Argumentação consistente; aprofundar causa-consequência no D2.',
  },
  {
    c: 'C4',
    v: 180,
    note: 'Boa coesão interparágrafos com conectivos variados.',
  },
  {
    c: 'C5',
    v: 180,
    note: 'Proposta completa com agente, ação, meio e finalidade claros.',
  },
];

const T09_STEPS = [
  {
    step: 'Passo 1',
    text: 'Identifique os dois pontos do gráfico: P1 = (2, 10) e P2 = (6, 22).',
  },
  {
    step: 'Passo 2',
    text: 'Calcule o coeficiente angular a = (22 − 10) / (6 − 2) = 12 / 4 = 3.',
  },
  {
    step: 'Passo 3',
    text: 'Substitua em y = ax + b: 10 = 3(2) + b → b = 4. Logo f(x) = 3x + 4.',
  },
];

const T10_POLOS = [
  {
    polo: 'Feira de Santana',
    schools: '38 escolas',
    eng: '89,4%',
    status: 'Meta superada',
    students: '6.120 alunos ativos',
  },
  {
    polo: 'Vale do São Francisco',
    schools: '34 escolas',
    eng: '82,1%',
    status: 'No ritmo',
    students: '5.480 alunos ativos',
  },
  {
    polo: 'Oeste Baiano',
    schools: '28 escolas',
    eng: '74,8%',
    status: 'Reforço ativo',
    students: '4.190 alunos ativos',
  },
];

function InteractiveCoverflowScreen({
  slide,
  isCenter,
}: {
  slide: ProductSlide;
  isCenter: boolean;
}) {
  // Interactive local states for active mockup exploration
  const [t02Done, setT02Done] = useState<boolean[]>(() =>
    T02_INITIAL_ITEMS.map((i) => i.done)
  );
  const [t04Playing, setT04Playing] = useState(false);
  const [t04AudioOnly, setT04AudioOnly] = useState(false);
  const [t06Selected, setT06Selected] = useState(0);
  const [t07Selected, setT07Selected] = useState(1);
  const [t09Step, setT09Step] = useState(1);
  const [t10Selected, setT10Selected] = useState(0);

  const t02Pct = Math.round(
    (t02Done.filter(Boolean).length / T02_INITIAL_ITEMS.length) * 100
  );

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-between bg-[var(--bg-canvas)] p-5 sm:p-6',
        !isCenter && 'pointer-events-none'
      )}
    >
      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Screen Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-8 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-mono text-xs font-bold text-white shadow-xs">
            {slide.code}
          </span>
          <div className="min-w-0">
            <p className="truncate font-[var(--font-display)] text-sm sm:text-base font-bold text-[var(--text-primary)]">
              {slide.shortTitle}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {slide.shortSubtitle}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-[var(--text-muted)]">
            {slide.metricLabel}
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-[var(--brand-primary)] tabular-nums">
            {slide.code === 'T02' ? `${t02Pct}%` : slide.metricValue}
          </p>
        </div>
      </div>

      {/* Interactive Mockup Body */}
      <div className="relative z-10 my-4 flex flex-1 items-center">
        {slide.code === 'T02' && (
          <div className="w-full space-y-2.5">
            {T02_INITIAL_ITEMS.map((row, idx) => {
              const checked = t02Done[idx];
              return (
                <button
                  key={row.day}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setT02Done((prev) =>
                      prev.map((v, i) => (i === idx ? !v : v))
                    );
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer',
                    checked
                      ? 'border-[var(--status-positive)]/35 bg-[var(--bg-surface)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-brand)]'
                  )}
                >
                  {checked ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--status-positive)]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  )}
                  <span className="w-8 font-mono text-xs font-semibold text-[var(--text-muted)]">
                    {row.day}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs sm:text-sm font-semibold',
                        checked
                          ? 'text-[var(--text-secondary)] line-through'
                          : 'text-[var(--text-primary)]'
                      )}
                    >
                      {row.subject}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
                    {row.duration}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {slide.code === 'T04' && (
          <div className="w-full space-y-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                <WifiOff className="h-4 w-4 text-[var(--brand-gold)]" />
                <span>
                  Pacote Offline · Aula 08 ({t04AudioOnly ? '4,2 MB' : '16,4 MB'})
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setT04AudioOnly((p) => !p);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer',
                  t04AudioOnly
                    ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Headphones className="h-3.5 w-3.5" />
                {t04AudioOnly ? 'Modo Áudio Ativo' : 'Ativar Somente Áudio'}
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-[var(--bg-elevated)] p-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setT04Playing((p) => !p);
                }}
                aria-label={t04Playing ? 'Pausar aula' : 'Reproduzir aula'}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-sm transition-transform hover:scale-105 cursor-pointer"
              >
                {t04Playing ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  Física · Termodinâmica aplicada ao cotidiano
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {t04Playing
                    ? 'Reproduzindo localmente sem consumo de 3G...'
                    : 'Pronto para estudo offline · Legenda PT-BR sincronizada'}
                </p>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"
                    style={{ width: t04Playing ? '78%' : '64%' }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                  <span>{t04Playing ? '14:55' : '12:40'}</span>
                  <span>19:15</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5 text-[var(--status-positive)] font-medium">
                <Download className="h-3.5 w-3.5" />
                Salvo na memória interna
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                Economia estimada: 72%
              </span>
            </div>
          </div>
        )}

        {slide.code === 'T06' && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {T06_AREAS.map((item, idx) => {
                const active = t06Selected === idx;
                return (
                  <button
                    key={item.area}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setT06Selected(idx);
                    }}
                    className={cn(
                      'rounded-xl border p-3.5 text-left transition-colors cursor-pointer',
                      active
                        ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/35'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-secondary)]">
                        {item.area}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[var(--status-positive)] tabular-nums">
                        {item.delta}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                        {item.score}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        TRI
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">
                {T06_AREAS[t06Selected].area}:
              </strong>{' '}
              {T06_AREAS[t06Selected].detail}
            </div>
          </div>
        )}

        {slide.code === 'T07' && (
          <div className="w-full space-y-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <FileCheck2 className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Correção por Competência</span>
              </div>
              <span className="font-mono text-base font-bold text-[var(--brand-gold)] tabular-nums">
                920 / 1000
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {T07_COMPETENCIES.map((comp, idx) => {
                const active = t07Selected === idx;
                return (
                  <button
                    key={comp.c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setT07Selected(idx);
                    }}
                    className={cn(
                      'rounded-xl border p-2.5 text-center transition-colors cursor-pointer',
                      active
                        ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                    )}
                  >
                    <p className="font-mono text-[11px] font-semibold text-[var(--text-muted)]">
                      {comp.c}
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
                      {comp.v}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              <span className="font-mono font-bold text-[var(--brand-primary)] mr-1.5">
                {T07_COMPETENCIES[t07Selected].c}:
              </span>
              {T07_COMPETENCIES[t07Selected].note}
            </div>
          </div>
        )}

        {slide.code === 'T09' && (
          <div className="w-full space-y-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Tutor Lume IA · Resolução Guiada</span>
              </div>
              <div className="flex items-center gap-1">
                {T09_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setT09Step(idx);
                    }}
                    className={cn(
                      'rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors cursor-pointer',
                      t09Step === idx
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {s.step}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-xs sm:text-sm text-[var(--text-secondary)]">
              Como montar a equação da função afim usando os dois pontos do
              gráfico?
            </div>
            <div className="rounded-xl border border-[var(--border-brand)]/45 bg-[var(--brand-primary-soft)]/45 px-4 py-3 text-xs sm:text-sm leading-relaxed text-[var(--text-primary)]">
              <span className="font-mono text-xs font-bold text-[var(--brand-primary)] mr-1.5">
                {T09_STEPS[t09Step].step}:
              </span>
              {T09_STEPS[t09Step].text}
            </div>
          </div>
        )}

        {slide.code === 'T10' && (
          <div className="w-full space-y-2.5">
            {T10_POLOS.map((row, idx) => {
              const active = t10Selected === idx;
              return (
                <button
                  key={row.polo}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setT10Selected(idx);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer',
                    active
                      ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/35'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <School className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                        {row.polo} · {row.schools}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {row.students} · {row.status}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-[var(--status-positive)] tabular-nums">
                    {row.eng}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Screen Footer */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" />
          <span className="truncate">{slide.highlights[0]}</span>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold text-[var(--brand-primary)]">
          Interativo · Clique nos itens
        </span>
      </div>
    </div>
  );
}

export function ProdutoPage() {
  const slides = PRODUCT_SLIDES;
  const total = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = e.clientX;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    if (Math.abs(e.clientX - dragStartXRef.current) > 16) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    if (Math.abs(deltaX) >= 52) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
    window.setTimeout(() => {
      isDraggingRef.current = false;
    }, 30);
  };

  const activeSlide = slides[activeIndex];
  const activeMeta = PRODUCT_SLIDE_META[activeSlide.code];

  const getCircularOffset = (idx: number): number => {
    let diff = idx - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  return (
    <div className="space-y-4">
      {/* 1. Carrossel 3D Horizontal Coverflow ampliado com setas nas laterais */}
      <section
        aria-label="Vitrine 3D das telas do produto Lume Educação"
        className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 pt-4 pb-5 sm:px-5 shadow-[var(--shadow-card)]"
      >
        {/* Minimal compact top header (arrows moved to stage flanks!) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--brand-primary)] uppercase">
              {activeSlide.code}
            </span>
            <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              {activeSlide.title}
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(total).padStart(2, '0')} · Use ← / → ou arraste
          </span>
        </div>

        {/* Enlarged 3D Coverflow Stage with Lateral Arrows */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStartXRef.current = null;
            isDraggingRef.current = false;
          }}
          className="relative mt-3 flex h-[430px] sm:h-[490px] lg:min-h-[530px] xl:min-h-[550px] w-full items-center justify-center overflow-hidden select-none touch-pan-y"
          style={{ perspective: '1450px' }}
        >
          {/* Left Flank Navigation Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Tela anterior"
            className="absolute top-1/2 left-2 sm:left-4 z-40 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 text-[var(--text-primary)] shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Right Flank Navigation Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Próxima tela"
            className="absolute top-1/2 right-2 sm:right-4 z-40 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 text-[var(--text-primary)] shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 cursor-pointer"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Subtle ambient stage glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 left-1/2 h-28 w-[68%] -translate-x-1/2 rounded-full bg-[var(--brand-primary)]/12 blur-3xl"
          />

          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {slides.map((slide, idx) => {
              const offset = getCircularOffset(idx);
              const absOffset = Math.abs(offset);
              const isCenter = offset === 0;
              const isVisible = absOffset <= 2;

              let transform = 'translateX(0%) translateZ(-320px) scale(0.58)';
              let opacity = 0;
              let zIndex = 0;

              if (offset === 0) {
                transform =
                  'translateX(0%) translateZ(42px) rotateY(0deg) scale(1)';
                opacity = 1;
                zIndex = 30;
              } else if (offset === -1) {
                transform =
                  'translateX(-50%) translateZ(-125px) rotateY(26deg) scale(0.83)';
                opacity = 0.65;
                zIndex = 20;
              } else if (offset === 1) {
                transform =
                  'translateX(50%) translateZ(-125px) rotateY(-26deg) scale(0.83)';
                opacity = 0.65;
                zIndex = 20;
              } else if (offset === -2) {
                transform =
                  'translateX(-86%) translateZ(-240px) rotateY(38deg) scale(0.68)';
                opacity = 0.28;
                zIndex = 10;
              } else if (offset === 2) {
                transform =
                  'translateX(86%) translateZ(-240px) rotateY(-38deg) scale(0.68)';
                opacity = 0.28;
                zIndex = 10;
              }

              return (
                <div
                  key={slide.id}
                  role="button"
                  tabIndex={isVisible ? 0 : -1}
                  aria-label={`${slide.code} ${slide.shortTitle}`}
                  aria-current={isCenter ? 'true' : undefined}
                  onClick={() => {
                    if (isDraggingRef.current) return;
                    if (!isCenter) setActiveIndex(idx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIndex(idx);
                    }
                  }}
                  className={cn(
                    'absolute w-[90%] sm:w-[82%] lg:w-[700px] xl:w-[740px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    isCenter ? 'cursor-default' : 'cursor-pointer',
                    !isVisible && 'pointer-events-none'
                  )}
                  style={{
                    transform,
                    opacity,
                    zIndex,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Realistic Device Frame */}
                  <div
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-[var(--bg-surface)] transition-shadow duration-500',
                      isCenter
                        ? 'border-[var(--border-brand)] shadow-[0_28px_70px_-18px_rgba(124,92,252,0.30)]'
                        : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)]'
                    )}
                  >
                    {/* App Window Top Chrome */}
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-critical)]/65" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-gold)]/75" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-positive)]/70" />
                      </div>
                      <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                        {slide.code} · {slide.shortTitle}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        Lume App
                      </span>
                    </div>

                    {/* Enlarged Mockup Viewport */}
                    <div className="h-[345px] sm:h-[395px] lg:h-[435px] xl:h-[455px] w-full">
                      <InteractiveCoverflowScreen
                        slide={slide}
                        isCenter={isCenter}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Compact Screen Pills */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Selecionar tela ${slide.code} ${slide.shortTitle}`}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] transition-all cursor-pointer',
                  isActive
                    ? 'border-[var(--border-brand)] bg-[var(--brand-primary)] font-bold text-white shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                )}
              >
                <span>{slide.code}</span>
                <span className="hidden sm:inline font-sans text-[11px] font-medium">
                  {slide.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Bloco compacto de contexto da tela ativa */}
      <section
        aria-label="Contexto da tela selecionada"
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[var(--brand-primary)]">
              {activeSlide.code} · {activeSlide.shortTitle}
            </span>
            {activeMeta?.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
            {activeSlide.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2">
            <p className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Users className="h-3 w-3 text-[var(--brand-primary)]" />
              Público
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
              {activeMeta?.audience ?? 'Estudantes e escolas'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2">
            <p className="text-[10px] text-[var(--text-muted)]">
              {activeMeta?.usageLabel ?? activeSlide.metricLabel}
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-[var(--brand-primary)] tabular-nums">
              {activeMeta?.usageValue ?? activeSlide.metricValue}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Os 3 KPIs compactos do Produto */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Telas Homologadas"
          value="06 fluxos"
          badgeText="Pronto"
          badgeTone="positive"
          insight="Jornada completa do estudante e da escola"
        />
        <KpiCard
          title="Consumo Médio Offline"
          value="16,4 MB"
          badgeText="-72% dados"
          badgeTone="neutral"
          insight="Compatível com redes 3G no interior"
        />
        <KpiCard
          title="Nota Média de Satisfação"
          value="4,8 / 5,0"
          badgeText="18,4 mil alunos"
          badgeTone="gold"
          insight="Avaliação direta nas turmas piloto"
        />
      </div>
    </div>
  );
}
