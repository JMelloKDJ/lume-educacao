'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Diamond,
  Flag,
  GanttChartSquare,
  GitBranch,
  List,
  Link2,
  Zap,
} from 'lucide-react';
import {
  CrashingKpiStrip,
  CrashingView,
} from '../../components/cronograma/CrashingView';
import { PertCpmView } from '../../components/cronograma/PertCpmView';
import type { NavSectionId } from '../../components/layout/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { KpiCard } from '../../components/ui/kpi-card';
import {
  STATUS_META,
  TIMELINE_MONTHS,
  type BlockStatus,
  type IslandId,
} from '../../data/mapa3dData';
import {
  GANTT_DELIVERABLES,
  GANTT_FRONTS,
  type GanttDeliverable,
} from '../../data/round5Data';
import { cn } from '../../lib/utils';
import { useLumeStore } from '../../services/lumeStore';

interface CronogramaPageProps {
  onSelectSection: (section: NavSectionId) => void;
  openUpdateModal?: () => void;
}

type FrontFilter = 'todas' | IslandId;
type GanttStatusFilter = 'todos' | 'critico' | 'em_andamento' | 'concluido';
type ViewMode = 'gantt' | 'pert' | 'crashing' | 'lista';

interface ResolvedDeliverable extends GanttDeliverable {
  computedProgress: number;
  computedStatus: BlockStatus;
}

const TIMELINE_SPAN = TIMELINE_MONTHS.length - 1; // 8 intervals across 9 months

function getBarColors(status: BlockStatus): {
  track: string;
  fill: string;
  badge: string;
  diamond: string;
} {
  switch (status) {
    case 'concluido':
      return {
        track: 'bg-[var(--status-positive)]/20 border-[var(--status-positive)]/40',
        fill: 'bg-[var(--status-positive)]',
        badge:
          'border-[var(--status-positive)]/35 bg-[var(--status-positive-soft)] text-[var(--status-positive)]',
        diamond: 'bg-[var(--status-positive)] border-[var(--bg-surface)]',
      };
    case 'em_andamento':
      return {
        track: 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]/40',
        fill: 'bg-[var(--brand-primary)]',
        badge:
          'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
        diamond: 'bg-[var(--brand-primary)] border-[var(--bg-surface)]',
      };
    case 'atencao':
      return {
        track: 'bg-[var(--brand-gold)]/20 border-[var(--brand-gold)]/45',
        fill: 'bg-[var(--brand-gold)]',
        badge:
          'border-[var(--brand-gold)]/40 bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]',
        diamond: 'bg-[var(--brand-gold)] border-[var(--bg-surface)]',
      };
    case 'critico':
      return {
        track: 'bg-[var(--status-critical)]/20 border-[var(--status-critical)]/45',
        fill: 'bg-[var(--status-critical)]',
        badge:
          'border-[var(--status-critical)]/40 bg-[var(--status-critical-soft)] text-[var(--status-critical)]',
        diamond: 'bg-[var(--status-critical)] border-[var(--bg-surface)]',
      };
  }
}

