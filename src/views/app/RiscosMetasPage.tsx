'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Minus,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import type { IslandId } from '../../data/mapa3dData';
import {
  GANTT_FRONTS,
  computeKrProgress,
  getKrStatus,
  getRiskSeverityFromScore,
  type RiskSeverity,
  type RiskTrackingStatus,
} from '../../data/round5Data';
import { cn } from '../../lib/utils';
import { useLumeStore } from '../../services/lumeStore';

interface RiscosMetasPageProps {
  onSelectSection: (section: NavSectionId) => void;
  openLumi: () => void;
  showToast: (title: string, description?: string) => void;
}

type RiskListFilter = 'todos' | RiskSeverity | 'mitigado';
type FrontFilter = 'todas' | IslandId;

const SEVERITY_META: Record<
  RiskSeverity,
  {
    label: string;
    pillClass: string;
    badgeBgClass: string;
    dotColor: string;
  }
> = {
  critico: {
    label: 'Crítico',
    pillClass:
      'border-[var(--status-critical)]/45 bg-[var(--status-critical-soft)] text-[var(--status-critical)]',
    badgeBgClass:
      'bg-[var(--status-critical)] text-white border-transparent shadow-sm',
    dotColor: 'var(--status-critical)',
  },
  alto: {
    label: 'Alto',
    pillClass:
      'border-[var(--brand-gold)]/50 bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]',
    badgeBgClass:
      'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 border-transparent shadow-sm',
    dotColor: 'var(--brand-gold)',
  },
  moderado: {
    label: 'Moderado',
    pillClass:
      'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
    badgeBgClass:
      'bg-[var(--brand-primary)] text-white border-transparent shadow-sm',
    dotColor: 'var(--brand-primary)',
  },
  baixo: {
    label: 'Baixo',
    pillClass:
      'border-[var(--status-positive)]/40 bg-[var(--status-positive-soft)] text-[var(--status-positive)]',
    badgeBgClass:
      'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-transparent shadow-sm',
    dotColor: 'var(--status-positive)',
  },
};

const TRACKING_META: Record<
  RiskTrackingStatus,
  { label: string; badgeClass: string }
> = {
  ativo: {
    label: 'Ativo',
    badgeClass:
      'border-[var(--status-critical)]/35 bg-[var(--status-critical-soft)] text-[var(--status-critical)]',
  },
  em_mitigacao: {
    label: 'Em mitigação',
    badgeClass:
      'border-[var(--brand-gold)]/40 bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]',
  },
  mitigado: {
    label: 'Mitigado',
    badgeClass:
      'border-[var(--status-positive)]/35 bg-[var(--status-positive-soft)] text-[var(--status-positive)]',
  },
};

function getHeatmapCellTone(probability: number, impact: number): string {
  const score = probability * impact;
  if (score >= 16) {
    return 'bg-[var(--status-critical)]/16 border-[var(--status-critical)]/40 hover:border-[var(--status-critical)]';
  }
  if (score >= 10) {
    return 'bg-[var(--brand-gold)]/15 border-[var(--brand-gold)]/40 hover:border-[var(--brand-gold)]';
  }
  if (score >= 5) {
    return 'bg-[var(--brand-primary)]/12 border-[var(--border-brand)]/35 hover:border-[var(--border-brand)]';
  }
  return 'bg-[var(--status-positive)]/12 border-[var(--status-positive)]/30 hover:border-[var(--status-positive)]';
}

function formatKrValue(value: number, unit: string): string {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('pt-BR')
    : value.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
  return unit === '%' ? `${formatted}%` : `${formatted} ${unit}`;
}

