'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Tag,
  X,
} from 'lucide-react';
import {
  IsometricStage3D,
  type IsometricStage3DHandle,
  type Map3DViewLevel,
  type SelectedAtomTarget,
} from '../../components/mapa3d/IsometricStage3D';
import { useTheme } from '../../components/theme-provider';
import {
  STATUS_META,
  TIMELINE_MONTHS,
  type BlockStatus,
  type StatusFilter,
} from '../../data/mapa3dData';
import { cn } from '../../lib/utils';
import { useLumeStore } from '../../services/lumeStore';

function getSelectedBadgeStyle(status: BlockStatus): string {
  switch (status) {
    case 'concluido':
      return 'border-[var(--status-positive)]/35 bg-[var(--status-positive-soft)] text-[var(--status-positive)]';
    case 'em_andamento':
      return 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]';
    case 'atencao':
      return 'border-[var(--brand-gold)]/35 bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]';
    case 'critico':
      return 'border-[var(--status-critical)]/35 bg-[var(--status-critical-soft)] text-[var(--status-critical)]';
  }
}

function getSeverityBadgeStyle(severity: 'baixo' | 'medio' | 'alto'): string {
  switch (severity) {
    case 'baixo':
      return 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]';
    case 'medio':
      return 'bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]';
    case 'alto':
      return 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]';
  }
}

