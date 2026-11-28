'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { NavSectionId } from '../components/layout/sidebar';
import type { LumiUiAction } from '../lib/agent/tools';
import {
  CUTOFF_SNAPSHOTS,
  INITIAL_ALERTS,
  type CutoffId,
  type CutoffSnapshot,
  type ExecutiveAlert,
} from '../data/mock-project';
import {
  DEFAULT_SELECTED_BLOCK_ID,
  DEFAULT_TIMELINE_INDEX,
  TIMELINE_MONTHS,
  getStatusCounts,
  resolveBlocksAtMonth,
  type BlockStatus,
  type IslandId,
  type ResolvedMap3DBlock,
} from '../data/mapa3dData';
import {
  INITIAL_PUBLICATIONS,
  WORKSPACE_PANEL_BY_CUTOFF,
  WORKSPACE_SCENARIOS,
  type BudgetMonthPoint,
  type CurvaSPoint,
  type DeliveryCyclePoint,
  type PublicationRecord,
  type RadarAttentionItem,
  type ScenarioId,
  type ScenarioItem,
  type StageProgressPoint,
  type WorkspacePanelSnapshot,
} from '../data/workspaceData';
import {
  INITIAL_OKR_OBJECTIVES,
  INITIAL_PROJECT_RISKS,
  type ProjectRiskItem,
  type RiskTrackingStatus,
  type StrategicObjective,
} from '../data/round5Data';
import {
  DEFAULT_CRASH_DELAY_COST_DU,
  PERT_CPM_ATIVIDADES,
  calcularDuracaoNormalPert,
  calcularRedePertCpm,
  type PertAtividadeInput,
  type PertCpmNetworkResult,
  type PreditivaPayload,
} from '../data/pertCpmData';

const STORE_STORAGE_KEY = 'lume-educacao-workspace-store-v2';

export interface SimulatorPremises {
  adocao: number;
  capacidade: number;
  reserva: number;
}

export const DEFAULT_SIMULATOR_PREMISES: SimulatorPremises = {
  adocao: 72,
  capacidade: 85,
  reserva: 15,
};

export type SimulationHealthStatus = 'Viável' | 'Atenção' | 'Crítico';

export interface ScenarioSimulationResult {
  projected: number;
  projectedLabel: string;
  status: SimulationHealthStatus;
  timelineShift: number;
  simulatedTimelineIndex: number;
  isModified: boolean;
}

export interface SnapshotOverride {
  avancoDeltaPct: number;
  orcamentoDeltaPct: number;
  entregasBonus: number;
  riscosResolvidosDelta: number;
  mapa3dProgressBoost: number;
  updatedAt: string;
  sourceFileName: string;
}

export interface ProjectSnapshotUpload {
  fileName: string;
  cutoffId: CutoffId;
  avancoDeltaPct?: number;
  orcamentoDeltaPct?: number;
  entregasBonus?: number;
  mapa3dProgressBoost?: number;
}

export interface Mapa3DStateResult {
  monthIndex: number;
  monthLabel: string;
  blocks: ResolvedMap3DBlock[];
  counts: ReturnType<typeof getStatusCounts>;
  selectedBlockId: string;
}

export interface LumiAskResult {
  reply: string;
  uiActions: LumiUiAction[];
  dataMutated: boolean;
}

interface WorkspaceApiPayload {
  source?: string;
  dataStatus?: string;
  evm?: Array<Record<string, unknown>>;
  controles?: Array<Record<string, unknown>>;
  sprints?: Array<Record<string, unknown>>;
  riscosResumo?: Record<string, unknown> | null;
  riscos?: Array<Record<string, unknown>>;
  mudancas?: Array<Record<string, unknown>>;
  okrs?: Array<Record<string, unknown>>;
  cenarios?: Array<Record<string, unknown>>;
  pert?: Array<Record<string, unknown>>;
  atividades?: Array<Record<string, unknown>>;
  custosMensais?: Array<{ mes: string; total_rs: number }>;
  elementos3d?: Array<Record<string, unknown>>;
  avancos?: Array<Record<string, unknown>>;
  cenarioAprovado?: { id_cenario?: string; nome_cenario?: string } | null;
}

interface PersistedStoreSlice {
  cutoffId: CutoffId;
  mapa3dMonthIndex: number;
  mapa3dSelectedBlockId: string;
  selectedScenarioId: ScenarioId;
  approvedScenarioId: ScenarioId | null;
  simulatorPremises: SimulatorPremises;
  alerts: ExecutiveAlert[];
  publications: PublicationRecord[];
  overridesByCutoff: Partial<Record<CutoffId, SnapshotOverride>>;
  toggledSubtasks: Record<string, boolean>;
  mitigatedRadarIds: Record<string, boolean>;
  riskStatuses: Record<string, RiskTrackingStatus>;
  customRisks: ProjectRiskItem[];
  krValues: Record<string, number>;
  ganttSubtasks: Record<string, boolean>;
  crashReductions: Record<string, number>;
  crashDelayCostPerDay: number;
}

const CUTOFF_TO_TIMELINE_INDEX: Record<CutoffId, number> = {
  '2026-07': 0,
  '2026-08': 1,
  '2026-09': 2,
  '2026-10': 3,
};

const TIMELINE_INDEX_TO_CUTOFF: Partial<Record<number, CutoffId>> = {
  0: '2026-07',
  1: '2026-08',
  2: '2026-09',
  3: '2026-10',
};

const MONTH_SHORT_PT: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