export function RiscosMetasPage({
  onSelectSection,
  openLumi,
  showToast,
}: RiscosMetasPageProps) {
  const {
    risks,
    objectives,
    riskStatuses,
    customRisks,
    krValues,
    updateRiskStatus,
    addProjectRisk,
    updateKeyResultValue,
    setMapa3DSelectedBlockId,
  } = useLumeStore();

  const [activeTab, setActiveTab] = useState<'riscos' | 'okrs'>('riscos');
  const [severityFilter, setSeverityFilter] = useState<RiskListFilter>('todos');
  const [frontFilter, setFrontFilter] = useState<FrontFilter>('todas');
  const [selectedCell, setSelectedCell] = useState<{
    p: number;
    i: number;
  } | null>(null);

  // New Risk Modal state
  const [newRiskOpen, setNewRiskOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftFront, setDraftFront] = useState<IslandId>('operacao');
  const [draftProb, setDraftProb] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [draftImpact, setDraftImpact] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [draftOwner, setDraftOwner] = useState('João Victor');
  const [draftEstimatedImpact, setDraftEstimatedImpact] = useState('');
  const [draftMitigation, setDraftMitigation] = useState('');
  const [draftContingency, setDraftContingency] = useState('');

  const resolvedRisks = useMemo(() => {
    const existingIds = new Set(risks.map((r) => r.id));
    const mergedCustom = customRisks.filter((r) => !existingIds.has(r.id));
    const combined = [...mergedCustom, ...risks];
    return combined.map((risk) => {
      const score = risk.probability * risk.impact;
      const severity = getRiskSeverityFromScore(risk.probability, risk.impact);
      const trackingStatus = riskStatuses[risk.id] ?? risk.defaultStatus;
      return {
        ...risk,
        score,
        severity,
        trackingStatus,
      };
    });
  }, [risks, customRisks, riskStatuses]);

  const resolvedObjectives = useMemo(() => {
    return objectives.map((obj) => {
      const krs = obj.keyResults.map((kr) => {
        const currentValue = krValues[kr.id] ?? kr.currentValue;
        const pct = computeKrProgress(kr, currentValue);
        const status = getKrStatus(pct);
        return {
          ...kr,
          currentValue,
          pct,
          status,
        };
      });
      const avgPct = Math.round(
        krs.reduce((acc, k) => acc + k.pct, 0) / Math.max(1, krs.length)
      );
      return {
        ...obj,
        keyResults: krs,
        avgPct,
      };
    });
  }, [objectives, krValues]);

  // All KPIs computed 100% dynamically from live arrays
  const kpiStats = useMemo(() => {
    const activeCriticalCount = resolvedRisks.filter(
      (r) => r.trackingStatus !== 'mitigado' && r.severity === 'critico'
    ).length;
    const activeHighCount = resolvedRisks.filter(
      (r) => r.trackingStatus !== 'mitigado' && r.severity === 'alto'
    ).length;
    const mitigatedCount = resolvedRisks.filter(
      (r) => r.trackingStatus === 'mitigado'
    ).length;

    const allKrs = resolvedObjectives.flatMap((o) => o.keyResults);
    const onTrackKrs = allKrs.filter(
      (k) => k.status === 'Concluído' || k.status === 'No prazo'
    ).length;
    const attentionKrs = allKrs.filter((k) => k.status === 'Atenção').length;
    const delayedKrs = allKrs.filter((k) => k.status === 'Atrasado').length;
    const onTrackPct = Math.round(
      (onTrackKrs / Math.max(1, allKrs.length)) * 100
    );

    return {
      activeCriticalCount,
      activeHighCount,
      mitigatedCount,
      totalRisks: resolvedRisks.length,
      onTrackPct,
      onTrackKrs,
      attentionKrs,
      delayedKrs,
      totalKrs: allKrs.length,
      totalObjectives: resolvedObjectives.length,
    };
  }, [resolvedRisks, resolvedObjectives]);

  const filteredRisks = useMemo(() => {
    return resolvedRisks
      .filter((r) => {
        const matchesSeverity =
          severityFilter === 'todos'
            ? true
            : severityFilter === 'mitigado'
              ? r.trackingStatus === 'mitigado'
              : r.severity === severityFilter && r.trackingStatus !== 'mitigado';
        const matchesFront =
          frontFilter === 'todas' || r.frontId === frontFilter;
        const matchesCell =
          !selectedCell ||
          (r.probability === selectedCell.p && r.impact === selectedCell.i);
        return matchesSeverity && matchesFront && matchesCell;
      })
      .sort((a, b) => {
        const mitigatedWeight =
          (a.trackingStatus === 'mitigado' ? 1 : 0) -
          (b.trackingStatus === 'mitigado' ? 1 : 0);
        if (mitigatedWeight !== 0) return mitigatedWeight;
        return b.score - a.score;
      });
  }, [resolvedRisks, severityFilter, frontFilter, selectedCell]);

  const handleTrackingChange = (
    riskId: string,
    riskTitle: string,
    nextStatus: RiskTrackingStatus
  ) => {
    updateRiskStatus(riskId, nextStatus);
    showToast(
      `Status atualizado para "${TRACKING_META[nextStatus].label}"`,
      riskTitle
    );
  };

  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) return;

    const frontObj =
      GANTT_FRONTS.find((f) => f.id === draftFront) ?? GANTT_FRONTS[2];
    const created = addProjectRisk({
      title: trimmedTitle,
      frontId: frontObj.id,
      frontLabel: frontObj.label,
      probability: draftProb,
      impact: draftImpact,
      defaultStatus: 'ativo',
      estimatedImpact:
        draftEstimatedImpact.trim() || 'Impacto operacional em avaliação',
      mitigationPlan:
        draftMitigation.trim() ||
        'Plano preventivo definido com a coordenação da frente.',
      contingencyTrigger:
        draftContingency.trim() ||
        'Acionar comitê gestor se desvio ultrapassar 5 dias úteis.',
      owner: draftOwner.trim() || 'João Victor',
      dueDate: 'Nov 26',
    });

    setDraftTitle('');
    setDraftEstimatedImpact('');
    setDraftMitigation('');
    setDraftContingency('');
    setNewRiskOpen(false);
    setSelectedCell({ p: draftProb, i: draftImpact });
    showToast(
      `Risco ${created.code} cadastrado na matriz`,
      `${trimmedTitle} (P${draftProb}×I${draftImpact} · ${SEVERITY_META[getRiskSeverityFromScore(draftProb, draftImpact)].label}).`
    );
  };

  const handleJumpToBlock = (blockId: string) => {
    setMapa3DSelectedBlockId(blockId);
    onSelectSection('mapa3d');
  };

  const probRows = [5, 4, 3, 2, 1] as const;
  const impactCols = [1, 2, 3, 4, 5] as const;
  const draftSeverity = getRiskSeverityFromScore(draftProb, draftImpact);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Topo: 4 KPI cards 100% dinâmicos e coerentes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Exposição Crítica"
          value={`${kpiStats.activeCriticalCount} ${kpiStats.activeCriticalCount === 1 ? 'crítico' : 'críticos'}`}
          badgeText={`${kpiStats.activeHighCount} altos ativos`}
          badgeTone={
            kpiStats.activeCriticalCount > 0 ? 'critical' : 'positive'
          }
          insight="Riscos ativos com score P×I entre 16 e 25"
        />
        <KpiCard
          title="Mitigados no Ciclo"
          value={`${kpiStats.mitigatedCount} / ${kpiStats.totalRisks}`}
          badgeText={`${Math.round((kpiStats.mitigatedCount / Math.max(1, kpiStats.totalRisks)) * 100)}%`}
          badgeTone="positive"
          insight="Ações preventivas encerradas no registro"
        />
        <KpiCard
          title="Metas no Prazo"
          value={`${kpiStats.onTrackPct}%`}
          badgeText={`${kpiStats.onTrackKrs} / ${kpiStats.totalKrs} KRs`}
          badgeTone={
            kpiStats.onTrackPct >= 80
              ? 'positive'
              : kpiStats.onTrackPct >= 65
                ? 'gold'
                : 'critical'
          }
          insight={`${kpiStats.attentionKrs} em atenção · ${kpiStats.delayedKrs} ${kpiStats.delayedKrs === 1 ? 'atrasado' : 'atrasados'}`}
        />
        <KpiCard
          title="OKRs Ativos"
          value={`${kpiStats.totalObjectives} objetivos`}
          badgeText={`${kpiStats.totalKrs} KRs`}
          badgeTone="neutral"
          insight="Cobertura, conteúdo, 3G e caixa"
        />
      </div>

      {/* 2. Navegação interna por abas (Radix Tabs) */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'riscos' | 'okrs')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="riscos" className="gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Matriz de Riscos
            </TabsTrigger>
            <TabsTrigger value="okrs" className="gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Metas & OKRs
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'riscos' && (
              <button
                type="button"
                onClick={() => setNewRiskOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo risco
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectSection('mapa3d')}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] cursor-pointer"
            >
              <Box className="h-3.5 w-3.5" />
              Ver no Mapa 3D
            </button>
            <button
              type="button"
              onClick={openLumi}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-3 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:opacity-90 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Revisar com Lumi
            </button>
          </div>
        </div>

        {/* ABA 1: MATRIZ DE RISCOS 5x5 + REGISTRO DETALHADO */}
        <TabsContent value="riscos" className="mt-4">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[392px_minmax(0,1fr)] items-start">
            {/* Esquerda: Heatmap 5x5 com alto contraste e tooltips por código */}
            <section
              aria-label="Matriz de Probabilidade por Impacto 5 por 5"
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                    Mapa de Calor 5 × 5
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    Passe o mouse sobre um código ou clique numa célula
                  </p>
                </div>
                {selectedCell && (
                  <button
                    type="button"
                    onClick={() => setSelectedCell(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-2.5 py-1 font-mono text-[10px] font-semibold text-[var(--brand-primary)] cursor-pointer"
                  >
                    P{selectedCell.p}×I{selectedCell.i}
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-stretch gap-2">
                  <div className="flex flex-col items-center justify-center pr-0.5">
                    <span className="-rotate-90 whitespace-nowrap font-mono text-[9px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
                      Probabilidade
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {probRows.map((p) => (
                      <div
                        key={p}
                        className="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] gap-1.5 items-center"
                      >
                        <span className="text-center font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                          {p}
                        </span>
                        {impactCols.map((i) => {
                          const cellRisks = resolvedRisks.filter(
                            (r) => r.probability === p && r.impact === i
                          );
                          const isSelected =
                            selectedCell?.p === p && selectedCell?.i === i;

                          return (
                            <div
                              key={`${p}-${i}`}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setSelectedCell(isSelected ? null : { p, i })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedCell(isSelected ? null : { p, i });
                                }
                              }}
                              aria-label={`Probabilidade ${p}, Impacto ${i}, ${cellRisks.length} riscos`}
                              aria-pressed={isSelected}
                              className={cn(
                                'relative flex h-[54px] flex-wrap content-center items-center justify-center gap-1 rounded-lg border p-1 transition-all cursor-pointer',
                                getHeatmapCellTone(p, i),
                                isSelected &&
                                  'ring-2 ring-[var(--brand-primary)] ring-offset-1 ring-offset-[var(--bg-surface)]'
                              )}
                            >
                              {cellRisks.map((r) => {
                                const sevMeta = SEVERITY_META[r.severity];
                                const isMit = r.trackingStatus === 'mitigado';
                                return (
                                  <Tooltip key={r.id}>
                                    <TooltipTrigger asChild>
                                      <span
                                        className={cn(
                                          'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none transition-transform hover:scale-105',
                                          isMit
                                            ? 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] line-through'
                                            : sevMeta.badgeBgClass
                                        )}
                                      >
                                        {r.code}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-[260px] p-3"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-[10px] font-bold text-[var(--brand-primary)]">
                                          {r.code} · Score {r.score} (P
                                          {r.probability}×I{r.impact})
                                        </span>
                                        <span className="font-mono text-[10px] font-semibold text-[var(--text-secondary)]">
                                          {sevMeta.label}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs font-semibold leading-snug text-[var(--text-primary)]">
                                        {r.title}
                                      </p>
                                      <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                                        Responsável: {r.owner} ·{' '}
                                        {TRACKING_META[r.trackingStatus].label}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    <div className="grid grid-cols-[18px_repeat(5,minmax(0,1fr))] gap-1.5 pt-1 text-center font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                      <span />
                      {impactCols.map((i) => (
                        <span key={i}>{i}</span>
                      ))}
                    </div>
                    <p className="pt-0.5 text-center font-mono text-[9px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
                      Impacto no Programa
                    </p>
                  </div>
                </div>

                {/* Strict Score Rules Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-[10px] font-medium text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[var(--status-critical)]" />
                    Crítico (16–25)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
                    Alto (10–15)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[var(--brand-primary)]" />
                    Moderado (5–9)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                    Baixo (1–4)
                  </span>
                </div>
              </div>
            </section>

            {/* Direita: Lista limpa e compacta de riscos */}
            <section
              aria-label="Registro detalhado de riscos"
              className="space-y-3.5"
            >
              {/* Filter Bar */}
              <div className="flex flex-col gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'todos', label: `Todos (${resolvedRisks.length})` },
                      { id: 'critico', label: 'Crítico' },
                      { id: 'alto', label: 'Alto' },
                      { id: 'moderado', label: 'Moderado' },
                      { id: 'baixo', label: 'Baixo' },
                      { id: 'mitigado', label: 'Mitigados' },
                    ] as Array<{ id: RiskListFilter; label: string }>
                  ).map((item) => {
                    const active = severityFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSeverityFilter(item.id)}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium transition-colors cursor-pointer',
                          active
                            ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--text-primary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'todas', label: 'Todas frentes' },
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
                          'inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors cursor-pointer',
                          active
                            ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Risk Cards */}
              {filteredRisks.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    Nenhum risco encontrado para a combinação atual de célula e
                    filtros.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSeverityFilter('todos');
                      setFrontFilter('todas');
                      setSelectedCell(null);
                    }}
                    className="mt-3 inline-flex h-8 items-center rounded-lg border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-3 text-xs font-semibold text-[var(--brand-primary)] cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRisks.map((risk) => {
                    const sevMeta = SEVERITY_META[risk.severity];
                    const trkMeta = TRACKING_META[risk.trackingStatus];

                    return (
                      <article
                        key={risk.id}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'rounded-md px-2 py-0.5 font-mono text-[10px] font-bold',
                                  risk.trackingStatus === 'mitigado'
                                    ? 'border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                                    : sevMeta.badgeBgClass
                                )}
                              >
                                {risk.code}
                              </span>
                              <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                                {risk.frontLabel}
                              </span>
                              <span className="font-mono text-[10px] font-semibold text-[var(--text-muted)] tabular-nums">
                                Score {risk.score} (P{risk.probability} × I
                                {risk.impact})
                              </span>
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)] leading-snug">
                              {risk.title}
                            </h3>
                          </div>

                          {/* Strict mathematical P*I Severity Badge + Mitigado indicator if closed */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                'rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase',
                                sevMeta.pillClass
                              )}
                            >
                              {sevMeta.label}
                            </span>
                            {risk.trackingStatus === 'mitigado' && (
                              <span
                                className={cn(
                                  'rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase',
                                  trkMeta.badgeClass
                                )}
                              >
                                Mitigado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mitigation & Contingency */}
                        <div className="mt-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                            <p className="font-mono text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                              Plano de mitigação
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                              {risk.mitigationPlan}
                            </p>
                          </div>
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                            <p className="font-mono text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                              Gatilho / Contingência
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                              {risk.contingencyTrigger}
                            </p>
                          </div>
                        </div>

                        {/* Clean Footer: Impact + Owner + Single Compact Status Selector + Ver no Mapa 3D */}
                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                              <AlertTriangle className="h-3 w-3 text-[var(--brand-gold)]" />
                              {risk.estimatedImpact}
                            </span>
                            <span>Responsável: {risk.owner}</span>
                            <span className="font-mono">
                              Prazo: {risk.dueDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={risk.trackingStatus}
                              onValueChange={(val) =>
                                handleTrackingChange(
                                  risk.id,
                                  risk.title,
                                  val as RiskTrackingStatus
                                )
                              }
                            >
                              <SelectTrigger
                                aria-label={`Status de acompanhamento de ${risk.code}`}
                                className="h-8 min-w-[132px] rounded-lg px-2.5 text-[11px]"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="em_mitigacao">
                                  Em mitigação
                                </SelectItem>
                                <SelectItem value="mitigado">
                                  Mitigado
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {risk.relatedBlockId && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleJumpToBlock(risk.relatedBlockId!)
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer whitespace-nowrap"
                              >
                                <Box className="h-3.5 w-3.5" />
                                Ver no Mapa 3D
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </TabsContent>

        {/* ABA 2: METAS & OKRs */}
        <TabsContent value="okrs" className="mt-4">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {resolvedObjectives.map((obj) => (
              <section
                key={obj.id}
                className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--brand-primary)]">
                        {obj.code}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        {obj.frontLabel} · {obj.owner}
                      </span>
                    </div>
                    <h2 className="mt-2 font-[var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                      {obj.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {obj.subtitle}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xl font-bold text-[var(--text-primary)] tabular-nums">
                      {obj.avgPct}%
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      avanço médio
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-300"
                    style={{ width: `${obj.avgPct}%` }}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {obj.keyResults.map((kr) => {
                    const statusBadge =
                      kr.status === 'Concluído'
                        ? 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]'
                        : kr.status === 'No prazo'
                          ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                          : kr.status === 'Atenção'
                            ? 'bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]'
                            : 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]';

                    const barColor =
                      kr.status === 'Concluído'
                        ? 'bg-[var(--status-positive)]'
                        : kr.status === 'No prazo'
                          ? 'bg-[var(--brand-primary)]'
                          : kr.status === 'Atenção'
                            ? 'bg-[var(--brand-gold)]'
                            : 'bg-[var(--status-critical)]';

                    const maxAdjust = kr.lowerIsBetter
                      ? Math.round(kr.targetValue * 1.5)
                      : Math.round(kr.targetValue * 1.15);

                    const adjustBy = (delta: number) => {
                      const raw = Number((kr.currentValue + delta).toFixed(1));
                      const clamped = Math.max(0, Math.min(maxAdjust, raw));
                      updateKeyResultValue(kr.id, clamped);
                    };

                    return (
                      <div
                        key={kr.id}
                        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                              {kr.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                              Responsável: {kr.owner}
                            </p>
                          </div>

                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold',
                              statusBadge
                            )}
                          >
                            {kr.status === 'Concluído' && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            {kr.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="font-mono text-xs tabular-nums">
                            <span className="font-bold text-[var(--text-primary)]">
                              {formatKrValue(kr.currentValue, kr.unit)}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {' '}
                              / {formatKrValue(kr.targetValue, kr.unit)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustBy(-kr.step)}
                              aria-label={`Reduzir ${kr.title}`}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustBy(kr.step)}
                              aria-label={`Aumentar ${kr.title}`}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>

                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={`Ajustar valor exato de ${kr.title}`}
                                  className="inline-flex h-6 items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-brand)] hover:text-[var(--brand-primary)] cursor-pointer"
                                >
                                  <SlidersHorizontal className="h-2.5 w-2.5" />
                                  Ajustar
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-3.5" align="end">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                  Atualizar indicador
                                </p>
                                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                                  Meta: {formatKrValue(kr.targetValue, kr.unit)}
                                </p>
                                <div className="mt-3 space-y-2.5">
                                  <input
                                    type="range"
                                    min={0}
                                    max={maxAdjust}
                                    step={kr.step}
                                    value={kr.currentValue}
                                    onChange={(e) =>
                                      updateKeyResultValue(
                                        kr.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full accent-[var(--brand-primary)] cursor-pointer"
                                  />
                                  <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                                    <span className="text-[var(--text-muted)]">
                                      Atual:
                                    </span>
                                    <span className="font-bold text-[var(--brand-primary)]">
                                      {formatKrValue(kr.currentValue, kr.unit)}{' '}
                                      ({kr.pct}%)
                                    </span>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                            <div
                              className={cn(
                                'h-full rounded-full transition-[width] duration-300',
                                barColor
                              )}
                              style={{ width: `${kr.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-[10px] font-semibold text-[var(--text-secondary)] tabular-nums">
                            {kr.pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: + Novo Risco (cadastra e plota imediatamente na matriz 5x5) */}
      <Dialog open={newRiskOpen} onOpenChange={setNewRiskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Risco</DialogTitle>
            <DialogDescription>
              A severidade é calculada automaticamente pela regra P × I e o
              risco é plotado imediatamente na matriz 5×5.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRisk} className="space-y-3.5">
            <div>
              <label
                htmlFor="risk-title"
                className="text-xs font-medium text-[var(--text-secondary)]"
              >
                Descrição do risco
              </label>
              <input
                id="risk-title"
                type="text"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Ex.: Atraso na entrega de tablets de reposição no Sertão"
                className="mt-1 h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-brand)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Frente
                </label>
                <div className="mt-1">
                  <Select
                    value={draftFront}
                    onValueChange={(v) => setDraftFront(v as IslandId)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GANTT_FRONTS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Probabilidade (1–5)
                </label>
                <div className="mt-1">
                  <Select
                    value={String(draftProb)}
                    onValueChange={(v) =>
                      setDraftProb(Number(v) as 1 | 2 | 3 | 4 | 5)
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          P{n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Impacto (1–5)
                </label>
                <div className="mt-1">
                  <Select
                    value={String(draftImpact)}
                    onValueChange={(v) =>
                      setDraftImpact(Number(v) as 1 | 2 | 3 | 4 | 5)
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          I{n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Live P x I Severity Calculation Preview */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5">
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                Score automático: <strong>{draftProb * draftImpact}</strong> (P
                {draftProb} × I{draftImpact})
              </span>
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                  SEVERITY_META[draftSeverity].pillClass
                )}
              >
                {SEVERITY_META[draftSeverity].label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="risk-owner"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  Responsável
                </label>
                <input
                  id="risk-owner"
                  type="text"
                  value={draftOwner}
                  onChange={(e) => setDraftOwner(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)] focus:border-[var(--border-brand)] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="risk-impact-text"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  Impacto estimado
                </label>
                <input
                  id="risk-impact-text"
                  type="text"
                  value={draftEstimatedImpact}
                  onChange={(e) => setDraftEstimatedImpact(e.target.value)}
                  placeholder="Ex.: +7 dias ou R$ 28k"
                  className="mt-1 h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-brand)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="risk-mitigation"
                className="text-xs font-medium text-[var(--text-secondary)]"
              >
                Plano de mitigação
              </label>
              <input
                id="risk-mitigation"
                type="text"
                value={draftMitigation}
                onChange={(e) => setDraftMitigation(e.target.value)}
                placeholder="Ação preventiva para reduzir probabilidade ou impacto"
                className="mt-1 h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-brand)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="risk-contingency"
                className="text-xs font-medium text-[var(--text-secondary)]"
              >
                Gatilho / Contingência
              </label>
              <input
                id="risk-contingency"
                type="text"
                value={draftContingency}
                onChange={(e) => setDraftContingency(e.target.value)}
                placeholder="Quando e qual plano B acionar"
                className="mt-1 h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-brand)] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewRiskOpen(false)}
                className="inline-flex h-9 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)] cursor-pointer"
              >
                Adicionar à matriz
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