export function CronogramaPage({
  onSelectSection,
  openUpdateModal,
}: CronogramaPageProps) {
  const {
    panel,
    mapa3dMonthIndex,
    ganttSubtasks,
    toggleGanttSubtask,
    setMapa3DSelectedBlockId,
    pertBaseline,
    pertSimulated,
    crashReductions,
    crashDelayCostPerDay,
    adjustCrashReduction,
    setCrashDelayCostPerDay,
    resetCrashSimulation,
  } = useLumeStore();

  const [frontFilter, setFrontFilter] = useState<FrontFilter>('todas');
  const [statusFilter, setStatusFilter] = useState<GanttStatusFilter>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [collapsedFronts, setCollapsedFronts] = useState<
    Partial<Record<IslandId, boolean>>
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const resolvedDeliverables = useMemo<ResolvedDeliverable[]>(() => {
    return GANTT_DELIVERABLES.map((item) => {
      const hasOverride = item.subtasks.some((st) => st.id in ganttSubtasks);
      if (!hasOverride) {
        return {
          ...item,
          computedProgress: item.progress,
          computedStatus: item.status,
        };
      }
      const doneCount = item.subtasks.reduce(
        (acc, st) => acc + ((ganttSubtasks[st.id] ?? st.done) ? 1 : 0),
        0
      );
      const computedProgress = Math.round(
        (doneCount / Math.max(1, item.subtasks.length)) * 100
      );
      let computedStatus: BlockStatus = item.status;
      if (computedProgress >= 100) {
        computedStatus = 'concluido';
      } else if (computedProgress >= 75) {
        computedStatus = item.status === 'atencao' ? 'atencao' : 'em_andamento';
      } else if (computedProgress >= 50) {
        computedStatus = item.status === 'critico' ? 'critico' : 'atencao';
      } else {
        computedStatus = 'critico';
      }
      return {
        ...item,
        computedProgress,
        computedStatus,
      };
    });
  }, [ganttSubtasks]);

  const filteredDeliverables = useMemo(() => {
    return resolvedDeliverables.filter((item) => {
      const matchesFront =
        frontFilter === 'todas' || item.frontId === frontFilter;
      const matchesStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'critico'
            ? item.computedStatus === 'critico' || item.isCriticalPath
            : statusFilter === 'em_andamento'
              ? item.computedStatus === 'em_andamento' ||
                item.computedStatus === 'atencao'
              : item.computedStatus === 'concluido';
      return matchesFront && matchesStatus;
    });
  }, [resolvedDeliverables, frontFilter, statusFilter]);

  const kpis = useMemo(() => {
    const total = resolvedDeliverables.length;
    const onTimeCount = resolvedDeliverables.filter(
      (d) => d.slackDays >= 0 || d.computedStatus === 'concluido'
    ).length;
    const criticalAttention = resolvedDeliverables.filter(
      (d) => d.isCriticalPath && d.computedStatus !== 'concluido'
    ).length;
    const avgSlack = Math.round(
      resolvedDeliverables.reduce((acc, d) => acc + d.slackDays, 0) /
        Math.max(1, total)
    );
    return {
      onTimeText: `${onTimeCount} / ${total}`,
      onTimePct: `${Math.round((onTimeCount / Math.max(1, total)) * 100)}%`,
      criticalAttention,
      avgSlackText: `${avgSlack >= 0 ? '+' : ''}${avgSlack} dias`,
    };
  }, [resolvedDeliverables]);

  const selectedDeliverable = useMemo(
    () => resolvedDeliverables.find((d) => d.id === selectedId) ?? null,
    [resolvedDeliverables, selectedId]
  );

  // Position of vertical "Hoje" marker anchored to active timeline month (default Out 2026 = index 3)
  const todayMonthIndex = Math.max(0, Math.min(TIMELINE_SPAN, mapa3dMonthIndex));
  const todayPercent = ((todayMonthIndex + 0.35) / (TIMELINE_SPAN + 1)) * 100;
  const todayLabel = TIMELINE_MONTHS[todayMonthIndex]?.fullLabel ?? 'Out 2026';

  const activeCycle =
    panel.fluxoEntregas.find((c) => c.ciclo === selectedCycleId) ??
    panel.fluxoEntregas.find((c) => c.destaque) ??
    panel.fluxoEntregas[panel.fluxoEntregas.length - 1];

  const toggleFrontCollapse = (frontId: IslandId) => {
    setCollapsedFronts((prev) => ({
      ...prev,
      [frontId]: !prev[frontId],
    }));
  };

  const handleJumpToMapa3D = (blockId: string) => {
    setMapa3DSelectedBlockId(blockId);
    setSelectedId(null);
    onSelectSection('mapa3d');
  };

  const visibleFronts = GANTT_FRONTS.filter((front) =>
    filteredDeliverables.some((d) => d.frontId === front.id)
  );

  const hasActiveCrash = Object.keys(crashReductions).length > 0;

  return (
    <div className="space-y-5 pb-24">
      {/* 1. Topo: KPI cards sincronizados com o modo ativo */}
      {viewMode === 'pert' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            title="Atividades na Rede"
            value={`${pertSimulated.total_atividades}`}
            badgeText="4 frentes"
            badgeTone="neutral"
            insight="Grafo acíclico completo (tarefas + marcos ágeis)"
          />
          <KpiCard
            title="Caminho Crítico (Folga = 0)"
            value={`${pertSimulated.total_criticas} atividades`}
            badgeText="FT = 0 du"
            badgeTone="critical"
            insight="Qualquer atraso impacta diretamente a entrega final"
          />
          <KpiCard
            title="Duração Total da Rede"
            value={`${pertSimulated.prazo_total_du} du`}
            badgeText={`±${pertSimulated.desvio_padrao_critico_du.toFixed(2).replace('.', ',')} du`}
            badgeTone="gold"
            insight="Desvio padrão consolidado (σ) do caminho crítico"
          />
        </div>
      ) : viewMode === 'crashing' ? (
        <CrashingKpiStrip
          baseline={pertBaseline}
          simulated={pertSimulated}
          delayCostPerDay={crashDelayCostPerDay}
          onChangeDelayCost={setCrashDelayCostPerDay}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Marcos no Prazo"
            value={kpis.onTimeText}
            badgeText={kpis.onTimePct}
            badgeTone="positive"
            insight="Entregas alinhadas à linha de base"
          />
          <KpiCard
            title="Caminho Crítico"
            value={`${kpis.criticalAttention} entregas`}
            badgeText={kpis.criticalAttention > 0 ? 'Em atenção' : 'Estável'}
            badgeTone={kpis.criticalAttention > 0 ? 'critical' : 'positive'}
            insight="Impacto direto na data de fechamento"
          />
          <KpiCard
            title="Folga Média"
            value={kpis.avgSlackText}
            badgeText="Margem global"
            badgeTone="neutral"
            insight="Reserva consolidada entre as 4 frentes"
          />
          <KpiCard
            title="Próximo Marco"
            value="15 Nov"
            badgeText="Revisão Final"
            badgeTone="gold"
            insight="Videoaulas & Homologação Regional"
          />
        </div>
      )}

      {/* 2. Barra de controles: filtros por frente, status e toggle Gantt | Lista */}
      <section
        aria-label="Filtros do cronograma executivo"
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-card)] xl:flex-row xl:items-center xl:justify-between"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Frente
          </span>
          {(
            [
              { id: 'todas', label: 'Todas' },
              ...GANTT_FRONTS,
            ] as Array<{ id: FrontFilter; label: string }>
          ).map((f) => {
            const active = frontFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrontFilter(f.id)}
                aria-pressed={active}
                className={cn(
                  'inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors cursor-pointer',
                  active
                    ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
          {(viewMode === 'gantt' || viewMode === 'lista') && (
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'critico', label: 'Crítico' },
                  { id: 'em_andamento', label: 'Em andamento' },
                  { id: 'concluido', label: 'Concluído' },
                ] as Array<{ id: GanttStatusFilter; label: string }>
              ).map((s) => {
                const active = statusFilter === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors cursor-pointer',
                      active
                        ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          <div
            className="inline-flex flex-wrap items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5"
            role="group"
            aria-label="Modo de visualização do cronograma"
          >
            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              aria-pressed={viewMode === 'gantt'}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'gantt'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <GanttChartSquare className="h-3.5 w-3.5" />
              Gantt
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pert')}
              aria-pressed={viewMode === 'pert'}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'pert'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Rede PERT/CPM
            </button>
            <button
              type="button"
              onClick={() => setViewMode('crashing')}
              aria-pressed={viewMode === 'crashing'}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'crashing'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Crashing
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              aria-pressed={viewMode === 'lista'}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'lista'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista de Marcos
            </button>
          </div>
        </div>
      </section>

      {/* 3. Visão Principal: Gantt, Rede PERT/CPM, Crashing ou Lista de Marcos */}
      {viewMode === 'pert' ? (
        <PertCpmView
          network={pertSimulated}
          baselineDuration={pertBaseline.prazo_total_du}
          frontFilter={frontFilter}
          hasActiveCrash={hasActiveCrash}
          onResetCrash={resetCrashSimulation}
        />
      ) : viewMode === 'crashing' ? (
        <CrashingView
          baseline={pertBaseline}
          simulated={pertSimulated}
          crashReductions={crashReductions}
          delayCostPerDay={crashDelayCostPerDay}
          frontFilter={frontFilter}
          onAdjustReduction={adjustCrashReduction}
          onResetSimulation={resetCrashSimulation}
        />
      ) : viewMode === 'gantt' ? (
        <section
          aria-label="Gráfico de Gantt Executivo"
          className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
        >
          {/* Header Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
            <div>
              <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Cronograma Mestre de Entregas (Jul 26 — Mar 27)
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                Clique em qualquer barra ou marco para ver datas, dependências, subtarefas e abrir no Mapa 3D
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--status-positive)]" />
                Concluído
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                Em andamento
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-gold)]" />
                Atenção
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--status-critical)]" />
                Crítico
              </span>
              <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                <Diamond className="h-2.5 w-2.5 fill-current text-[var(--brand-primary)]" />
                Marco
              </span>
            </div>
          </div>

          {visibleFronts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
              Nenhuma entrega encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[920px]">
                {/* Timeline Header Row */}
                <div className="grid grid-cols-[270px_minmax(0,1fr)] border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70">
                  <div className="sticky left-0 z-20 flex items-center justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                    <span>Frente / Entrega</span>
                    <span>Avanço</span>
                  </div>
                  <div className="relative grid grid-cols-9">
                    {TIMELINE_MONTHS.map((m, idx) => (
                      <div
                        key={m.shortLabel}
                        className={cn(
                          'border-r border-[var(--border-subtle)]/60 px-2 py-2.5 text-center font-mono text-[11px] last:border-r-0',
                          idx === todayMonthIndex
                            ? 'bg-[var(--brand-primary-soft)]/50 font-bold text-[var(--brand-primary)]'
                            : 'text-[var(--text-secondary)]'
                        )}
                      >
                        {m.shortLabel}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Front Groups & Deliverable Rows */}
                <div className="relative divide-y divide-[var(--border-subtle)]">
                  {visibleFronts.map((front) => {
                    const items = filteredDeliverables.filter(
                      (d) => d.frontId === front.id
                    );
                    const isCollapsed = Boolean(collapsedFronts[front.id]);
                    const avgFrontProgress = Math.round(
                      items.reduce((acc, i) => acc + i.computedProgress, 0) /
                        Math.max(1, items.length)
                    );

                    return (
                      <div key={front.id}>
                        {/* Collapsible Group Header */}
                        <div className="grid grid-cols-[270px_minmax(0,1fr)] bg-[var(--bg-elevated)]/45">
                          <button
                            type="button"
                            onClick={() => toggleFrontCollapse(front.id)}
                            className="sticky left-0 z-20 flex items-center justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-left transition-colors hover:bg-[var(--bg-surface)] cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                              )}
                              <span className="truncate font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--text-primary)] uppercase">
                                {front.label}
                              </span>
                              <span className="rounded-md bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                                {items.length}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-[var(--text-secondary)] tabular-nums">
                              {avgFrontProgress}%
                            </span>
                          </button>

                          <div className="relative grid grid-cols-9">
                            {TIMELINE_MONTHS.map((m) => (
                              <div
                                key={m.shortLabel}
                                className="border-r border-[var(--border-subtle)]/35 last:border-r-0"
                              />
                            ))}
                            {/* Vertical Hoje line */}
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[var(--brand-primary)]/60"
                              style={{ left: `${todayPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Deliverables inside Front */}
                        {!isCollapsed &&
                          items.map((item) => {
                            const leftPct =
                              (item.startMonth / (TIMELINE_SPAN + 1)) * 100;
                            const widthPct = Math.max(
                              7,
                              ((item.endMonth - item.startMonth + 0.55) /
                                (TIMELINE_SPAN + 1)) *
                                100
                            );
                            const milestonePct =
                              item.milestoneMonth !== undefined
                                ? ((item.milestoneMonth + 0.28) /
                                    (TIMELINE_SPAN + 1)) *
                                  100
                                : null;
                            const colors = getBarColors(item.computedStatus);

                            return (
                              <div
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedId(item.id);
                                  }
                                }}
                                className="group grid grid-cols-[270px_minmax(0,1fr)] border-t border-[var(--border-subtle)]/65 transition-colors hover:bg-[var(--bg-elevated)]/45 cursor-pointer"
                              >
                                {/* Sticky Left Task Meta */}
                                <div className="sticky left-0 z-20 flex items-center justify-between gap-2 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 transition-colors group-hover:bg-[var(--bg-elevated)]">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="truncate text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                                        {item.title}
                                      </p>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                      <span className="truncate text-[10px] text-[var(--text-muted)]">
                                        {item.owner}
                                      </span>
                                      {item.isCriticalPath && (
                                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-[var(--status-critical-soft)] font-mono text-[9px] font-semibold text-[var(--status-critical)] uppercase">
                                          Caminho crítico
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="shrink-0 font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                                    {item.computedProgress}%
                                  </span>
                                </div>

                                {/* Timeline Canvas Track */}
                                <div className="relative flex items-center py-2.5">
                                  {/* Month vertical grid lines */}
                                  <div className="pointer-events-none absolute inset-0 grid grid-cols-9">
                                    {TIMELINE_MONTHS.map((m) => (
                                      <div
                                        key={m.shortLabel}
                                        className="border-r border-[var(--border-subtle)]/35 last:border-r-0"
                                      />
                                    ))}
                                  </div>

                                  {/* Vertical Hoje line */}
                                  <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[var(--brand-primary)]/55"
                                    style={{ left: `${todayPercent}%` }}
                                  />

                                  {/* Duration Bar */}
                                  <div
                                    className={cn(
                                      'relative z-10 h-6 overflow-hidden rounded-lg border transition-transform duration-150 group-hover:scale-[1.01]',
                                      colors.track
                                    )}
                                    style={{
                                      marginLeft: `${leftPct}%`,
                                      width: `${Math.min(100 - leftPct, widthPct)}%`,
                                    }}
                                  >
                                    {/* Proportional progress fill */}
                                    <div
                                      className={cn(
                                        'h-full rounded-l-md transition-[width] duration-300',
                                        colors.fill
                                      )}
                                      style={{
                                        width: `${item.computedProgress}%`,
                                      }}
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center font-mono text-[10px] font-semibold text-white drop-shadow-xs">
                                      {item.computedProgress}%
                                    </span>
                                  </div>

                                  {/* Milestone Diamond */}
                                  {milestonePct !== null && (
                                    <div
                                      title={`Marco: ${item.forecastEndLabel}`}
                                      className={cn(
                                        'pointer-events-none absolute z-20 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-2 shadow-xs',
                                        colors.diamond
                                      )}
                                      style={{ left: `${milestonePct}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>

                {/* Footer marker label for Hoje */}
                <div className="grid grid-cols-[270px_minmax(0,1fr)] border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
                  <div className="sticky left-0 z-20 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
                    Linha de referência sincronizada ao corte ativo
                  </div>
                  <div className="relative h-7">
                    <div
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--brand-primary)] whitespace-nowrap"
                      style={{ left: `${todayPercent}%` }}
                    >
                      Hoje · {todayLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Visão Alternativa: Lista de Marcos */
        <section
          aria-label="Lista de marcos e entregas"
          className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  <th className="px-5 py-3">Entrega / Marco</th>
                  <th className="px-4 py-3">Frente</th>
                  <th className="px-4 py-3">Planejado → Previsto</th>
                  <th className="px-4 py-3">Folga</th>
                  <th className="px-4 py-3">Progresso</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Mapa 3D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {filteredDeliverables.map((item) => {
                  const colors = getBarColors(item.computedStatus);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="transition-colors hover:bg-[var(--bg-elevated)]/60 cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.title}
                          </span>
                          {item.isCriticalPath && (
                            <span className="rounded px-1.5 py-0.5 bg-[var(--status-critical-soft)] font-mono text-[9px] font-semibold text-[var(--status-critical)] uppercase">
                              Crítico
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {item.owner}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                        {item.frontLabel}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                        {item.plannedEndLabel} →{' '}
                        <span className="font-semibold text-[var(--text-primary)]">
                          {item.forecastEndLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] tabular-nums">
                        <span
                          className={cn(
                            'font-semibold',
                            item.slackDays < 0
                              ? 'text-[var(--status-critical)]'
                              : item.slackDays <= 3
                                ? 'text-[var(--brand-gold)]'
                                : 'text-[var(--status-positive)]'
                          )}
                        >
                          {item.slackDays >= 0 ? `+${item.slackDays}d` : `${item.slackDays}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className={cn('h-full rounded-full', colors.fill)}
                              style={{ width: `${item.computedProgress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
                            {item.computedProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold',
                            colors.badge
                          )}
                        >
                          {STATUS_META[item.computedStatus].label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJumpToMapa3D(item.blockId);
                          }}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer"
                        >
                          <Box className="h-3 w-3" />
                          Ver 3D
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Faixa secundária compacta: Ciclos Quinzenais (C10–C15) */}
      <section
        aria-label="Resumo dos Ciclos Quinzenais"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-[var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                Ciclos Quinzenais (C10–C15 · {panel.label})
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Cadência operacional sincronizada com o Painel Geral
              </p>
            </div>
          </div>

          {openUpdateModal && (
            <button
              type="button"
              onClick={openUpdateModal}
              className="inline-flex h-8 items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-brand)] cursor-pointer"
            >
              Atualizar boletim
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {panel.fluxoEntregas.map((cycle) => {
            const pct = Math.round((cycle.entregue / cycle.meta) * 100);
            const isSelected = activeCycle?.ciclo === cycle.ciclo;
            return (
              <button
                key={cycle.ciclo}
                type="button"
                onClick={() => setSelectedCycleId(cycle.ciclo)}
                aria-pressed={isSelected}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/45'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">
                    {cycle.ciclo}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10px] font-semibold tabular-nums',
                      pct >= 100
                        ? 'text-[var(--status-positive)]'
                        : pct >= 85
                          ? 'text-[var(--brand-primary)]'
                          : 'text-[var(--brand-gold)]'
                    )}
                  >
                    {pct}%
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
                  {cycle.entregue}/{cycle.meta} pts
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal de Detalhe da Entrega / Marco */}
      <Dialog
        open={Boolean(selectedDeliverable)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        {selectedDeliverable && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-6">
                <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
                  {selectedDeliverable.frontLabel}
                </span>
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase',
                    getBarColors(selectedDeliverable.computedStatus).badge
                  )}
                >
                  {STATUS_META[selectedDeliverable.computedStatus].label}
                </span>
                {selectedDeliverable.isCriticalPath && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--status-critical-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--status-critical)] uppercase">
                    <AlertTriangle className="h-3 w-3" />
                    Caminho crítico
                  </span>
                )}
              </div>
              <DialogTitle className="mt-2">
                {selectedDeliverable.title}
              </DialogTitle>
              <DialogDescription>
                Responsável: {selectedDeliverable.owner}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dates & Slack */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Data planejada
                  </p>
                  <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                    {selectedDeliverable.plannedEndLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Previsão atual
                  </p>
                  <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                    {selectedDeliverable.forecastEndLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Progresso / Folga
                  </p>
                  <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
                    {selectedDeliverable.computedProgress}% ·{' '}
                    <span
                      className={
                        selectedDeliverable.slackDays < 0
                          ? 'text-[var(--status-critical)]'
                          : 'text-[var(--status-positive)]'
                      }
                    >
                      {selectedDeliverable.slackDays >= 0
                        ? `+${selectedDeliverable.slackDays}d`
                        : `${selectedDeliverable.slackDays}d`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  <Link2 className="h-3.5 w-3.5" />
                  Dependências diretas
                </p>
                {selectedDeliverable.dependencies.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedDeliverable.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Sem pré-requisitos bloqueantes.
                  </p>
                )}
              </div>

              {/* Interactive Subtasks */}
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  <Flag className="h-3.5 w-3.5" />
                  Checklist de entregáveis (clique para atualizar)
                </p>
                <div className="mt-2 space-y-2">
                  {selectedDeliverable.subtasks.map((st) => {
                    const isDone = ganttSubtasks[st.id] ?? st.done;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => toggleGanttSubtask(st.id, st.done)}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--border-strong)] cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--status-positive)]" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                        )}
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isDone
                              ? 'text-[var(--text-secondary)] line-through'
                              : 'text-[var(--text-primary)]'
                          )}
                        >
                          {st.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleJumpToMapa3D(selectedDeliverable.blockId)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-3.5 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:opacity-90 cursor-pointer"
                >
                  <Box className="h-3.5 w-3.5" />
                  Inspecionar no Mapa 3D
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex h-9 items-center rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