function formatPtPercent(val: number): string {
  return `${val.toFixed(1).replace('.', ',')}%`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function mapFrenteToIsland(frenteRaw: unknown): { id: IslandId; label: string } {
  const f = String(frenteRaw ?? '').toUpperCase();
  if (f === 'AGIL' || f === 'PLATAFORMA') return { id: 'plataforma', label: 'Plataforma' };
  if (f === 'PREDITIVA' || f === 'INFRAESTRUTURA') {
    return { id: 'infraestrutura', label: 'Infraestrutura' };
  }
  if (f === 'CONTEUDO') return { id: 'conteudo', label: 'Conteúdo' };
  return { id: 'operacao', label: 'Operação' };
}

function probPctToScale(pct: number): 1 | 2 | 3 | 4 | 5 {
  if (pct >= 75) return 5;
  if (pct >= 50) return 4;
  if (pct >= 30) return 3;
  if (pct >= 15) return 2;
  return 1;
}

function impactToScale(custoRs: number, prazoDu: number): 1 | 2 | 3 | 4 | 5 {
  const absCost = Math.abs(custoRs);
  if (absCost >= 50000 || prazoDu >= 15) return 5;
  if (absCost >= 22000 || prazoDu >= 8) return 4;
  if (absCost >= 12000 || prazoDu >= 3) return 3;
  if (absCost >= 5000) return 2;
  return 1;
}

function mapDbStatusToTracking(dbStatus: unknown): RiskTrackingStatus {
  const s = String(dbStatus ?? '').toUpperCase();
  if (s === 'ENCERRADO') return 'mitigado';
  if (s === 'OCORRIDO') return 'em_mitigacao';
  return 'ativo';
}

export function mapTrackingToDbStatus(tracking: RiskTrackingStatus): 'ABERTO' | 'ENCERRADO' | 'OCORRIDO' {
  if (tracking === 'mitigado') return 'ENCERRADO';
  if (tracking === 'em_mitigacao') return 'OCORRIDO';
  return 'ABERTO';
}

function mapLiveScenarios(rows: Array<Record<string, unknown>>): ScenarioItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return WORKSPACE_SCENARIOS;

  const metaById: Record<
    string,
    {
      prazoFinal: string;
      prazoShort: string;
      prazoDelta: string;
      investimentoFallback: number;
      retornoBase: number;
      risco: 'Baixo' | 'Moderado' | 'Alto';
      statusLabel: ScenarioItem['statusLabel'];
      statusTone: ScenarioItem['statusTone'];
      recommended?: boolean;
      timelineIndex: number;
      pointColor: string;
    }
  > = {
    C1: {
      prazoFinal: 'Abr 2027',
      prazoShort: 'Abr 27',
      prazoDelta: 'Baseline',
      investimentoFallback: 3083892,
      retornoBase: 9.2,
      risco: 'Alto',
      statusLabel: 'Referência',
      statusTone: 'muted',
      timelineIndex: 3,
      pointColor: '#94A3B8',
    },
    C2: {
      prazoFinal: 'Fev 2027',
      prazoShort: 'Fev 27',
      prazoDelta: '-15 d.u.',
      investimentoFallback: 3140000,
      retornoBase: 14.8,
      risco: 'Moderado',
      statusLabel: 'Recomendado',
      statusTone: 'positive',
      recommended: true,
      timelineIndex: 1.4,
      pointColor: '#34D399',
    },
    C3: {
      prazoFinal: 'Mar 2027',
      prazoShort: 'Mar 27',
      prazoDelta: '-8 d.u.',
      investimentoFallback: 2950000,
      retornoBase: 11.4,
      risco: 'Moderado',
      statusLabel: 'Alternativa',
      statusTone: 'info',
      timelineIndex: 2.0,
      pointColor: '#38BDF8',
    },
    C4: {
      prazoFinal: 'Mar 2027',
      prazoShort: 'Mar 27',
      prazoDelta: '+6% benef.',
      investimentoFallback: 3130292,
      retornoBase: 18.4,
      risco: 'Baixo',
      statusLabel: 'Recomendado',
      statusTone: 'positive',
      recommended: true,
      timelineIndex: 2.2,
      pointColor: '#34D399',
    },
    C5: {
      prazoFinal: 'Mai 2027',
      prazoShort: 'Mai 27',
      prazoDelta: 'Troca téc.',
      investimentoFallback: 3180000,
      retornoBase: 10.6,
      risco: 'Moderado',
      statusLabel: 'Alternativa',
      statusTone: 'info',
      timelineIndex: 3.4,
      pointColor: '#38BDF8',
    },
    C6: {
      prazoFinal: 'Jun 2027',
      prazoShort: 'Jun 27',
      prazoDelta: '2 ondas',
      investimentoFallback: 3090000,
      retornoBase: 13.2,
      risco: 'Baixo',
      statusLabel: 'Conservador',
      statusTone: 'gold',
      timelineIndex: 3.9,
      pointColor: '#D4AF37',
    },
  };

  return rows.map((row, idx) => {
    const id = String(row.id_cenario ?? `C${idx + 1}`).toUpperCase() as ScenarioId;
    const meta = metaById[id] ?? metaById.C1;
    const nome = String(row.nome_cenario ?? `Cenário ${id}`);
    const tipo = String(row.tipo_cenario ?? '').replace(/_/g, ' ').toLowerCase();
    const desc = String(row.descricao ?? '');
    const invAdd = Number(row.investimento_adicional_rs ?? 0);
    const invTotal = (meta.investimentoFallback + (Number.isFinite(invAdd) ? invAdd : 0)) / 1_000_000;
    const benVar = Number(row.variacao_beneficio_pct ?? 0);
    const retornoNum = Number(
      clamp(meta.retornoBase + (Number.isFinite(benVar) ? benVar * 0.45 : 0), 2, 28).toFixed(1)
    );

    return {
      id,
      name: `${id} · ${nome}`,
      shortLabel: id,
      subtitle: tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Cenário oficial',
      summary: desc || 'Parâmetros carregados diretamente do banco do projeto.',
      prazoFinal: meta.prazoFinal,
      prazoShort: meta.prazoShort,
      prazoDelta: meta.prazoDelta,
      investimento: `R$ ${invTotal.toFixed(2).replace('.', ',')}M`,
      retornoNum,
      retornoLabel: `+${retornoNum.toFixed(1).replace('.', ',')}%`,
      risco: meta.risco,
      statusLabel: meta.statusLabel,
      statusTone: meta.statusTone,
      recommended: meta.recommended,
      timelineIndex: meta.timelineIndex,
      pointColor: meta.pointColor,
    };
  });
}

function mapLiveRisks(rows: Array<Record<string, unknown>>): ProjectRiskItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return INITIAL_PROJECT_RISKS;

  return rows.map((r) => {
    const code = String(r.id_risco ?? 'R00');
    const front = mapFrenteToIsland(r.frente ?? r.categoria);
    const probPct = Number(r.probabilidade_pct ?? 30);
    const costRs = Number(r.impacto_custo_rs ?? 0);
    const prazoDu = Number(r.impacto_prazo_du ?? 0);
    const tipo = String(r.tipo_risco ?? 'AMEACA');
    const custoResp = Number(r.custo_resposta_rs ?? 0);

    const costLabel =
      costRs === 0
        ? 'Sem impacto direto em caixa'
        : `Impacto R$ ${(Math.abs(costRs) / 1000).toFixed(1).replace('.', ',')}k${prazoDu > 0 ? ` · +${prazoDu} d.u.` : ''}`;

    return {
      id: code,
      code,
      title: String(r.descricao ?? `Risco ${code}`),
      frontId: front.id,
      frontLabel: front.label,
      probability: probPctToScale(probPct),
      impact: impactToScale(costRs, prazoDu),
      defaultStatus: mapDbStatusToTracking(r.status),
      estimatedImpact: `${tipo === 'OPORTUNIDADE' ? 'Oportunidade · ' : ''}${costLabel}`,
      mitigationPlan: `Estratégia: ${String(r.estrategia_resposta ?? 'MITIGAR')} · Custo resposta: R$ ${custoResp.toLocaleString('pt-BR')}`,
      contingencyTrigger: r.causa
        ? String(r.causa)
        : `Acompanhamento semanal (${probPct}% de probabilidade registrada).`,
      owner: String(r.id_responsavel ?? 'Coordenação'),
      dueDate: r.data_identificacao ? String(r.data_identificacao) : 'Ciclo atual',
    };
  });
}

function mapLiveOkrs(rows: Array<Record<string, unknown>>): StrategicObjective[] {
  if (!Array.isArray(rows) || rows.length === 0) return INITIAL_OKR_OBJECTIVES;

  const byObj = new Map<string, StrategicObjective>();
  for (const r of rows) {
    const objId = String(r.id_objetivo ?? 'O1');
    const objTitle = String(r.objetivo ?? 'Objetivo do Piloto');
    const krId = String(r.id_resultado_chave ?? 'KR1');
    const val = Number(r.valor ?? 0);
    const meta = Number(r.meta ?? 100);
    const unit = String(r.unidade ?? '');
    const lowerIsBetter = String(r.sentido ?? '') === 'MENOR_MELHOR';

    let existing = byObj.get(objId);
    if (!existing) {
      existing = {
        id: objId,
        code: objId,
        title: objTitle,
        subtitle: r.funil_semana_inicio
          ? `Última medição do piloto em ${String(r.funil_semana_inicio)}`
          : 'Indicadores medidos no Supabase',
        frontLabel: objId === 'O1' ? 'Piloto & Mercado' : 'Plataforma & Entrega',
        owner: 'Comitê Lume',
        keyResults: [],
      };
      byObj.set(objId, existing);
    }

    const step =
      unit === '%' || Math.abs(meta) <= 100
        ? meta <= 10
          ? 0.5
          : 1
        : Math.max(1, Math.round(meta / 20));

    existing.keyResults.push({
      id: krId,
      title: String(r.resultado_chave ?? krId),
      currentValue: val,
      targetValue: meta,
      unit,
      step,
      owner: 'Time Lume',
      lowerIsBetter,
    });
  }

  return Array.from(byObj.values());
}

export function computeScenarioSimulation(
  scenario: ScenarioItem,
  premises: SimulatorPremises
): ScenarioSimulationResult {
  const isModified =
    premises.adocao !== DEFAULT_SIMULATOR_PREMISES.adocao ||
    premises.capacidade !== DEFAULT_SIMULATOR_PREMISES.capacidade ||
    premises.reserva !== DEFAULT_SIMULATOR_PREMISES.reserva;

  const deltaAdocao = (premises.adocao - DEFAULT_SIMULATOR_PREMISES.adocao) * 0.18;
  const deltaCapacidade =
    (premises.capacidade - DEFAULT_SIMULATOR_PREMISES.capacidade) * 0.14;
  const deltaReserva = (DEFAULT_SIMULATOR_PREMISES.reserva - premises.reserva) * 0.12;

  const projected = clamp(
    Number((scenario.retornoNum + deltaAdocao + deltaCapacidade + deltaReserva).toFixed(1)),
    1.2,
    29.5
  );

  const rawShift =
    (DEFAULT_SIMULATOR_PREMISES.capacidade - premises.capacidade) * 0.018 +
    (DEFAULT_SIMULATOR_PREMISES.adocao - premises.adocao) * 0.008;
  const timelineShift = isModified ? clamp(Number(rawShift.toFixed(2)), -0.7, 0.85) : 0;
  const simulatedTimelineIndex = clamp(
    Number((scenario.timelineIndex + timelineShift).toFixed(2)),
    0.75,
    4.25
  );

  let status: SimulationHealthStatus = 'Viável';
  if (
    projected < 8.5 ||
    premises.reserva < 8 ||
    premises.capacidade < 60 ||
    premises.adocao < 50
  ) {
    status = 'Crítico';
  } else if (
    projected < 13.0 ||
    premises.reserva < 11 ||
    premises.capacidade < 70 ||
    premises.adocao < 60
  ) {
    status = 'Atenção';
  }

  return {
    projected,
    projectedLabel: `+${projected.toFixed(1).replace('.', ',')}%`,
    status,
    timelineShift,
    simulatedTimelineIndex,
    isModified,
  };
}