export function Mapa3DPage() {
  const { theme } = useTheme();
  const stageRef = useRef<IsometricStage3DHandle | null>(null);

  const {
    mapa3dMonthIndex: monthIndex,
    mapa3dBlocks: blocks,
    mapa3dCounts: counts,
    mapa3dSelectedBlockId: selectedBlockId,
    toggledSubtasks,
    setMapa3DMonthIndex: setMonthIndex,
    setMapa3DSelectedBlockId: setSelectedBlockId,
    toggleBlockSubtask,
  } = useLumeStore();

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(false);
  const [viewLevel, setViewLevel] = useState<Map3DViewLevel>('macro');
  const [selectedAtom, setSelectedAtom] = useState<SelectedAtomTarget>({
    type: 'core',
    id: selectedBlockId,
  });

  const blocksById = useMemo(
    () => new Map(blocks.map((b) => [b.id, b])),
    [blocks]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchedIds = useMemo(() => {
    const set = new Set<string>();
    for (const block of blocks) {
      const matchesStatus =
        activeFilter === 'todos' || block.status === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        block.name.toLowerCase().includes(normalizedQuery) ||
        block.islandLabel.toLowerCase().includes(normalizedQuery) ||
        block.owner.toLowerCase().includes(normalizedQuery) ||
        block.description.toLowerCase().includes(normalizedQuery);

      if (matchesStatus && matchesQuery) {
        set.add(block.id);
      }
    }
    return set;
  }, [blocks, activeFilter, normalizedQuery]);

  const selectedBlock = blocksById.get(selectedBlockId) ?? blocks[0];

  const dependencyBlocks = useMemo(
    () =>
      selectedBlock.dependencies
        .map((id) => blocksById.get(id))
        .filter((b): b is NonNullable<typeof b> => Boolean(b)),
    [selectedBlock, blocksById]
  );

  const enterAtomicView = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId);
      setSelectedAtom({ type: 'core', id: blockId });
      setViewLevel('atomic');
    },
    [setSelectedBlockId]
  );

  const exitAtomicView = useCallback(() => {
    setViewLevel('macro');
    setSelectedAtom({ type: 'core', id: selectedBlock.id });
  }, [selectedBlock.id]);

  // ESC returns from Atomic Level 2 back to Macro Level 1
  useEffect(() => {
    if (viewLevel !== 'atomic') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitAtomicView();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewLevel, exitAtomicView]);

  const currentMonth = TIMELINE_MONTHS[monthIndex];
  const sliderPercent = (monthIndex / (TIMELINE_MONTHS.length - 1)) * 100;

  const filterPills: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: counts.todos },
    { id: 'critico', label: 'Críticos', count: counts.critico },
    { id: 'em_andamento', label: 'Em andamento', count: counts.em_andamento },
    { id: 'concluido', label: 'Concluídos', count: counts.concluido },
  ];

  // Resolve inspected atom in Level 2
  const inspectedSubtask =
    selectedAtom.type === 'subtask'
      ? selectedBlock.subtasks.find((s) => s.id === selectedAtom.id) ?? null
      : null;

  const inspectedRisk =
    selectedAtom.type === 'risk'
      ? selectedBlock.risks.find((r) => r.id === selectedAtom.id) ?? null
      : null;

  return (
    <div className="space-y-4">
      {/* A. Barra superior de filtros e controles */}
      <section
        aria-label="Filtros e controles do mapa 3D"
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 shadow-[var(--shadow-card)] lg:flex-row lg:flex-wrap lg:items-center lg:justify-between"
      >
        {viewLevel === 'macro' ? (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filtrar blocos por status"
          >
            {filterPills.map((pill) => {
              const isActive = activeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFilter(pill.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full border px-3 sm:px-3.5 text-xs font-medium transition-colors cursor-pointer tabular-nums whitespace-nowrap',
                    isActive
                      ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {pill.label} ({pill.count})
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exitAtomicView}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-3 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:opacity-90 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao mapa
            </button>
            <nav
              aria-label="Navegação do bloco 3D"
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
            >
              <button
                type="button"
                onClick={exitAtomicView}
                className="font-medium hover:text-[var(--text-primary)] hover:underline cursor-pointer"
              >
                Mapa Geral
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="font-medium text-[var(--text-muted)]">
                {selectedBlock.islandLabel}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="font-semibold text-[var(--text-primary)]">
                {selectedBlock.name}
              </span>
            </nav>
          </div>
        )}

        {/* Right: Search (macro) + Show Labels (macro) + Camera Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {viewLevel === 'macro' && (
            <>
              <div className="relative flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar elemento..."
                  aria-label="Buscar elemento no mapa 3D"
                  className="h-8 w-full sm:w-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] pr-7 pl-8 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-brand)] focus:outline-none"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowLabels((prev) => !prev)}
                aria-pressed={showLabels}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap',
                  showLabels
                    ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                )}
              >
                <Tag className="h-3 w-3" />
                Mostrar rótulos
              </button>
            </>
          )}

          <div
            className="inline-flex h-8 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1 text-[var(--text-secondary)] shrink-0"
            role="group"
            aria-label="Controles de câmera 3D"
          >
            <button
              type="button"
              onClick={() => stageRef.current?.zoomIn()}
              aria-label="Aproximar vista"
              title="Aproximar"
              className="inline-flex h-6 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => stageRef.current?.zoomOut()}
              aria-label="Afastar vista"
              title="Afastar"
              className="inline-flex h-6 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1 h-3.5 w-px bg-[var(--border-subtle)]" />
            <button
              type="button"
              onClick={() => {
                if (viewLevel === 'macro') {
                  setActiveFilter('todos');
                  setSearchQuery('');
                }
                stageRef.current?.resetView();
              }}
              className="inline-flex h-6 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Resetar vista</span>
            </button>
          </div>
        </div>
      </section>

      {/* B. Layout principal em 2 colunas (>= 1024px) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_328px] xl:grid-cols-[minmax(0,1fr)_348px] items-start">
        {/* Esquerda (~70%): Palco 3D isométrico com 2 níveis reais */}
        <section
          aria-label="Palco isométrico 3D de entregas e dependências"
          className="relative h-[470px] sm:h-[560px] lg:h-[620px] w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] shadow-[var(--shadow-card)]"
        >
          {/* Floating Top-Left HUD: Macro Legend OR Atomic Breadcrumb + Micro-Legend */}
          {viewLevel === 'macro' ? (
            <div className="pointer-events-auto absolute top-3.5 left-3.5 right-3.5 sm:right-auto z-10 flex flex-col gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 shadow-xs">
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
                {(
                  [
                    'concluido',
                    'em_andamento',
                    'atencao',
                    'critico',
                  ] as BlockStatus[]
                ).map((statusKey) => {
                  const meta = STATUS_META[statusKey];
                  const dotColor =
                    theme === 'dark' ? meta.darkHex : meta.lightHex;
                  return (
                    <div
                      key={statusKey}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="font-mono text-[10px] text-[var(--text-muted)]">
                Altura = avanço físico · Cor = status · Duplo clique = visão
                atômica
              </p>
            </div>
          ) : (
            <div className="pointer-events-auto absolute top-3.5 left-3.5 right-3.5 sm:right-auto z-10 flex flex-col gap-1 rounded-xl border border-[var(--border-brand)]/55 bg-[var(--bg-surface)] px-3.5 py-2 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exitAtomicView}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Mapa Geral
                </button>
                <span className="text-[11px] text-[var(--text-muted)]">›</span>
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {selectedBlock.islandLabel}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">›</span>
                <span className="text-[11px] font-semibold text-[var(--brand-primary)]">
                  {selectedBlock.name}
                </span>
                <span className="hidden sm:inline rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)]">
                  ESC
                </span>
              </div>
              <p className="font-mono text-[10px] text-[var(--text-muted)]">
                Clique nos cubos ao redor para concluir subtarefas · Clique nas
                dependências para navegar
              </p>
            </div>
          )}

          {/* Search empty match pill indicator (macro only) */}
          {viewLevel === 'macro' && matchedIds.size === 0 && (
            <div className="pointer-events-none absolute top-20 left-3.5 z-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] text-[var(--text-secondary)] shadow-xs">
              Nenhum elemento corresponde ao filtro atual.
            </div>
          )}

          {/* Three.js Isometric Canvas (Level 1 Macro + Level 2 Atomic) */}
          <IsometricStage3D
            ref={stageRef}
            blocks={blocks}
            matchedIds={matchedIds}
            selectedBlockId={selectedBlock.id}
            viewLevel={viewLevel}
            selectedAtom={selectedAtom}
            toggledSubtasks={toggledSubtasks}
            onSelectBlock={(id) => {
              setSelectedBlockId(id);
              setSelectedAtom({ type: 'core', id });
            }}
            onEnterAtomic={enterAtomicView}
            onSelectAtom={setSelectedAtom}
            onToggleSubtask={toggleBlockSubtask}
            onJumpToDependency={(depId) => {
              setSelectedBlockId(depId);
              setSelectedAtom({ type: 'core', id: depId });
            }}
            showLabels={showLabels}
            theme={theme}
          />

          {/* Bottom Timeline Slider Bar (visible in Macro; compact month indicator in Atomic) */}
          {viewLevel === 'macro' ? (
            <div className="absolute right-3.5 bottom-3.5 left-3.5 z-10 flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 shadow-[var(--shadow-card)] sm:right-auto sm:w-[440px] md:w-[480px]">
              <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
                {TIMELINE_MONTHS[0].shortLabel}
              </span>

              <div className="relative flex flex-1 items-center h-5">
                <div className="pointer-events-none h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-150"
                    style={{ width: `${sliderPercent}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={0}
                  max={TIMELINE_MONTHS.length - 1}
                  step={1}
                  value={monthIndex}
                  onChange={(e) => setMonthIndex(Number(e.target.value))}
                  aria-label="Linha do tempo do programa"
                  aria-valuetext={currentMonth.fullLabel}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />

                <div
                  className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--brand-primary)] bg-white shadow-sm transition-[left] duration-150"
                  style={{ left: `${sliderPercent}%` }}
                />
              </div>

              <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums">
                <span className="font-semibold text-[var(--text-primary)]">
                  {currentMonth.fullLabel}
                </span>
                <span className="hidden sm:inline text-[var(--text-muted)]">
                  {TIMELINE_MONTHS[TIMELINE_MONTHS.length - 1].shortLabel}
                </span>
              </div>
            </div>
          ) : (
            <div className="pointer-events-auto absolute bottom-3.5 left-3.5 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-[11px] text-[var(--text-secondary)] shadow-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--status-positive)]" />
                Subtarefa concluída
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                Em andamento
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-gold)]" />
                Dependência
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rotate-45 bg-[var(--status-critical)]" />
                Risco
              </span>
            </div>
          )}
        </section>

        {/* Direita (~30%): Painel Inspetor sincronizado ao nível atual (Macro vs Atômico) */}
        <aside
          aria-label={
            viewLevel === 'macro'
              ? 'Detalhes do bloco selecionado'
              : 'Inspetor atômico do bloco'
          }
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]"
        >
          {viewLevel === 'macro' ? (
            /* LEVEL 1 LATERAL SUMMARY */
            <>
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] uppercase',
                  getSelectedBadgeStyle(selectedBlock.status)
                )}
              >
                {selectedBlock.islandLabel} ·{' '}
                {STATUS_META[selectedBlock.status].label}
              </span>

              <h2 className="mt-4 font-[var(--font-display)] text-lg font-bold leading-snug text-[var(--text-primary)]">
                {selectedBlock.name}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {selectedBlock.description}
              </p>

              {/* Progresso atual */}
              <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Progresso atual ({currentMonth.fullLabel})
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedBlock.progress}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-300"
                    style={{ width: `${selectedBlock.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    Responsável
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    {selectedBlock.owner}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    Próximo marco
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    {selectedBlock.nextMilestone}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    Dependências ({dependencyBlocks.length})
                  </p>
                  {dependencyBlocks.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {dependencyBlocks.map((dep) => (
                        <button
                          key={dep.id}
                          type="button"
                          onClick={() => setSelectedBlockId(dep.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer"
                        >
                          {dep.name}
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            {dep.progress}%
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Nenhuma dependência direta
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => enterAtomicView(selectedBlock.id)}
                className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                Explorar bloco (visão atômica)
              </button>
              <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
                Ou dê duplo clique em qualquer prisma no palco 3D
              </p>
            </>
          ) : (
            /* LEVEL 2 ATOMIC INSPECTOR (No modal!) */
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.06em] uppercase',
                    getSelectedBadgeStyle(selectedBlock.status)
                  )}
                >
                  VISÃO ATÔMICA · {selectedBlock.islandLabel}
                </span>
                <span className="font-mono text-sm font-bold text-[var(--brand-primary)] tabular-nums">
                  {selectedBlock.progress}%
                </span>
              </div>

              <div>
                <h2 className="font-[var(--font-display)] text-base font-bold leading-snug text-[var(--text-primary)]">
                  {selectedBlock.name}
                </h2>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-300"
                    style={{ width: `${selectedBlock.progress}%` }}
                  />
                </div>
              </div>

              {/* Active Selected Atom Focus Card */}
              {inspectedSubtask && (
                <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/35 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-[var(--brand-primary)] uppercase">
                      Subtarefa selecionada
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      Prazo: {inspectedSubtask.dueLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">
                    {inspectedSubtask.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    Responsável: {selectedBlock.owner}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      toggleBlockSubtask(
                        inspectedSubtask.id,
                        inspectedSubtask.done
                      )
                    }
                    className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer"
                  >
                    {(toggledSubtasks[inspectedSubtask.id] ??
                      inspectedSubtask.done) ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-positive)]" />
                        Concluído (clique p/ reabrir)
                      </>
                    ) : (
                      <>
                        <Circle className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        Marcar como concluído
                      </>
                    )}
                  </button>
                </div>
              )}

              {inspectedRisk && (
                <div className="rounded-xl border border-[var(--status-critical)]/40 bg-[var(--status-critical-soft)]/40 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[var(--status-critical)] uppercase">
                      <AlertTriangle className="h-3 w-3" />
                      Risco ligado
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase',
                        getSeverityBadgeStyle(inspectedRisk.severity)
                      )}
                    >
                      {inspectedRisk.severity === 'alto'
                        ? 'Alto'
                        : inspectedRisk.severity === 'medio'
                          ? 'Médio'
                          : 'Baixo'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">
                    {inspectedRisk.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    Mitigação: {inspectedRisk.mitigation}
                  </p>
                </div>
              )}

              {!inspectedSubtask && !inspectedRisk && (
                <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Responsável
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                      {selectedBlock.owner}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Próximo marco
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">
                      {selectedBlock.nextMilestone}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Subtasks Checklist synced 1:1 with 3D cubes */}
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  Entregáveis / Sub-blocos ({selectedBlock.subtasks.length})
                </p>
                <div className="mt-2 space-y-1.5">
                  {selectedBlock.subtasks.map((st) => {
                    const isDone = toggledSubtasks[st.id] ?? st.done;
                    const isFocused =
                      selectedAtom.type === 'subtask' &&
                      selectedAtom.id === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedAtom({ type: 'subtask', id: st.id });
                          toggleBlockSubtask(st.id, st.done);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer',
                          isFocused
                            ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/35'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                          )}
                          <span
                            className={cn(
                              'truncate text-xs font-medium',
                              isDone
                                ? 'text-[var(--text-secondary)] line-through'
                                : 'text-[var(--text-primary)]'
                            )}
                          >
                            {st.title}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                          {st.dueLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jump to Dependencies in Atomic Mode */}
              {dependencyBlocks.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                    Saltar para dependência
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {dependencyBlocks.map((dep) => (
                      <button
                        key={dep.id}
                        type="button"
                        onClick={() => {
                          setSelectedBlockId(dep.id);
                          setSelectedAtom({ type: 'core', id: dep.id });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer"
                      >
                        <span>{dep.name}</span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          {dep.progress}%
                        </span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent History compact */}
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  Histórico recente
                </p>
                <div className="mt-2 space-y-1.5">
                  {selectedBlock.recentHistory.slice(0, 2).map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
                    >
                      <Clock className="mt-0.5 h-3 w-3 shrink-0 text-[var(--brand-primary)]" />
                      <div className="min-w-0">
                        <p className="text-[11px] leading-snug text-[var(--text-primary)]">
                          {h.summary}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] text-[var(--text-muted)]">
                          {h.date} · {h.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
