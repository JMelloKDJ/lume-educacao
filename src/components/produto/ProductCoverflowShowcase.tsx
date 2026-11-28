'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Monitor,
  Smartphone,
  Users,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { PRODUCT_SLIDES, type ProductSlide } from '@/data/mock-project';
import { PRODUCT_SLIDE_META } from '@/data/round5Data';
import { cn } from '@/lib/utils';

type PrototypeDevice = 'web' | 'android';

interface PrototypeFrameCardProps {
  slide: ProductSlide;
  theme: 'dark' | 'light';
  deviceMode: PrototypeDevice;
}

function PrototypeIframeStage({
  slide,
  theme,
  deviceMode,
}: PrototypeFrameCardProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialThemeRef = useRef(theme);
  const initialDeviceRef = useRef(deviceMode);
  const [loaded, setLoaded] = useState(false);

  const initialSrc = `/prototipo/index.html?screen=${encodeURIComponent(
    slide.code
  )}&pure=1&embed=1&theme=${encodeURIComponent(
    initialThemeRef.current
  )}&device=${encodeURIComponent(initialDeviceRef.current)}`;

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !loaded) return;
    win.postMessage(
      {
        type: 'lume-proto-sync',
        theme,
        device: deviceMode,
        screen: slide.code,
      },
      '*'
    );
  }, [theme, deviceMode, slide.code, loaded]);

  return (
    <div
      className="relative h-full w-full bg-[var(--bg-canvas)]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[var(--bg-surface)]/85 backdrop-blur-xs">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
          <p className="font-mono text-[11px] text-[var(--text-muted)]">
            Carregando protótipo {slide.code}…
          </p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={initialSrc}
        title={`Protótipo navegável Lume · ${slide.title}`}
        onLoad={() => setLoaded(true)}
        className="h-full w-full border-0 bg-transparent"
      />
    </div>
  );
}

function SideSlidePreview({ slide }: { slide: ProductSlide }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-[var(--bg-canvas)] p-6">
      <div className="space-y-2">
        <span className="inline-flex rounded-md bg-[var(--brand-primary-soft)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--brand-primary)]">
          {slide.code}
        </span>
        <h3 className="font-[var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
          {slide.shortTitle}
        </h3>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {slide.description}
        </p>
      </div>

      <ul className="space-y-2.5">
        {slide.highlights.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]"
          >
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
        <span className="text-[11px] text-[var(--text-muted)]">
          {slide.metricLabel}
        </span>
        <span className="font-mono text-sm font-bold text-[var(--brand-primary)] tabular-nums">
          {slide.metricValue}
        </span>
      </div>
    </div>
  );
}

export interface ProductCoverflowShowcaseProps {
  slides?: ProductSlide[];
  showContextBlock?: boolean;
  className?: string;
}

export function ProductCoverflowShowcase({
  slides = PRODUCT_SLIDES,
  showContextBlock = true,
  className,
}: ProductCoverflowShowcaseProps) {
  const { theme } = useTheme();
  const total = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [deviceMode, setDeviceMode] = useState<PrototypeDevice>('web');
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

  const fullProtoHref = `/prototipo/index.html?screen=${encodeURIComponent(
    activeSlide.code
  )}&theme=${encodeURIComponent(theme)}&device=${encodeURIComponent(
    deviceMode
  )}`;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. Carrossel 3D Horizontal Coverflow com protótipo R12 real no card central */}
      <section
        aria-label="Vitrine 3D interativa do protótipo Lume Educação"
        className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 pt-4 pb-5 sm:px-5 shadow-[var(--shadow-card)]"
      >
        {/* Top compact header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--brand-primary)]">
              {activeSlide.code}
            </span>
            <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              {activeSlide.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Web / Mobile switch */}
            <div
              role="group"
              aria-label="Formato do protótipo"
              className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5 text-[11px]"
            >
              <button
                type="button"
                onClick={() => setDeviceMode('web')}
                aria-pressed={deviceMode === 'web'}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer',
                  deviceMode === 'web'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Monitor className="h-3 w-3" />
                <span>Web</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('android')}
                aria-pressed={deviceMode === 'android'}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer',
                  deviceMode === 'android'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Smartphone className="h-3 w-3" />
                <span>Android</span>
              </button>
            </div>

            <a
              href={fullProtoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--text-primary)]"
            >
              <span>Abrir completo (15 telas)</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <span className="hidden sm:inline font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
              {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(total).padStart(2, '0')}
            </span>
          </div>
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
          className="relative mt-3 flex h-[480px] sm:h-[550px] lg:h-[600px] xl:h-[620px] w-full items-center justify-center overflow-hidden select-none touch-pan-y"
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
            className="absolute top-1/2 left-2 sm:left-4 z-40 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 text-[var(--text-primary)] shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 cursor-pointer"
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
            className="absolute top-1/2 right-2 sm:right-4 z-40 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 text-[var(--text-primary)] shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 cursor-pointer"
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
                  role={isCenter ? undefined : 'button'}
                  tabIndex={isVisible && !isCenter ? 0 : -1}
                  aria-label={`${slide.code} ${slide.shortTitle}`}
                  aria-current={isCenter ? 'true' : undefined}
                  onClick={() => {
                    if (isDraggingRef.current) return;
                    if (!isCenter) setActiveIndex(idx);
                  }}
                  onKeyDown={(e) => {
                    if (!isCenter && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setActiveIndex(idx);
                    }
                  }}
                  className={cn(
                    'absolute w-[92%] sm:w-[86%] lg:w-[760px] xl:w-[820px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
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
                  {/* Device Frame */}
                  <div
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-[var(--bg-surface)] transition-shadow duration-500',
                      isCenter
                        ? 'border-[var(--border-brand)] shadow-[0_28px_70px_-18px_rgba(124,92,252,0.30)]'
                        : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)]'
                    )}
                  >
                    {/* App Window Top Chrome */}
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-critical)]/65" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-gold)]/75" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-positive)]/70" />
                      </div>
                      <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                        {slide.code} · {slide.shortTitle}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        Protótipo R12
                      </span>
                    </div>

                    {/* Enlarged Mockup Viewport */}
                    <div className="h-[395px] sm:h-[465px] lg:h-[515px] xl:h-[535px] w-full">
                      {isCenter ? (
                        <PrototypeIframeStage
                          slide={slide}
                          theme={theme}
                          deviceMode={deviceMode}
                        />
                      ) : (
                        <SideSlidePreview slide={slide} />
                      )}
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
      {showContextBlock && (
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
      )}
    </div>
  );
}