function buildPanelSnapshot(
  cutoffId: CutoffId,
  override?: SnapshotOverride,
  liveData?: WorkspaceApiPayload | null
): WorkspacePanelSnapshot {
  const base = WORKSPACE_PANEL_BY_CUTOFF[cutoffId];

  let liveBase: WorkspacePanelSnapshot = base;

  if (liveData && Array.isArray(liveData.evm) && liveData.evm.length > 0) {
    const evmProj = liveData.evm.find((r) => String(r.frente).toUpperCase() === 'PROJETO');
    const evmPred = liveData.evm.find((r) => String(r.frente).toUpperCase() === 'PREDITIVA');
    const evmAgil = liveData.evm.find((r) => String(r.frente).toUpperCase() === 'AGIL');

    const ont = Number(evmProj?.ont_rs ?? 3083892);
    const va = Number(evmProj?.va_rs ?? 2318001.21);
    const vp = Number(evmProj?.vp_rs ?? 2747721.82);
    const cr = Number(evmProj?.cr_rs ?? 3133421.46);
    const idp = Number(evmProj?.idp ?? 0.8436);
    const idc = Number(evmProj?.idc ?? 0.7398);

    const avancoRealPct = ont > 0 ? Number(((va / ont) * 100).toFixed(1)) : 75.2;
    const planejadoRealPct = ont > 0 ? Number(((vp / ont) * 100).toFixed(1)) : 89.1;
    const execucaoOrcPct = ont > 0 ? Number(((cr / ont) * 100).toFixed(1)) : 101.6;

    const ctrMap = new Map<string, number>();
    for (const c of liveData.controles ?? []) {
      ctrMap.set(String(c.codigo), Number(c.atual_dinamico ?? 0));
    }
    const doneItems = ctrMap.get('07_backlog_concluidos') ?? 100;
    const totalItems = ctrMap.get('06_backlog_itens') ?? 141;
    const ptsDone = ctrMap.get('08_backlog_pts_concluidos') ?? 306;
    const deliveriesPct = totalItems > 0 ? (doneItems / totalItems) * 100 : 70.9;

    const rr = liveData.riscosResumo ?? {};
    const ameacasAbertas = Number(rr.ameacas_abertas ?? 6);
    const exposicaoLiquida = Number(rr.exposicao_liquida_rs ?? 47240);
    const reservaTotal = Number(rr.reserva_total_rs ?? 170000);
    const saldoReserva = Number(rr.saldo_total_reservas_rs ?? 0);

    const fluxoEntregas: DeliveryCyclePoint[] =
      Array.isArray(liveData.sprints) && liveData.sprints.length > 0
        ? liveData.sprints.slice(-6).map((s, idx, arr) => ({
            ciclo: String(s.id_sprint ?? `S${idx + 1}`),
            meta: Math.round(Number(s.pts_comprometidos ?? 0)),
            entregue: Math.round(Number(s.velocidade_pts ?? 0)),
            tendencia: Number(Number(s.velocidade_media_5_ultimas ?? 0).toFixed(1)),
            destaque: idx === arr.length - 1,
          }))
        : base.fluxoEntregas;

    const monthlyBudget: BudgetMonthPoint[] =
      Array.isArray(liveData.custosMensais) && liveData.custosMensais.length > 0
        ? liveData.custosMensais.slice(-6).map((m, idx, arr) => {
            const parts = String(m.mes).split('-');
            const monthLabel = MONTH_SHORT_PT[parts[1] ?? ''] ?? m.mes;
            return {
              month: monthLabel,
              valorK: Math.round(Number(m.total_rs ?? 0) / 1000),
              isCurrent: idx === arr.length - 1,
            };
          })
        : base.orcamento.monthly;

    const etapas: StageProgressPoint[] = [
      evmPred && Number(evmPred.ont_rs ?? 0) > 0
        ? {
            etapa: 'Preditiva',
            realizado: Math.round((Number(evmPred.va_rs ?? 0) / Number(evmPred.ont_rs)) * 100),
            planejado: Math.round((Number(evmPred.vp_rs ?? 0) / Number(evmPred.ont_rs)) * 100),
          }
        : base.etapas[0],
      evmAgil && Number(evmAgil.ont_rs ?? 0) > 0
        ? {
            etapa: 'Ágil',
            realizado: Math.round((Number(evmAgil.va_rs ?? 0) / Number(evmAgil.ont_rs)) * 100),
            planejado: Math.round((Number(evmAgil.vp_rs ?? 0) / Number(evmAgil.ont_rs)) * 100),
          }
        : base.etapas[1],
      {
        etapa: 'Projeto',
        realizado: Math.round(avancoRealPct),
        planejado: Math.round(planejadoRealPct),
      },
    ];

    const curvaS: CurvaSPoint[] = base.curvaS.map((pt, idx) => {
      if (pt.month === base.currentMonthShort) {
        return {
          ...pt,
          realizado: avancoRealPct,
          planejado: planejadoRealPct,
        };
      }
      if (idx === base.curvaS.length - 3 && pt.realizado !== null) {
        return { ...pt, realizado: Number((avancoRealPct * 0.82).toFixed(1)) };
      }
      return pt;
    });

    const openThreats = (liveData.riscos ?? [])
      .filter((r) => String(r.status).toUpperCase() === 'ABERTO')
      .sort(
        (a, b) =>
          Math.abs(Number(b.probabilidade_pct ?? 0) * Number(b.impacto_custo_rs ?? 0)) -
          Math.abs(Number(a.probabilidade_pct ?? 0) * Number(a.impacto_custo_rs ?? 0))
      )
      .slice(0, 4);

    const radarAtencao: RadarAttentionItem[] =
      openThreats.length > 0
        ? openThreats.map((r) => {
            const prob = Number(r.probabilidade_pct ?? 0);
            const imp = Number(r.impacto_custo_rs ?? 0);
            const isCrit = prob >= 40 || Math.abs(imp) >= 25000;
            return {
              id: String(r.id_risco),
              title: `${String(r.id_risco)} · ${String(r.descricao ?? '')}`,
              owner: String(r.id_responsavel ?? 'Equipe'),
              dueDate: String(r.frente ?? 'PROJETO'),
              statusLabel: isCrit ? 'Crítico' : 'Atenção',
              tone: isCrit ? 'critical' : 'gold',
              actionNote: `Probabilidade ${prob}% · Estratégia ${String(r.estrategia_resposta ?? 'MITIGAR')} · Impacto R$ ${(Math.abs(imp) / 1000).toFixed(1).replace('.', ',')}k.`,
              targetSection: 'riscos',
            };
          })
        : base.radarAtencao;

    const reservaPctNorm =
      reservaTotal > 0 ? Math.max(0, Math.round((saldoReserva / reservaTotal) * 20)) : 0;
    const executadoPctNorm = Math.min(92, Math.max(40, Math.round((va / Math.max(ont, 1)) * 85)));
    const comprometidoPctNorm = Math.max(0, 100 - executadoPctNorm - reservaPctNorm);

    liveBase = {
      ...base,
      updatedAt: `Corte Supabase ${liveData.dataStatus ?? '2026-11-13'}`,
      kpis: [
        {
          id: 'avanco-geral',
          title: 'Avanço Físico (VA/ONT)',
          value: formatPtPercent(avancoRealPct),
          badgeText: `IDP ${idp.toFixed(2).replace('.', ',')}`,
          badgeTone: idp >= 0.95 ? 'positive' : idp >= 0.8 ? 'gold' : 'critical',
          insight: `Planejado no corte: ${formatPtPercent(planejadoRealPct)}`,
        },
        {
          id: 'orcamento',
          title: 'Custo vs Orçado (CR/ONT)',
          value: formatPtPercent(execucaoOrcPct),
          badgeText: `IDC ${idc.toFixed(2).replace('.', ',')}`,
          badgeTone: idc >= 0.95 ? 'positive' : idc >= 0.8 ? 'gold' : 'critical',
          insight: `CR R$ ${(cr / 1_000_000).toFixed(2).replace('.', ',')}M de R$ ${(ont / 1_000_000).toFixed(2).replace('.', ',')}M`,
        },
        {
          id: 'entregas-ciclo',
          title: 'Backlog Concluído',
          value: `${doneItems} / ${totalItems}`,
          badgeText: formatPtPercent(deliveriesPct),
          badgeTone: 'info',
          insight: `${ptsDone} story points entregues até o corte`,
        },
        {
          id: 'riscos-ativos',
          title: 'Ameaças Abertas',
          value: `${ameacasAbertas} abertas`,
          badgeText: `VME R$ ${(exposicaoLiquida / 1000).toFixed(1).replace('.', ',')}k`,
          badgeTone: ameacasAbertas >= 4 ? 'gold' : 'positive',
          insight: `Saldo de reservas: R$ ${(saldoReserva / 1000).toFixed(0)}k`,
        },
      ],
      curvaS,
      etapas,
      fluxoEntregas,
      orcamento: {
        executadoPct: executadoPctNorm,
        comprometidoPct: comprometidoPctNorm,
        reservaPct: reservaPctNorm,
        monthly: monthlyBudget,
      },
      radarAtencao,
    };
  }

  if (!override) return liveBase;

  const avancoDelta = override.avancoDeltaPct;
  const orcamentoDelta = override.orcamentoDeltaPct;
  const entregasBonus = override.entregasBonus;

  const kpis = liveBase.kpis.map((kpi) => {
    if (kpi.id === 'avanco-geral') {
      const currentVal = parseFloat(kpi.value.replace(',', '.'));
      const nextVal = clamp(currentVal + avancoDelta, 0, 99.6);
      return {
        ...kpi,
        value: formatPtPercent(nextVal),
        badgeText: `+${(avancoDelta >= 0 ? avancoDelta : 0).toFixed(1).replace('.', ',')} p.p.`,
        insight: `Atualizado via ${override.sourceFileName}`,
      };
    }
    if (kpi.id === 'orcamento') {
      const currentVal = parseFloat(kpi.value.replace(',', '.'));
      const nextVal = clamp(currentVal + orcamentoDelta, 0, 140.0);
      return {
        ...kpi,
        value: formatPtPercent(nextVal),
        insight: 'Recalculado com boletim mais recente',
      };
    }
    if (kpi.id === 'entregas-ciclo' && entregasBonus > 0) {
      const [doneStr, totalStr] = kpi.value.split('/').map((s) => s.trim());
      const done = parseInt(doneStr, 10) || 100;
      const total = parseInt(totalStr, 10) || 141;
      const nextDone = Math.min(total, done + entregasBonus);
      const pct = (nextDone / total) * 100;
      return {
        ...kpi,
        value: `${nextDone} / ${total}`,
        badgeText: formatPtPercent(pct),
      };
    }
    return kpi;
  });

  return {
    ...liveBase,
    updatedAt: override.updatedAt,
    kpis,
  };
}

