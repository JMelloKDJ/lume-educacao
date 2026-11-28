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
  type ResolvedMap3DBlock,
} from '../data/mapa3dData';
import {
  INITIAL_PUBLICATIONS,
  WORKSPACE_PANEL_BY_CUTOFF,
  WORKSPACE_SCENARIOS,
  type PublicationRecord,
  type ScenarioId,
  type ScenarioItem,
  type WorkspacePanelSnapshot,
} from '../data/workspaceData';
import {
  INITIAL_PROJECT_RISKS,
  type ProjectRiskItem,
  type RiskTrackingStatus,
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

const STORE_STORAGE_KEY = 'lume-educacao-workspace-store-v1';

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

function formatPtPercent(val: number): string {
  return `${val.toFixed(1).replace('.', ',')}%`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
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

  // Subtle horizontal schedule shift driven by team capacity & school adoption
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
  override?: SnapshotOverride
): WorkspacePanelSnapshot {
  const base = WORKSPACE_PANEL_BY_CUTOFF[cutoffId];
  if (!override) return base;

  const avancoDelta = override.avancoDeltaPct;
  const orcamentoDelta = override.orcamentoDeltaPct;
  const entregasBonus = override.entregasBonus;

  const kpis = base.kpis.map((kpi) => {
    if (kpi.id === 'avanco-geral') {
      const currentVal = parseFloat(kpi.value.replace(',', '.'));
      const nextVal = clamp(currentVal + avancoDelta, 0, 99.6);
      return {
        ...kpi,
        value: formatPtPercent(nextVal),
        badgeText: `+${(4.2 + avancoDelta).toFixed(1).replace('.', ',')}% mês`,
        insight: `Atualizado via ${override.sourceFileName}`,
      };
    }
    if (kpi.id === 'orcamento') {
      const currentVal = parseFloat(kpi.value.replace(',', '.'));
      const nextVal = clamp(currentVal + orcamentoDelta, 0, 99.0);
      return {
        ...kpi,
        value: formatPtPercent(nextVal),
        insight: 'Recalculado com boletim mais recente',
      };
    }
    if (kpi.id === 'entregas-ciclo' && entregasBonus > 0) {
      const [doneStr, totalStr] = kpi.value.split('/').map((s) => s.trim());
      const done = parseInt(doneStr, 10) || 18;
      const total = parseInt(totalStr, 10) || 22;
      const nextDone = Math.min(total, done + entregasBonus);
      const pct = (nextDone / total) * 100;
      const remaining = Math.max(0, total - nextDone);
      return {
        ...kpi,
        value: `${nextDone} / ${total}`,
        badgeText: formatPtPercent(pct),
        insight:
          remaining === 0
            ? 'Todas as entregas do ciclo concluídas'
            : `${remaining} ${remaining === 1 ? 'item' : 'itens'} em revisão final`,
      };
    }
    if (kpi.id === 'riscos-ativos' && override.riscosResolvidosDelta > 0) {
      const currentCount = parseInt(kpi.value, 10) || 3;
      const nextCount = Math.max(1, currentCount - override.riscosResolvidosDelta);
      return {
        ...kpi,
        value: `${nextCount} ${nextCount === 1 ? 'alerta' : 'alertas'}`,
        insight: 'Plano de mitigação atualizado no boletim',
      };
    }
    return kpi;
  });

  const curvaS = base.curvaS.map((pt) => {
    if (pt.month === base.currentMonthShort && pt.realizado !== null) {
      return {
        ...pt,
        realizado: Number(clamp(pt.realizado + avancoDelta, 0, 99.6).toFixed(1)),
      };
    }
    return pt;
  });

  const etapas = base.etapas.map((et, idx) => ({
    ...et,
    realizado: Math.round(
      clamp(et.realizado + avancoDelta * (idx === 2 ? 1.2 : 0.8), 0, 100)
    ),
  }));

  const fluxoEntregas = base.fluxoEntregas.map((cycle, idx) => {
    if (cycle.destaque || idx === base.fluxoEntregas.length - 1) {
      const nextEntregue = Math.min(60, cycle.entregue + entregasBonus);
      return {
        ...cycle,
        entregue: nextEntregue,
        tendencia: nextEntregue,
      };
    }
    return cycle;
  });

  const execNext = clamp(
    Math.round(base.orcamento.executadoPct + orcamentoDelta),
    20,
    78
  );
  const resNext = Math.max(
    10,
    100 - execNext - base.orcamento.comprometidoPct
  );

  return {
    ...base,
    updatedAt: override.updatedAt,
    kpis,
    curvaS,
    etapas,
    fluxoEntregas,
    orcamento: {
      ...base.orcamento,
      executadoPct: execNext,
      reservaPct: resNext,
      monthly: base.orcamento.monthly.map((m) =>
        m.isCurrent
          ? { ...m, valorK: Math.min(395, Math.round(m.valorK + orcamentoDelta * 8)) }
          : m
      ),
    },
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
    kpis: base.kpis.map((kpi, idx) =>
      idx === 0 && panel.kpis[0]
        ? { ...kpi, value: panel.kpis[0].value, badgeText: panel.kpis[0].badgeText }
        : idx === 1 && panel.kpis[1]
          ? { ...kpi, value: panel.kpis[1].value }
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
      if (nextProgress >= 100) {
        nextStatus = 'concluido';
      } else if (nextStatus === 'atencao' && nextProgress >= 85) {
        nextStatus = 'em_andamento';
      } else if (nextStatus === 'critico' && nextProgress >= 68) {
        nextStatus = 'atencao';
      }
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
      if (nextProgress >= 100) {
        nextStatus = 'concluido';
      } else if (nextProgress >= 67) {
        nextStatus = block.status === 'atencao' ? 'atencao' : 'em_andamento';
      } else if (nextProgress >= 34) {
        nextStatus = block.status === 'critico' ? 'critico' : 'atencao';
      } else {
        nextStatus = 'critico';
      }
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
    selectedScenarioId: 'aceleracao',
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

    const validScenarios: ScenarioId[] = ['base', 'aceleracao', 'escopo', 'revisao'];
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
      alerts: Array.isArray(parsed.alerts) && parsed.alerts.length > 0
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
      riskStatuses: (() => {
        const clean: Record<string, RiskTrackingStatus> = {};
        if (parsed.riskStatuses && typeof parsed.riskStatuses === 'object') {
          const validTracking: RiskTrackingStatus[] = [
            'ativo',
            'em_mitigacao',
            'mitigado',
          ];
          for (const [k, v] of Object.entries(parsed.riskStatuses)) {
            if (validTracking.includes(v as RiskTrackingStatus)) {
              clean[k] = v as RiskTrackingStatus;
            }
          }
        }
        return clean;
      })(),
      customRisks: Array.isArray(parsed.customRisks) ? parsed.customRisks : [],
      krValues:
        parsed.krValues && typeof parsed.krValues === 'object'
          ? parsed.krValues
          : {},
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
  // Reactive read state
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
  krValues: Record<string, number>;
  ganttSubtasks: Record<string, boolean>;
  pertAtividades: PertAtividadeInput[];
  pertBaseline: PertCpmNetworkResult;
  pertSimulated: PertCpmNetworkResult;
  crashReductions: Record<string, number>;
  crashDelayCostPerDay: number;

  // Typed async repository-ready API (future Supabase integration boundary)
  getDashboardData: (cutoff?: CutoffId) => Promise<WorkspacePanelSnapshot>;
  updateProjectSnapshot: (
    payload: ProjectSnapshotUpload
  ) => Promise<WorkspacePanelSnapshot>;
  approveScenario: (scenarioId: ScenarioId) => Promise<ScenarioItem>;
  getMapa3DState: (monthIndex?: number) => Promise<Mapa3DStateResult>;
  getPreditivaData: () => Promise<PreditivaPayload>;
  askLumiAssistant: (prompt: string) => Promise<string>;

  // Direct UI state mutators
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
  const [livePertAtividades, setLivePertAtividades] =
    useState<PertAtividadeInput[]>(PERT_CPM_ATIVIDADES);
  const lumiConversationIdRef = useRef<string | null>(null);

  // Hydrate persisted workspace state on client mount (SSR-safe)
  useEffect(() => {
    setState(loadPersistedState());
    setStorageLoaded(true);
  }, []);

  // Persist workspace mutations to localStorage after initial hydration
  useEffect(() => {
    if (!storageLoaded) return;
    try {
      window.localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota/privacy mode errors
    }
  }, [state, storageLoaded]);

  // Optional live hydration from Next.js /api/preditiva (Supabase vw_rede_pert_cpm)
  useEffect(() => {
    let cancelled = false;
    async function hydrateFromApi() {
      try {
        const res = await fetch('/api/preditiva', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          pert?: Array<Record<string, unknown>>;
          atividades?: Array<Record<string, unknown>>;
          orcamento?: Array<Record<string, unknown>>;
          cenarios?: Array<Record<string, unknown>>;
        };
        if (cancelled) return;

        const pertRows = Array.isArray(payload.pert) ? payload.pert : [];
        const atvRows = Array.isArray(payload.atividades) ? payload.atividades : [];
        const cenRows = Array.isArray(payload.cenarios) ? payload.cenarios : [];

        if (pertRows.length > 0) {
          setLiveSyncSource('Supabase ao vivo');
        }

        const delayCostRaw = cenRows[0]?.custo_atraso_por_du_rs;
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
                  Number.isFinite(crashDur) && crashDur > 0
                    ? crashDur
                    : item.duracao_crash_du,
                custo_normal:
                  Number.isFinite(costN) && costN > 0 ? costN : item.custo_normal,
                custo_crash:
                  Number.isFinite(costC) && costC > 0 ? costC : item.custo_crash,
              };
            })
          );
        }
      } catch {
        // Fallback silencioso para dados locais caso o ambiente esteja offline ou sem .env
      }
    }
    void hydrateFromApi();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeOverride = state.overridesByCutoff[state.cutoffId];

  const panel = useMemo(
    () => buildPanelSnapshot(state.cutoffId, activeOverride),
    [state.cutoffId, activeOverride]
  );

  const snapshot = useMemo(
    () => buildCutoffSnapshot(state.cutoffId, panel),
    [state.cutoffId, panel]
  );

  const selectedScenario = useMemo(
    () =>
      WORKSPACE_SCENARIOS.find((s) => s.id === state.selectedScenarioId) ??
      WORKSPACE_SCENARIOS[1],
    [state.selectedScenarioId]
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
    },
    []
  );

  const addProjectRisk = useCallback(
    (payload: Omit<ProjectRiskItem, 'id' | 'code'>): ProjectRiskItem => {
      let created!: ProjectRiskItem;
      setState((prev) => {
        const nextNum = INITIAL_PROJECT_RISKS.length + prev.customRisks.length + 1;
        const code = `R${String(nextNum).padStart(2, '0')}`;
        created = {
          ...payload,
          id: `rsk-custom-${Date.now()}`,
          code,
        };
        return {
          ...prev,
          customRisks: [created, ...prev.customRisks],
        };
      });
      return created;
    },
    []
  );

  const updateKeyResultValue = useCallback((krId: string, nextValue: number) => {
    setState((prev) => ({
      ...prev,
      krValues: {
        ...prev.krValues,
        [krId]: nextValue,
      },
    }));
  }, []);

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

  const setCrashReduction = useCallback((atividadeId: string, reducaoDu: number) => {
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
  }, [livePertAtividades]);

  const adjustCrashReduction = useCallback((atividadeId: string, delta: number) => {
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
  }, [livePertAtividades]);

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

  // Repository-ready async methods
  const getDashboardData = useCallback(
    async (targetCutoff?: CutoffId): Promise<WorkspacePanelSnapshot> => {
      const cid = targetCutoff ?? state.cutoffId;
      return buildPanelSnapshot(cid, state.overridesByCutoff[cid]);
    },
    [state.cutoffId, state.overridesByCutoff]
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

      return buildPanelSnapshot(payload.cutoffId, nextOverride);
    },
    []
  );

  const approveScenario = useCallback(
    async (scenarioId: ScenarioId): Promise<ScenarioItem> => {
      const found =
        WORKSPACE_SCENARIOS.find((s) => s.id === scenarioId) ??
        WORKSPACE_SCENARIOS[1];
      setState((prev) => ({
        ...prev,
        selectedScenarioId: found.id,
        approvedScenarioId: found.id,
      }));
      return found;
    },
    []
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
    try {
      const res = await fetch('/api/preditiva', { cache: 'no-store' });
      if (res.ok) {
        const payload = (await res.json()) as {
          pert?: Array<Record<string, unknown>>;
        };
        if (Array.isArray(payload.pert) && payload.pert.length > 0) {
          setLiveSyncSource('Supabase ao vivo');
          return {
            source: 'api',
            updatedAt: `${panel.updatedAt} · Supabase ao vivo`,
            custoAtrasoPadraoDu: state.crashDelayCostPerDay,
            atividades: livePertAtividades,
            redeBaseline: pertBaseline,
          };
        }
      }
    } catch {
      // Fallback para dados determinísticos locais
    }

    return {
      source: 'local-fallback',
      updatedAt: panel.updatedAt,
      custoAtrasoPadraoDu: state.crashDelayCostPerDay,
      atividades: livePertAtividades,
      redeBaseline: pertBaseline,
    };
  }, [panel.updatedAt, state.crashDelayCostPerDay, livePertAtividades, pertBaseline]);

  const askLumiAssistant = useCallback(
    async (prompt: string): Promise<string> => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: lumiConversationIdRef.current,
            message: prompt,
            sync: true,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            conversationId?: string;
            messages?: Array<{ content?: string }>;
          };
          if (data.conversationId) {
            lumiConversationIdRef.current = data.conversationId;
          }
          const reply = Array.isArray(data.messages)
            ? data.messages
                .map((m) => (typeof m.content === 'string' ? m.content.trim() : ''))
                .filter(Boolean)
                .join('\n\n')
            : '';
          if (reply) return reply;
        }
      } catch {
        // Fallback local quando API /api/chat estiver indisponível (ex: sem DATABASE_URL/GEMINI_API_KEY)
      }

      await new Promise((resolve) => window.setTimeout(resolve, 340));

      const normalized = prompt.toLowerCase();
      const avanco = panel.kpis[0]?.value ?? '78,4%';
      const orcamento = panel.kpis[1]?.value ?? '74,0%';
      const entregas = panel.kpis[2]?.value ?? '18 / 22';
      const riscos = panel.kpis[3]?.value ?? '3 alertas';

      const approvedScenario = state.approvedScenarioId
        ? WORKSPACE_SCENARIOS.find((s) => s.id === state.approvedScenarioId)
        : null;

      const selectedBlock =
        mapa3dBlocks.find((b) => b.id === state.mapa3dSelectedBlockId) ??
        mapa3dBlocks[0];
      const criticalBlocks = mapa3dBlocks.filter((b) => b.status === 'critico');

      if (
        normalized.includes('cenário') ||
        normalized.includes('simular') ||
        normalized.includes('simulador')
      ) {
        const approvalNote = approvedScenario
          ? `O cenário aprovado no momento é "${approvedScenario.name}" (${approvedScenario.prazoFinal}, retorno base ${approvedScenario.retornoLabel}).`
          : `O cenário selecionado em análise é "${selectedScenario.name}" (${selectedScenario.prazoFinal}).`;
        return `${approvalNote} Com as premissas atuais do simulador (adoção ${state.simulatorPremises.adocao}%, capacidade ${state.simulatorPremises.capacidade}% e reserva ${state.simulatorPremises.reserva}%), o retorno projetado está em ${activeSimulation.projectedLabel} (${activeSimulation.status}).`;
      }

      if (
        normalized.includes('mapa') ||
        normalized.includes('3d') ||
        normalized.includes('bloco') ||
        normalized.includes('ilha')
      ) {
        return `No Mapa 3D (${TIMELINE_MONTHS[state.mapa3dMonthIndex].fullLabel}), temos ${mapa3dCounts.concluido} blocos concluídos, ${mapa3dCounts.em_andamento} em andamento, ${mapa3dCounts.atencao} em atenção e ${mapa3dCounts.critico} críticos. O bloco selecionado é "${selectedBlock.name}" (${selectedBlock.progress}% · ${selectedBlock.islandLabel}).`;
      }

      if (
        normalized.includes('risco') ||
        normalized.includes('crítico') ||
        normalized.includes('alerta')
      ) {
        const critNames =
          criticalBlocks.length > 0
            ? criticalBlocks.map((b) => `${b.name} (${b.progress}%)`).join(' e ')
            : 'nenhum bloco crítico no mês selecionado';
        return `Em ${panel.fullLabel}, há ${riscos} no Radar de Atenção. No Mapa 3D, os pontos críticos são: ${critNames}. Recomendo priorizar o destravamento dessas frentes antes do próximo marco.`;
      }

      if (
        normalized.includes('prazo') ||
        normalized.includes('custo') ||
        normalized.includes('orçamento')
      ) {
        return `No corte de ${panel.fullLabel}, o orçamento executado está em ${orcamento} (com ${panel.orcamento.reservaPct}% de reserva livre) e o avanço físico em ${avanco}. O ciclo registra ${entregas} entregas concluídas (${panel.updatedAt}).`;
      }

      if (normalized.includes('resumo') || normalized.includes('panorama')) {
        const scenarioBit = approvedScenario
          ? ` Cenário aprovado: ${approvedScenario.name}.`
          : '';
        return `Resumo de ${panel.fullLabel}: avanço geral em ${avanco}, orçamento em ${orcamento}, entregas do ciclo em ${entregas} e ${mapa3dCounts.concluido}/28 blocos concluídos no Mapa 3D.${scenarioBit}`;
      }

      if (normalized.includes('outro')) {
        return `Pode mandar sua pergunta! Eu acompanho em tempo real os dados de ${panel.fullLabel} (${avanco} de avanço), o Simulador de Premissas (${activeSimulation.projectedLabel} · ${activeSimulation.status}) e os 28 blocos do Mapa 3D.`;
      }

      return `Consultei o estado atual de ${panel.fullLabel}: avanço geral em ${avanco}, orçamento em ${orcamento}, entregas em ${entregas} e bloco em destaque "${selectedBlock.name}" (${selectedBlock.progress}%). Quer revisar os riscos críticos ou simular um cenário?`;
    },
    [
      panel,
      state.approvedScenarioId,
      state.mapa3dSelectedBlockId,
      state.mapa3dMonthIndex,
      state.simulatorPremises,
      selectedScenario,
      activeSimulation,
      mapa3dBlocks,
      mapa3dCounts,
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
      scenarios: WORKSPACE_SCENARIOS,
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
      krValues: state.krValues,
      ganttSubtasks: state.ganttSubtasks,
      pertAtividades: livePertAtividades,
      pertBaseline,
      pertSimulated,
      livePertAtividades,
      liveSyncSource,
      crashReductions: state.crashReductions,
      crashDelayCostPerDay: state.crashDelayCostPerDay,
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
      state.krValues,
      state.ganttSubtasks,
      pertBaseline,
      pertSimulated,
      livePertAtividades,
      liveSyncSource,
      state.crashReductions,
      state.crashDelayCostPerDay,
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