function buildCutoffSnapshot(
  cutoffId: CutoffId,
  panel: WorkspacePanelSnapshot
): CutoffSnapshot {
  const base = CUTOFF_SNAPSHOTS[cutoffId];
  return {
    ...base,
    updatedAt: panel.updatedAt,
    databaseStatus: 'Supabase ao vivo',
    kpis: base.kpis.map((kpi, idx) =>
      panel.kpis[idx]
        ? {
            ...kpi,
            title: panel.kpis[idx].title,
            value: panel.kpis[idx].value,
            badgeText: panel.kpis[idx].badgeText,
            insight: panel.kpis[idx].insight,
          }
        : kpi
    ),
  };
}

function buildMapa3DBlocks(
  monthIndex: number,
  override?: SnapshotOverride,
  toggledSubtasks?: Record<string, boolean>
): ResolvedMap3DBlock[] {
  const resolved = resolveBlocksAtMonth(monthIndex);
  const boost = override?.mapa3dProgressBoost ?? 0;
  const focalIds = new Set([
    'videoaulas-banco',
    'player-offline',
    'homologacao-escolas',
    'simulado-tri',
  ]);

  return resolved.map((block) => {
    let nextProgress = block.progress;
    let nextStatus: BlockStatus = block.status;

    if (boost > 0 && focalIds.has(block.id)) {
      nextProgress = Math.min(100, Math.round(nextProgress + boost));
      if (nextProgress >= 100) nextStatus = 'concluido';
      else if (nextStatus === 'atencao' && nextProgress >= 85) nextStatus = 'em_andamento';
      else if (nextStatus === 'critico' && nextProgress >= 68) nextStatus = 'atencao';
    }

    if (
      toggledSubtasks &&
      block.subtasks.length > 0 &&
      block.subtasks.some((st) => st.id in toggledSubtasks)
    ) {
      const doneCount = block.subtasks.reduce(
        (acc, st) => acc + ((toggledSubtasks[st.id] ?? st.done) ? 1 : 0),
        0
      );
      nextProgress = Math.round((doneCount / block.subtasks.length) * 100);
      if (nextProgress >= 100) nextStatus = 'concluido';
      else if (nextProgress >= 67) nextStatus = 'em_andamento';
      else if (nextProgress >= 34) nextStatus = 'atencao';
      else nextStatus = 'critico';
    }

    if (nextProgress === block.progress && nextStatus === block.status) {
      return block;
    }

    return {
      ...block,
      progress: nextProgress,
      status: nextStatus,
    };
  });
}

function createInitialPersistedState(): PersistedStoreSlice {
  return {
    cutoffId: '2026-10',
    mapa3dMonthIndex: DEFAULT_TIMELINE_INDEX,
    mapa3dSelectedBlockId: DEFAULT_SELECTED_BLOCK_ID,
    selectedScenarioId: 'C4',
    approvedScenarioId: null,
    simulatorPremises: { ...DEFAULT_SIMULATOR_PREMISES },
    alerts: INITIAL_ALERTS,
    publications: INITIAL_PUBLICATIONS,
    overridesByCutoff: {},
    toggledSubtasks: {},
    mitigatedRadarIds: {},
    riskStatuses: {},
    customRisks: [],
    krValues: {},
    ganttSubtasks: {},
    crashReductions: {},
    crashDelayCostPerDay: DEFAULT_CRASH_DELAY_COST_DU,
  };
}

function loadPersistedState(): PersistedStoreSlice {
  const fallback = createInitialPersistedState();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(STORE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedStoreSlice>;
    if (!parsed || typeof parsed !== 'object') return fallback;

    const validCutoffs: CutoffId[] = ['2026-10', '2026-09', '2026-08', '2026-07'];
    const cutoffId =
      parsed.cutoffId && validCutoffs.includes(parsed.cutoffId)
        ? parsed.cutoffId
        : fallback.cutoffId;

    const validScenarios: ScenarioId[] = [
      'base',
      'aceleracao',
      'escopo',
      'revisao',
      'C1',
      'C2',
      'C3',
      'C4',
      'C5',
      'C6',
    ];
    const selectedScenarioId =
      parsed.selectedScenarioId && validScenarios.includes(parsed.selectedScenarioId)
        ? parsed.selectedScenarioId
        : fallback.selectedScenarioId;

    const approvedScenarioId =
      parsed.approvedScenarioId && validScenarios.includes(parsed.approvedScenarioId)
        ? parsed.approvedScenarioId
        : null;

    const sp = parsed.simulatorPremises;
    const simulatorPremises: SimulatorPremises =
      sp &&
      typeof sp.adocao === 'number' &&
      typeof sp.capacidade === 'number' &&
      typeof sp.reserva === 'number'
        ? {
            adocao: clamp(sp.adocao, 40, 100),
            capacidade: clamp(sp.capacidade, 50, 100),
            reserva: clamp(sp.reserva, 5, 30),
          }
        : fallback.simulatorPremises;

    const monthIdx =
      typeof parsed.mapa3dMonthIndex === 'number'
        ? clamp(Math.round(parsed.mapa3dMonthIndex), 0, TIMELINE_MONTHS.length - 1)
        : fallback.mapa3dMonthIndex;

    return {
      cutoffId,
      mapa3dMonthIndex: monthIdx,
      mapa3dSelectedBlockId:
        typeof parsed.mapa3dSelectedBlockId === 'string' &&
        parsed.mapa3dSelectedBlockId.length > 0
          ? parsed.mapa3dSelectedBlockId
          : fallback.mapa3dSelectedBlockId,
      selectedScenarioId,
      approvedScenarioId,
      simulatorPremises,
      alerts:
        Array.isArray(parsed.alerts) && parsed.alerts.length > 0
          ? parsed.alerts
          : fallback.alerts,
      publications:
        Array.isArray(parsed.publications) && parsed.publications.length > 0
          ? parsed.publications
          : fallback.publications,
      overridesByCutoff:
        parsed.overridesByCutoff && typeof parsed.overridesByCutoff === 'object'
          ? parsed.overridesByCutoff
          : {},
      toggledSubtasks:
        parsed.toggledSubtasks && typeof parsed.toggledSubtasks === 'object'
          ? parsed.toggledSubtasks
          : {},
      mitigatedRadarIds:
        parsed.mitigatedRadarIds && typeof parsed.mitigatedRadarIds === 'object'
          ? parsed.mitigatedRadarIds
          : {},
      riskStatuses: {},
      customRisks: [],
      krValues: {},
      ganttSubtasks:
        parsed.ganttSubtasks && typeof parsed.ganttSubtasks === 'object'
          ? parsed.ganttSubtasks
          : {},
      crashReductions: (() => {
        const clean: Record<string, number> = {};
        if (parsed.crashReductions && typeof parsed.crashReductions === 'object') {
          for (const [k, v] of Object.entries(parsed.crashReductions)) {
            if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
              clean[k] = Math.round(v);
            }
          }
        }
        return clean;
      })(),
      crashDelayCostPerDay:
        typeof parsed.crashDelayCostPerDay === 'number' &&
        Number.isFinite(parsed.crashDelayCostPerDay) &&
        parsed.crashDelayCostPerDay >= 0
          ? Math.round(clamp(parsed.crashDelayCostPerDay, 0, 500000))
          : DEFAULT_CRASH_DELAY_COST_DU,
    };
  } catch {
    return fallback;
  }
}

export interface LumeStoreContextValue {
  cutoffId: CutoffId;
  panel: WorkspacePanelSnapshot;
  snapshot: CutoffSnapshot;
  lastSyncLabel: string;
  scenarios: ScenarioItem[];
  selectedScenarioId: ScenarioId;
  approvedScenarioId: ScenarioId | null;
  simulatorPremises: SimulatorPremises;
  activeSimulation: ScenarioSimulationResult;
  alerts: ExecutiveAlert[];
  publications: PublicationRecord[];
  mapa3dMonthIndex: number;
  mapa3dBlocks: ResolvedMap3DBlock[];
  mapa3dCounts: ReturnType<typeof getStatusCounts>;
  mapa3dSelectedBlockId: string;
  toggledSubtasks: Record<string, boolean>;
  mitigatedRadarIds: Record<string, boolean>;
  riskStatuses: Record<string, RiskTrackingStatus>;
  customRisks: ProjectRiskItem[];
  risks: ProjectRiskItem[];
  objectives: StrategicObjective[];
  krValues: Record<string, number>;
  ganttSubtasks: Record<string, boolean>;
  pertAtividades: PertAtividadeInput[];
  pertBaseline: PertCpmNetworkResult;
  pertSimulated: PertCpmNetworkResult;
  livePertAtividades: PertAtividadeInput[];
  liveSyncSource: string | null;
  crashReductions: Record<string, number>;
  crashDelayCostPerDay: number;

  refreshWorkspace: () => Promise<void>;
  getDashboardData: (cutoff?: CutoffId) => Promise<WorkspacePanelSnapshot>;
  updateProjectSnapshot: (
    payload: ProjectSnapshotUpload
  ) => Promise<WorkspacePanelSnapshot>;
  approveScenario: (scenarioId: ScenarioId) => Promise<ScenarioItem>;
  getMapa3DState: (monthIndex?: number) => Promise<Mapa3DStateResult>;
  getPreditivaData: () => Promise<PreditivaPayload>;
  askLumiAssistant: (
    prompt: string,
    screenContext?: { activeSection?: NavSectionId },
    onNavigateSection?: (section: NavSectionId) => void
  ) => Promise<LumiAskResult>;

  setCutoffId: (cutoffId: CutoffId) => void;
  selectScenario: (scenarioId: ScenarioId) => void;
  updateSimulatorPremises: (patch: Partial<SimulatorPremises>) => void;
  resetSimulatorPremises: () => void;
  setMapa3DMonthIndex: (monthIndex: number) => void;
  setMapa3DSelectedBlockId: (blockId: string) => void;
  toggleBlockSubtask: (subtaskId: string, defaultDone: boolean) => void;
  toggleRadarMitigated: (radarId: string) => void;
  updateRiskStatus: (riskId: string, status: RiskTrackingStatus) => void;
  addProjectRisk: (
    payload: Omit<ProjectRiskItem, 'id' | 'code'>
  ) => ProjectRiskItem;
  updateKeyResultValue: (krId: string, nextValue: number) => void;
  toggleGanttSubtask: (subtaskId: string, defaultDone: boolean) => void;
  setCrashReduction: (atividadeId: string, reducaoDu: number) => void;
  adjustCrashReduction: (atividadeId: string, delta: number) => void;
  setCrashDelayCostPerDay: (value: number) => void;
  resetCrashSimulation: () => void;
  markAllAlertsRead: () => void;
  toggleAlertRead: (alertId: string) => void;
}

const LumeStoreContext = createContext<LumeStoreContextValue | null>(null);

export function LumeStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedStoreSlice>(() =>
    createInitialPersistedState()
  );
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [liveSyncSource, setLiveSyncSource] = useState<string | null>(null);
  const [livePayload, setLivePayload] = useState<WorkspaceApiPayload | null>(null);
  const [liveScenarios, setLiveScenarios] = useState<ScenarioItem[]>(WORKSPACE_SCENARIOS);
  const [liveRisks, setLiveRisks] = useState<ProjectRiskItem[]>(INITIAL_PROJECT_RISKS);
  const [liveObjectives, setLiveObjectives] = useState<StrategicObjective[]>(
    INITIAL_OKR_OBJECTIVES
  );
  const [livePertAtividades, setLivePertAtividades] =
    useState<PertAtividadeInput[]>(PERT_CPM_ATIVIDADES);
  const lumiConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    setState(loadPersistedState());
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      window.localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state, storageLoaded]);

  const applyWorkspacePayload = useCallback((payload: WorkspaceApiPayload) => {
    setLivePayload(payload);
    setLiveSyncSource('Supabase ao vivo');

    if (Array.isArray(payload.cenarios) && payload.cenarios.length > 0) {
      const mappedScenarios = mapLiveScenarios(payload.cenarios);
      setLiveScenarios(mappedScenarios);
      setState((prev) => {
        const hasSelected = mappedScenarios.some((s) => s.id === prev.selectedScenarioId);
        const approvedFromDb = payload.cenarioAprovado?.id_cenario as ScenarioId | undefined;
        return {
          ...prev,
          selectedScenarioId: hasSelected
            ? prev.selectedScenarioId
            : (mappedScenarios.find((s) => s.recommended)?.id ?? mappedScenarios[0].id),
          approvedScenarioId:
            approvedFromDb && mappedScenarios.some((s) => s.id === approvedFromDb)
              ? approvedFromDb
              : prev.approvedScenarioId,
        };
      });
    }

    if (Array.isArray(payload.riscos) && payload.riscos.length > 0) {
      setLiveRisks(mapLiveRisks(payload.riscos));
    }

    if (Array.isArray(payload.okrs) && payload.okrs.length > 0) {
      setLiveObjectives(mapLiveOkrs(payload.okrs));
    }

    const delayCostRaw = payload.cenarios?.[0]?.custo_atraso_por_du_rs;
    const delayCostNum =
      typeof delayCostRaw === 'number'
        ? delayCostRaw
        : typeof delayCostRaw === 'string'
          ? Number(delayCostRaw)
          : NaN;
    if (Number.isFinite(delayCostNum) && delayCostNum > 0) {
      setState((prev) => ({
        ...prev,
        crashDelayCostPerDay: Math.round(delayCostNum),
      }));
    }

    const atvRows = Array.isArray(payload.atividades) ? payload.atividades : [];
    if (atvRows.length > 0) {
      const atvById = new Map<string, Record<string, unknown>>();
      for (const row of atvRows) {
        const id = String(row.id_atividade ?? '').trim();
        if (id) atvById.set(id.toUpperCase(), row);
      }

      setLivePertAtividades((prev) =>
        prev.map((item) => {
          const row = atvById.get(item.id_atividade.toUpperCase());
          if (!row) return item;
          const opt = Number(row.duracao_otimista_du);
          const mp = Number(row.duracao_mais_provavel_du);
          const pess = Number(row.duracao_pessimista_du);
          const crashDur = Number(row.duracao_crash_du);
          const costN = Number(row.custo_normal_rs ?? row.valor_orcado_rs);
          const costC = Number(row.custo_crash_rs ?? row.custo_acelerado_rs);
          return {
            ...item,
            nome_atividade:
              typeof row.nome_atividade === 'string' && row.nome_atividade.trim()
                ? row.nome_atividade.trim()
                : item.nome_atividade,
            duracao_otimista_du:
              Number.isFinite(opt) && opt > 0 ? opt : item.duracao_otimista_du,
            duracao_mais_provavel_du:
              Number.isFinite(mp) && mp > 0 ? mp : item.duracao_mais_provavel_du,
            duracao_pessimista_du:
              Number.isFinite(pess) && pess > 0 ? pess : item.duracao_pessimista_du,
            duracao_crash_du:
              Number.isFinite(crashDur) && crashDur > 0 ? crashDur : item.duracao_crash_du,
            custo_normal: Number.isFinite(costN) && costN > 0 ? costN : item.custo_normal,
            custo_crash: Number.isFinite(costC) && costC > 0 ? costC : item.custo_crash,
          };
        })
      );
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace', { cache: 'no-store' });
      if (!res.ok) return;
      const payload = (await res.json()) as WorkspaceApiPayload;
      applyWorkspacePayload(payload);
    } catch {
      // Fallback silencioso para dados locais se offline
    }
  }, [applyWorkspacePayload]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  const activeOverride = state.overridesByCutoff[state.cutoffId];

  const panel = useMemo(
    () => buildPanelSnapshot(state.cutoffId, activeOverride, livePayload),
    [state.cutoffId, activeOverride, livePayload]
  );

  const snapshot = useMemo(
    () => buildCutoffSnapshot(state.cutoffId, panel),
    [state.cutoffId, panel]
  );

  const selectedScenario = useMemo(
    () =>
      liveScenarios.find((s) => s.id === state.selectedScenarioId) ??
      liveScenarios[0],
    [liveScenarios, state.selectedScenarioId]
  );

  const activeSimulation = useMemo(
    () => computeScenarioSimulation(selectedScenario, state.simulatorPremises),
    [selectedScenario, state.simulatorPremises]
  );

  const mapa3dBlocks = useMemo(
    () =>
      buildMapa3DBlocks(
        state.mapa3dMonthIndex,
        state.overridesByCutoff[state.cutoffId],
        state.toggledSubtasks
      ),
    [
      state.mapa3dMonthIndex,
      state.overridesByCutoff,
      state.cutoffId,
      state.toggledSubtasks,
    ]
  );

  const mapa3dCounts = useMemo(
    () => getStatusCounts(mapa3dBlocks),
    [mapa3dBlocks]
  );

  const pertBaseline = useMemo(
    () => calcularRedePertCpm(livePertAtividades),
    [livePertAtividades]
  );

  const pertSimulated = useMemo(
    () => calcularRedePertCpm(livePertAtividades, state.crashReductions),
    [livePertAtividades, state.crashReductions]
  );

  const setCutoffId = useCallback((nextCutoff: CutoffId) => {
    setState((prev) => ({
      ...prev,
      cutoffId: nextCutoff,
      mapa3dMonthIndex: CUTOFF_TO_TIMELINE_INDEX[nextCutoff],
    }));
  }, []);

  const setMapa3DMonthIndex = useCallback((nextMonthIndex: number) => {
    const safeIdx = clamp(Math.round(nextMonthIndex), 0, TIMELINE_MONTHS.length - 1);
    const matchingCutoff = TIMELINE_INDEX_TO_CUTOFF[safeIdx];
    setState((prev) => ({
      ...prev,
      mapa3dMonthIndex: safeIdx,
      cutoffId: matchingCutoff ?? prev.cutoffId,
    }));
  }, []);

  const setMapa3DSelectedBlockId = useCallback((blockId: string) => {
    setState((prev) => ({
      ...prev,
      mapa3dSelectedBlockId: blockId,
    }));
  }, []);

  const selectScenario = useCallback((scenarioId: ScenarioId) => {
    setState((prev) => ({
      ...prev,
      selectedScenarioId: scenarioId,
    }));
  }, []);

  const updateSimulatorPremises = useCallback(
    (patch: Partial<SimulatorPremises>) => {
      setState((prev) => ({
        ...prev,
        simulatorPremises: {
          adocao:
            patch.adocao !== undefined
              ? clamp(Math.round(patch.adocao), 40, 100)
              : prev.simulatorPremises.adocao,
          capacidade:
            patch.capacidade !== undefined
              ? clamp(Math.round(patch.capacidade), 50, 100)
              : prev.simulatorPremises.capacidade,
          reserva:
            patch.reserva !== undefined
              ? clamp(Math.round(patch.reserva), 5, 30)
              : prev.simulatorPremises.reserva,
        },
      }));
    },
    []
  );

  const resetSimulatorPremises = useCallback(() => {
    setState((prev) => ({
      ...prev,
      simulatorPremises: { ...DEFAULT_SIMULATOR_PREMISES },
    }));
  }, []);

  const toggleBlockSubtask = useCallback(
    (subtaskId: string, defaultDone: boolean) => {
      setState((prev) => {
        const current = prev.toggledSubtasks[subtaskId] ?? defaultDone;
        return {
          ...prev,
          toggledSubtasks: {
            ...prev.toggledSubtasks,
            [subtaskId]: !current,
          },
        };
      });
    },
    []
  );

  const toggleRadarMitigated = useCallback((radarId: string) => {
    setState((prev) => ({
      ...prev,
      mitigatedRadarIds: {
        ...prev.mitigatedRadarIds,
        [radarId]: !prev.mitigatedRadarIds[radarId],
      },
    }));
  }, []);

  const updateRiskStatus = useCallback(
    (riskId: string, status: RiskTrackingStatus) => {
      setState((prev) => ({
        ...prev,
        riskStatuses: {
          ...prev.riskStatuses,
          [riskId]: status,
        },
      }));
      void fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_risk_status',
          id_risco: riskId,
          status: mapTrackingToDbStatus(status),
        }),
      }).then((r) => {
        if (r.ok) void refreshWorkspace();
      }).catch(() => undefined);
    },
    [refreshWorkspace]
  );

  const addProjectRisk = useCallback(
    (payload: Omit<ProjectRiskItem, 'id' | 'code'>): ProjectRiskItem => {
      let created!: ProjectRiskItem;
      setState((prev) => {
        const nextNum = liveRisks.length + prev.customRisks.length + 1;
        const code = `R${String(nextNum).padStart(2, '0')}`;
        created = {
          ...payload,
          id: code,
          code,
        };
        return {
          ...prev,
          customRisks: [created, ...prev.customRisks],
        };
      });

      const frenteMap: Record<IslandId, string> = {
        plataforma: 'AGIL',
        infraestrutura: 'PREDITIVA',
        operacao: 'PROJETO',
        conteudo: 'PROJETO',
      };
      const probPct = [10, 22, 35, 58, 82][payload.probability - 1] ?? 40;
      const impCusto = [4000, 9000, 18000, 32000, 65000][payload.impact - 1] ?? 18000;

      void fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_risk',
          descricao: payload.title,
          frente: frenteMap[payload.frontId] ?? 'PROJETO',
          probabilidade_pct: probPct,
          impacto_custo_rs: impCusto,
        }),
      }).then((r) => {
        if (r.ok) void refreshWorkspace();
      }).catch(() => undefined);

      return created;
    },
    [liveRisks.length, refreshWorkspace]
  );

  const updateKeyResultValue = useCallback(
    (krId: string, nextValue: number) => {
      setState((prev) => ({
        ...prev,
        krValues: {
          ...prev.krValues,
          [krId]: nextValue,
        },
      }));
      void fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_kr',
          id_resultado_chave: krId,
          valor: nextValue,
        }),
      }).then((r) => {
        if (r.ok) void refreshWorkspace();
      }).catch(() => undefined);
    },
    [refreshWorkspace]
  );

  const toggleGanttSubtask = useCallback(
    (subtaskId: string, defaultDone: boolean) => {
      setState((prev) => {
        const current = prev.ganttSubtasks[subtaskId] ?? defaultDone;
        return {
          ...prev,
          ganttSubtasks: {
            ...prev.ganttSubtasks,
            [subtaskId]: !current,
          },
        };
      });
    },
    []
  );

  const setCrashReduction = useCallback(
    (atividadeId: string, reducaoDu: number) => {
      const activity = livePertAtividades.find(
        (a) => a.id_atividade === atividadeId
      );
      if (!activity) return;
      const durNormal = calcularDuracaoNormalPert(activity);
      const maxRed = Math.max(0, durNormal - Math.max(1, activity.duracao_crash_du));
      const safeVal = Math.max(0, Math.min(maxRed, Math.round(reducaoDu)));

      setState((prev) => {
        const next = { ...prev.crashReductions };
        if (safeVal === 0) {
          delete next[atividadeId];
        } else {
          next[atividadeId] = safeVal;
        }
        return {
          ...prev,
          crashReductions: next,
        };
      });
    },
    [livePertAtividades]
  );

  const adjustCrashReduction = useCallback(
    (atividadeId: string, delta: number) => {
      const activity = livePertAtividades.find(
        (a) => a.id_atividade === atividadeId
      );
      if (!activity) return;
      const durNormal = calcularDuracaoNormalPert(activity);
      const maxRed = Math.max(0, durNormal - Math.max(1, activity.duracao_crash_du));

      setState((prev) => {
        const current = prev.crashReductions[atividadeId] ?? 0;
        const safeVal = Math.max(0, Math.min(maxRed, Math.round(current + delta)));
        const next = { ...prev.crashReductions };
        if (safeVal === 0) {
          delete next[atividadeId];
        } else {
          next[atividadeId] = safeVal;
        }
        return {
          ...prev,
          crashReductions: next,
        };
      });
    },
    [livePertAtividades]
  );

  const setCrashDelayCostPerDay = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const safeVal = Math.round(clamp(value, 0, 500000));
    setState((prev) => ({
      ...prev,
      crashDelayCostPerDay: safeVal,
    }));
  }, []);

  const resetCrashSimulation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      crashReductions: {},
    }));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => ({ ...a, read: true })),
    }));
  }, []);

  const toggleAlertRead = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === alertId ? { ...a, read: !a.read } : a
      ),
    }));
  }, []);

  const getDashboardData = useCallback(
    async (targetCutoff?: CutoffId): Promise<WorkspacePanelSnapshot> => {
      const cid = targetCutoff ?? state.cutoffId;
      return buildPanelSnapshot(cid, state.overridesByCutoff[cid], livePayload);
    },
    [state.cutoffId, state.overridesByCutoff, livePayload]
  );

  const updateProjectSnapshot = useCallback(
    async (payload: ProjectSnapshotUpload): Promise<WorkspacePanelSnapshot> => {
      const nowTime = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const updatedLabel = `Publicado hoje às ${nowTime}`;
      const basePanel = WORKSPACE_PANEL_BY_CUTOFF[payload.cutoffId];

      let nextOverride!: SnapshotOverride;

      setState((prev) => {
        const existing = prev.overridesByCutoff[payload.cutoffId];
        const avancoInc = payload.avancoDeltaPct ?? 1.4;
        const orcamentoInc = payload.orcamentoDeltaPct ?? 0.8;
        const entregasInc = payload.entregasBonus ?? 1;
        const mapBoostInc = payload.mapa3dProgressBoost ?? 4;

        nextOverride = {
          avancoDeltaPct: Number(
            clamp((existing?.avancoDeltaPct ?? 0) + avancoInc, -15, 18).toFixed(1)
          ),
          orcamentoDeltaPct: Number(
            clamp((existing?.orcamentoDeltaPct ?? 0) + orcamentoInc, -10, 15).toFixed(1)
          ),
          entregasBonus: Math.min(4, (existing?.entregasBonus ?? 0) + entregasInc),
          riscosResolvidosDelta: Math.min(
            2,
            (existing?.riscosResolvidosDelta ?? 0) + 1
          ),
          mapa3dProgressBoost: Math.min(
            24,
            (existing?.mapa3dProgressBoost ?? 0) + mapBoostInc
          ),
          updatedAt: updatedLabel,
          sourceFileName: payload.fileName,
        };

        const newPub: PublicationRecord = {
          id: `pub-${Date.now()}`,
          title: `Boletim ${basePanel.fullLabel}`,
          fileName: payload.fileName,
          publishedAt: updatedLabel,
        };

        return {
          ...prev,
          overridesByCutoff: {
            ...prev.overridesByCutoff,
            [payload.cutoffId]: nextOverride,
          },
          publications: [newPub, ...prev.publications],
        };
      });

      return buildPanelSnapshot(payload.cutoffId, nextOverride, livePayload);
    },
    [livePayload]
  );

  const approveScenario = useCallback(
    async (scenarioId: ScenarioId): Promise<ScenarioItem> => {
      const found =
        liveScenarios.find((s) => s.id === scenarioId) ?? liveScenarios[0];
      setState((prev) => ({
        ...prev,
        selectedScenarioId: found.id,
        approvedScenarioId: found.id,
      }));
      try {
        await fetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve_scenario',
            id_cenario: found.id,
            nome_cenario: found.name,
          }),
        });
      } catch {
        // Persistido em estado local caso API esteja offline
      }
      return found;
    },
    [liveScenarios]
  );

  const getMapa3DState = useCallback(
    async (targetMonthIdx?: number): Promise<Mapa3DStateResult> => {
      const idx = targetMonthIdx ?? state.mapa3dMonthIndex;
      const blocks = buildMapa3DBlocks(
        idx,
        state.overridesByCutoff[state.cutoffId],
        state.toggledSubtasks
      );
      return {
        monthIndex: idx,
        monthLabel: TIMELINE_MONTHS[idx].fullLabel,
        blocks,
        counts: getStatusCounts(blocks),
        selectedBlockId: state.mapa3dSelectedBlockId,
      };
    },
    [
      state.mapa3dMonthIndex,
      state.overridesByCutoff,
      state.cutoffId,
      state.mapa3dSelectedBlockId,
      state.toggledSubtasks,
    ]
  );

  const getPreditivaData = useCallback(async (): Promise<PreditivaPayload> => {
    return {
      source: liveSyncSource ? 'api' : 'local-fallback',
      updatedAt: liveSyncSource ? `${panel.updatedAt} · ${liveSyncSource}` : panel.updatedAt,
      custoAtrasoPadraoDu: state.crashDelayCostPerDay,
      atividades: livePertAtividades,
      redeBaseline: pertBaseline,
    };
  }, [liveSyncSource, panel.updatedAt, state.crashDelayCostPerDay, livePertAtividades, pertBaseline]);

  const askLumiAssistant = useCallback(
    async (
      prompt: string,
      screenCtx?: { activeSection?: NavSectionId },
      onNavigateSection?: (section: NavSectionId) => void
    ): Promise<LumiAskResult> => {
      const selectedBlock =
        mapa3dBlocks.find((b) => b.id === state.mapa3dSelectedBlockId) ?? mapa3dBlocks[0];

      const mergedScreenContext = {
        abaAtiva: screenCtx?.activeSection ?? 'painel',
        fonteDados: liveSyncSource ?? 'Local fallback',
        kpisPainel: panel.kpis.map((k) => ({
          titulo: k.title,
          valor: k.value,
          referencia: k.badgeText,
          nota: k.insight,
        })),
        curvaS: panel.curvaS,
        etapas: panel.etapas,
        sprintsRecentes: panel.fluxoEntregas,
        orcamento: panel.orcamento,
        cenarioSelecionado: {
          id: selectedScenario.id,
          nome: selectedScenario.name,
          retornoBase: selectedScenario.retornoLabel,
          retornoSimulado: activeSimulation.projectedLabel,
          statusSimulacao: activeSimulation.status,
        },
        cenarioAprovado: state.approvedScenarioId,
        premissasSimulador: state.simulatorPremises,
        cronogramaPert: (() => {
          const custoCrashTotalRs = pertSimulated.atividades.reduce(
            (acc, a) => acc + a.reducao_aplicada_du * a.cost_slope,
            0
          );
          const diasEconomizados =
            pertBaseline.prazo_total_du - pertSimulated.prazo_total_du;
          return {
            baselineDuracaoDu: pertBaseline.prazo_total_du,
            simuladoDuracaoDu: pertSimulated.prazo_total_du,
            diasEconomizados,
            caminhoCritico: pertSimulated.atividades
              .filter((a) => a.e_critica)
              .map((a) => a.id_atividade),
            custoCrashTotalRs: Math.round(custoCrashTotalRs),
            economiaLiquidaRs: Math.round(
              diasEconomizados * state.crashDelayCostPerDay - custoCrashTotalRs
            ),
            reducoesAtivas: state.crashReductions,
          };
        })(),
        mapa3d: {
          mes: TIMELINE_MONTHS[state.mapa3dMonthIndex].fullLabel,
          contagens: mapa3dCounts,
          blocoSelecionado: {
            id: selectedBlock.id,
            nome: selectedBlock.name,
            progresso: selectedBlock.progress,
            status: selectedBlock.status,
          },
        },
        riscosResumo: liveRisks.slice(0, 8).map((r) => ({
          codigo: r.code,
          titulo: r.title,
          prob: r.probability,
          imp: r.impact,
          status: state.riskStatuses[r.id] ?? r.defaultStatus,
        })),
        okrsResumo: liveObjectives.flatMap((o) =>
          o.keyResults.map((kr) => ({
            id: kr.id,
            titulo: kr.title,
            atual: state.krValues[kr.id] ?? kr.currentValue,
            meta: kr.targetValue,
            unidade: kr.unit,
          }))
        ),
      };

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: lumiConversationIdRef.current,
            message: prompt,
            sync: true,
            screenContext: mergedScreenContext,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            conversationId?: string;
            messages?: Array<{ content?: string }>;
            uiActions?: LumiUiAction[];
            dataMutated?: boolean;
          };

          if (data.conversationId) {
            lumiConversationIdRef.current = data.conversationId;
          }

          const uiActions = Array.isArray(data.uiActions) ? data.uiActions : [];
          for (const act of uiActions) {
            switch (act.type) {
              case 'navigate_tab':
                onNavigateSection?.(act.section);
                break;
              case 'select_scenario': {
                const match = liveScenarios.find(
                  (s) => s.id.toUpperCase() === act.scenarioId.toUpperCase()
                );
                if (match) selectScenario(match.id);
                break;
              }
              case 'approve_scenario': {
                const match = liveScenarios.find(
                  (s) => s.id.toUpperCase() === act.scenarioId.toUpperCase()
                );
                if (match) void approveScenario(match.id);
                break;
              }
              case 'update_simulator':
                updateSimulatorPremises({
                  adocao: act.adocao,
                  capacidade: act.capacidade,
                  reserva: act.reserva,
                });
                break;
              case 'apply_crashing':
                for (const [atvId, du] of Object.entries(act.reducoes)) {
                  setCrashReduction(atvId, du);
                }
                break;
              case 'reset_crashing':
                resetCrashSimulation();
                break;
              case 'focus_mapa3d_block':
                setMapa3DSelectedBlockId(act.blockId);
                onNavigateSection?.('mapa3d');
                break;
            }
          }

          const dataMutated = Boolean(data.dataMutated);
          if (dataMutated) {
            await refreshWorkspace();
          }

          const reply = Array.isArray(data.messages)
            ? data.messages
                .map((m) => (typeof m.content === 'string' ? m.content.trim() : ''))
                .filter(Boolean)
                .join('\n\n')
            : '';

          if (reply) {
            return { reply, uiActions, dataMutated };
          }
        }
      } catch {
        // Fallback local quando API /api/chat estiver indisponível
      }

      await new Promise((resolve) => window.setTimeout(resolve, 260));
      const avanco = panel.kpis[0]?.value ?? '75,2%';
      const orcamento = panel.kpis[1]?.value ?? '101,6%';
      const entregas = panel.kpis[2]?.value ?? '100 / 141';
      return {
        reply: `Panorama atual na tela (${panel.updatedAt}): avanço físico em ${avanco}, execução financeira em ${orcamento}, entregas em ${entregas} e cenário em análise ${selectedScenario.name} (${activeSimulation.projectedLabel}).`,
        uiActions: [],
        dataMutated: false,
      };
    },
    [
      mapa3dBlocks,
      state.mapa3dSelectedBlockId,
      state.approvedScenarioId,
      state.simulatorPremises,
      state.crashDelayCostPerDay,
      state.crashReductions,
      state.mapa3dMonthIndex,
      state.riskStatuses,
      state.krValues,
      liveSyncSource,
      panel,
      selectedScenario,
      activeSimulation,
      pertBaseline,
      pertSimulated,
      mapa3dCounts,
      liveRisks,
      liveObjectives,
      liveScenarios,
      selectScenario,
      approveScenario,
      updateSimulatorPremises,
      setCrashReduction,
      resetCrashSimulation,
      setMapa3DSelectedBlockId,
      refreshWorkspace,
    ]
  );

  const value = useMemo<LumeStoreContextValue>(
    () => ({
      cutoffId: state.cutoffId,
      panel,
      snapshot,
      lastSyncLabel: liveSyncSource
        ? `${panel.updatedAt} · ${liveSyncSource}`
        : panel.updatedAt,
      scenarios: liveScenarios,
      selectedScenarioId: state.selectedScenarioId,
      approvedScenarioId: state.approvedScenarioId,
      simulatorPremises: state.simulatorPremises,
      activeSimulation,
      alerts: state.alerts,
      publications: state.publications,
      mapa3dMonthIndex: state.mapa3dMonthIndex,
      mapa3dBlocks,
      mapa3dCounts,
      mapa3dSelectedBlockId: state.mapa3dSelectedBlockId,
      toggledSubtasks: state.toggledSubtasks,
      mitigatedRadarIds: state.mitigatedRadarIds,
      riskStatuses: state.riskStatuses,
      customRisks: state.customRisks,
      risks: liveRisks,
      objectives: liveObjectives,
      krValues: state.krValues,
      ganttSubtasks: state.ganttSubtasks,
      pertAtividades: livePertAtividades,
      pertBaseline,
      pertSimulated,
      livePertAtividades,
      liveSyncSource,
      crashReductions: state.crashReductions,
      crashDelayCostPerDay: state.crashDelayCostPerDay,
      refreshWorkspace,
      getDashboardData,
      updateProjectSnapshot,
      approveScenario,
      getMapa3DState,
      getPreditivaData,
      askLumiAssistant,
      setCutoffId,
      selectScenario,
      updateSimulatorPremises,
      resetSimulatorPremises,
      setMapa3DMonthIndex,
      setMapa3DSelectedBlockId,
      toggleBlockSubtask,
      toggleRadarMitigated,
      updateRiskStatus,
      addProjectRisk,
      updateKeyResultValue,
      toggleGanttSubtask,
      setCrashReduction,
      adjustCrashReduction,
      setCrashDelayCostPerDay,
      resetCrashSimulation,
      markAllAlertsRead,
      toggleAlertRead,
    }),
    [
      state.cutoffId,
      panel,
      snapshot,
      liveScenarios,
      state.selectedScenarioId,
      state.approvedScenarioId,
      state.simulatorPremises,
      activeSimulation,
      state.alerts,
      state.publications,
      state.mapa3dMonthIndex,
      mapa3dBlocks,
      mapa3dCounts,
      state.mapa3dSelectedBlockId,
      state.toggledSubtasks,
      state.mitigatedRadarIds,
      state.riskStatuses,
      state.customRisks,
      liveRisks,
      liveObjectives,
      state.krValues,
      state.ganttSubtasks,
      pertBaseline,
      pertSimulated,
      livePertAtividades,
      liveSyncSource,
      state.crashReductions,
      state.crashDelayCostPerDay,
      refreshWorkspace,
      getDashboardData,
      updateProjectSnapshot,
      approveScenario,
      getMapa3DState,
      getPreditivaData,
      askLumiAssistant,
      setCutoffId,
      selectScenario,
      updateSimulatorPremises,
      resetSimulatorPremises,
      setMapa3DMonthIndex,
      setMapa3DSelectedBlockId,
      toggleBlockSubtask,
      toggleRadarMitigated,
      updateRiskStatus,
      addProjectRisk,
      updateKeyResultValue,
      toggleGanttSubtask,
      setCrashReduction,
      adjustCrashReduction,
      setCrashDelayCostPerDay,
      resetCrashSimulation,
      markAllAlertsRead,
      toggleAlertRead,
    ]
  );

  return React.createElement(LumeStoreContext.Provider, { value }, children);
}

export function useLumeStore(): LumeStoreContextValue {
  const ctx = useContext(LumeStoreContext);
  if (!ctx) {
    throw new Error('useLumeStore must be used within LumeStoreProvider');
  }
  return ctx;
}
