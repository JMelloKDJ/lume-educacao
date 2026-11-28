import type { IslandId } from './mapa3dData';

export type PertDisciplina = IslandId; // 'plataforma' | 'conteudo' | 'operacao' | 'infraestrutura'
export type PertTipoAtividade = 'TAREFA' | 'MARCO_AGIL';
export type PertTipoDependencia = 'TI' | 'II';

export interface PertPredecessora {
  id: string;
  tipo: PertTipoDependencia;
  defasagem_du?: number;
}

/**
 * Estrutura compatível com a tabela `atividades` e a view SQL `vw_rede_pert_cpm` do Supabase.
 */
export interface PertAtividadeInput {
  id_atividade: string;
  codigo_eap: string;
  nome_atividade: string;
  disciplina: PertDisciplina;
  tipo_atividade: PertTipoAtividade;
  duracao_otimista_du: number;
  duracao_mais_provavel_du: number;
  duracao_pessimista_du: number;
  duracao_fixa_du?: number | null;
  predecessoras: PertPredecessora[];
  duracao_crash_du: number;
  custo_normal: number;
  custo_crash: number;
}

export interface PertAtividadeCalculada extends PertAtividadeInput {
  duracao_normal_du: number;
  duracao_du: number;
  reducao_aplicada_du: number;
  max_reducao_du: number;
  cost_slope: number;
  desvio_padrao_du: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  ft: number;
  fl: number;
  e_critica: boolean;
}

export interface PertCpmNetworkResult {
  atividades: PertAtividadeCalculada[];
  prazo_total_du: number;
  total_atividades: number;
  total_criticas: number;
  desvio_padrao_critico_du: number;
}

export interface PreditivaPayload {
  source: 'local-fallback' | 'api';
  updatedAt: string;
  custoAtrasoPadraoDu: number;
  atividades: PertAtividadeInput[];
  redeBaseline: PertCpmNetworkResult;
}

export const PERT_DISCIPLINA_LABEL: Record<PertDisciplina, string> = {
  plataforma: 'Plataforma',
  conteudo: 'Conteúdo',
  operacao: 'Operação',
  infraestrutura: 'Infraestrutura',
};

export const DEFAULT_CRASH_DELAY_COST_DU = 8500;

/**
 * Rede realista de 16 atividades do programa Lume Educação distribuídas nas 4 frentes.
 * Grafo acíclico (DAG) com dependências Término-Início (TI) e Início-Início (II) com defasagem.
 */
export const PERT_CPM_ATIVIDADES: PertAtividadeInput[] = [
  {
    id_atividade: 'A01',
    codigo_eap: '4.1',
    nome_atividade: 'Arquitetura Cloud & Provisionamento Inicial',
    disciplina: 'infraestrutura',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 6,
    duracao_mais_provavel_du: 8,
    duracao_pessimista_du: 10,
    duracao_fixa_du: null,
    predecessoras: [],
    duracao_crash_du: 5,
    custo_normal: 42000,
    custo_crash: 57000,
  },
  {
    id_atividade: 'A02',
    codigo_eap: '1.1',
    nome_atividade: 'Núcleo LMS & Autenticação Institucional',
    disciplina: 'plataforma',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 10,
    duracao_mais_provavel_du: 14,
    duracao_pessimista_du: 20,
    duracao_fixa_du: null,
    predecessoras: [{ id: 'A01', tipo: 'TI' }],
    duracao_crash_du: 11,
    custo_normal: 95000,
    custo_crash: 119000,
  },
  {
    id_atividade: 'A03',
    codigo_eap: '2.1',
    nome_atividade: 'Matriz Curricular BNCC & Roteiros ENEM',
    disciplina: 'conteudo',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 8,
    duracao_mais_provavel_du: 12,
    duracao_pessimista_du: 16,
    duracao_fixa_du: null,
    predecessoras: [{ id: 'A01', tipo: 'II', defasagem_du: 2 }],
    duracao_crash_du: 9,
    custo_normal: 58000,
    custo_crash: 71500,
  },
  {
    id_atividade: 'A04',
    codigo_eap: '4.2',
    nome_atividade: 'Servidores Locais & Kit Cache Offline',
    disciplina: 'infraestrutura',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 11,
    duracao_mais_provavel_du: 15,
    duracao_pessimista_du: 22,
    duracao_fixa_du: null,
    predecessoras: [{ id: 'A01', tipo: 'TI' }],
    duracao_crash_du: 11,
    custo_normal: 110000,
    custo_crash: 137500,
  },
  {
    id_atividade: 'A05',
    codigo_eap: '1.2',
    nome_atividade: 'Motor de Simulados TRI & Correção de Redação',
    disciplina: 'plataforma',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 12,
    duracao_mais_provavel_du: 16,
    duracao_pessimista_du: 22,
    duracao_fixa_du: null,
    predecessoras: [{ id: 'A02', tipo: 'TI' }],
    duracao_crash_du: 12,
    custo_normal: 124000,
    custo_crash: 159000,
  },
  {
    id_atividade: 'A06',
    codigo_eap: '1.3',
    nome_atividade: 'Player Offline & Sincronização Incremental',
    disciplina: 'plataforma',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 10,
    duracao_mais_provavel_du: 14,
    duracao_pessimista_du: 21,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A02', tipo: 'TI' },
      { id: 'A04', tipo: 'TI' },
    ],
    duracao_crash_du: 11,
    custo_normal: 98000,
    custo_crash: 120000,
  },
  {
    id_atividade: 'A07',
    codigo_eap: '2.2',
    nome_atividade: 'Gravação & Edição do Banco de Videoaulas',
    disciplina: 'conteudo',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 16,
    duracao_mais_provavel_du: 22,
    duracao_pessimista_du: 30,
    duracao_fixa_du: null,
    predecessoras: [{ id: 'A03', tipo: 'TI' }],
    duracao_crash_du: 17,
    custo_normal: 145000,
    custo_crash: 187000,
  },
  {
    id_atividade: 'A08',
    codigo_eap: '2.3',
    nome_atividade: 'Indexação Compacta & Pacotes Baixa Banda',
    disciplina: 'conteudo',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 8,
    duracao_mais_provavel_du: 11,
    duracao_pessimista_du: 16,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A07', tipo: 'II', defasagem_du: 12 },
      { id: 'A06', tipo: 'TI' },
    ],
    duracao_crash_du: 8,
    custo_normal: 64000,
    custo_crash: 82000,
  },
  {
    id_atividade: 'A09',
    codigo_eap: '3.1',
    nome_atividade: 'Adesão de Secretarias & Termos dos Polos',
    disciplina: 'operacao',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 10,
    duracao_mais_provavel_du: 14,
    duracao_pessimista_du: 20,
    duracao_fixa_du: null,
    predecessoras: [{ id: 'A03', tipo: 'TI' }],
    duracao_crash_du: 11,
    custo_normal: 52000,
    custo_crash: 68000,
  },
  {
    id_atividade: 'A10',
    codigo_eap: '4.3',
    nome_atividade: 'Implantação de Servidores nos Polos Regionais',
    disciplina: 'infraestrutura',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 12,
    duracao_mais_provavel_du: 16,
    duracao_pessimista_du: 24,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A04', tipo: 'TI' },
      { id: 'A09', tipo: 'TI' },
    ],
    duracao_crash_du: 12,
    custo_normal: 132000,
    custo_crash: 169500,
  },
  {
    id_atividade: 'A11',
    codigo_eap: '1.4',
    nome_atividade: 'Gate M1 · Plataforma & Motor TRI Integrados',
    disciplina: 'plataforma',
    tipo_atividade: 'MARCO_AGIL',
    duracao_otimista_du: 1,
    duracao_mais_provavel_du: 1,
    duracao_pessimista_du: 1,
    duracao_fixa_du: 1,
    predecessoras: [
      { id: 'A05', tipo: 'TI' },
      { id: 'A06', tipo: 'TI' },
    ],
    duracao_crash_du: 1,
    custo_normal: 8000,
    custo_crash: 8000,
  },
  {
    id_atividade: 'A12',
    codigo_eap: '3.2',
    nome_atividade: 'Capacitação de Tutores & Coordenadores Locais',
    disciplina: 'operacao',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 9,
    duracao_mais_provavel_du: 12,
    duracao_pessimista_du: 17,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A11', tipo: 'TI' },
      { id: 'A09', tipo: 'TI' },
    ],
    duracao_crash_du: 9,
    custo_normal: 66000,
    custo_crash: 86000,
  },
  {
    id_atividade: 'A13',
    codigo_eap: '4.4',
    nome_atividade: 'Testes de Carga, Failover & Auditoria LGPD',
    disciplina: 'infraestrutura',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 7,
    duracao_mais_provavel_du: 10,
    duracao_pessimista_du: 15,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A10', tipo: 'TI' },
      { id: 'A08', tipo: 'TI' },
    ],
    duracao_crash_du: 7,
    custo_normal: 74000,
    custo_crash: 100000,
  },
  {
    id_atividade: 'A14',
    codigo_eap: '3.3',
    nome_atividade: 'Piloto Assistido em 12 Escolas Regionais',
    disciplina: 'operacao',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 10,
    duracao_mais_provavel_du: 14,
    duracao_pessimista_du: 20,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A12', tipo: 'TI' },
      { id: 'A13', tipo: 'II', defasagem_du: 4 },
    ],
    duracao_crash_du: 11,
    custo_normal: 88000,
    custo_crash: 120000,
  },
  {
    id_atividade: 'A15',
    codigo_eap: '3.4',
    nome_atividade: 'Homologação Final & Ajustes Pós-Piloto',
    disciplina: 'operacao',
    tipo_atividade: 'TAREFA',
    duracao_otimista_du: 6,
    duracao_mais_provavel_du: 9,
    duracao_pessimista_du: 14,
    duracao_fixa_du: null,
    predecessoras: [
      { id: 'A13', tipo: 'TI' },
      { id: 'A14', tipo: 'TI' },
    ],
    duracao_crash_du: 6,
    custo_normal: 62000,
    custo_crash: 98000,
  },
  {
    id_atividade: 'A16',
    codigo_eap: '3.5',
    nome_atividade: 'Go-Live Estadual · Abertura Ciclo 2027',
    disciplina: 'operacao',
    tipo_atividade: 'MARCO_AGIL',
    duracao_otimista_du: 1,
    duracao_mais_provavel_du: 1,
    duracao_pessimista_du: 1,
    duracao_fixa_du: 1,
    predecessoras: [{ id: 'A15', tipo: 'TI' }],
    duracao_crash_du: 1,
    custo_normal: 12000,
    custo_crash: 12000,
  },
];

export function calcularDuracaoNormalPert(item: PertAtividadeInput): number {
  if (item.tipo_atividade === 'MARCO_AGIL' || item.duracao_fixa_du != null) {
    return Math.max(1, Math.round(item.duracao_fixa_du ?? item.duracao_mais_provavel_du));
  }
  return Math.max(
    1,
    Math.ceil(
      (item.duracao_otimista_du +
        4 * item.duracao_mais_provavel_du +
        item.duracao_pessimista_du) /
        6
    )
  );
}

export function calcularDesvioPadraoPert(item: PertAtividadeInput): number {
  if (item.tipo_atividade === 'MARCO_AGIL' || item.duracao_fixa_du != null) {
    return 0;
  }
  return Number(
    (Math.max(0, item.duracao_pessimista_du - item.duracao_otimista_du) / 6).toFixed(2)
  );
}

/**
 * Ordenação topológica estável (algoritmo de Kahn) preservando a ordem original em empates.
 */
function topologicalOrder(atividades: PertAtividadeInput[]): PertAtividadeInput[] {
  const byId = new Map<string, PertAtividadeInput>();
  const indexMap = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  atividades.forEach((a, idx) => {
    byId.set(a.id_atividade, a);
    indexMap.set(a.id_atividade, idx);
    inDegree.set(a.id_atividade, 0);
    dependents.set(a.id_atividade, []);
  });

  for (const a of atividades) {
    for (const pred of a.predecessoras) {
      if (!byId.has(pred.id)) continue;
      inDegree.set(a.id_atividade, (inDegree.get(a.id_atividade) ?? 0) + 1);
      dependents.get(pred.id)!.push(a.id_atividade);
    }
  }

  const queue: string[] = atividades
    .filter((a) => (inDegree.get(a.id_atividade) ?? 0) === 0)
    .map((a) => a.id_atividade);

  const ordered: PertAtividadeInput[] = [];
  while (queue.length > 0) {
    queue.sort((a, b) => (indexMap.get(a) ?? 0) - (indexMap.get(b) ?? 0));
    const currentId = queue.shift()!;
    const current = byId.get(currentId);
    if (current) ordered.push(current);

    for (const nextId of dependents.get(currentId) ?? []) {
      const nextDeg = (inDegree.get(nextId) ?? 1) - 1;
      inDegree.set(nextId, nextDeg);
      if (nextDeg === 0) {
        queue.push(nextId);
      }
    }
  }

  // Safety fallback if any cycle ever existed
  if (ordered.length < atividades.length) {
    for (const a of atividades) {
      if (!ordered.some((o) => o.id_atividade === a.id_atividade)) {
        ordered.push(a);
      }
    }
  }

  return ordered;
}

/**
 * Motor determinístico PERT/CPM reproduzindo a view SQL `vw_rede_pert_cpm`.
 * Aceita opcionalmente um mapa de reduções (Crashing) em dias úteis por `id_atividade`.
 */
export function calcularRedePertCpm(
  atividades: PertAtividadeInput[],
  reducoesCrash: Record<string, number> = {}
): PertCpmNetworkResult {
  if (atividades.length === 0) {
    return {
      atividades: [],
      prazo_total_du: 0,
      total_atividades: 0,
      total_criticas: 0,
      desvio_padrao_critico_du: 0,
    };
  }

  const ordered = topologicalOrder(atividades);

  // Durações e metadados de Crashing
  const durNormalMap = new Map<string, number>();
  const durEfetivaMap = new Map<string, number>();
  const reducaoMap = new Map<string, number>();
  const maxReducaoMap = new Map<string, number>();
  const slopeMap = new Map<string, number>();
  const sigmaMap = new Map<string, number>();

  for (const item of ordered) {
    const durNormal = calcularDuracaoNormalPert(item);
    const maxRed = Math.max(0, durNormal - Math.max(1, item.duracao_crash_du));
    const rawRed = Math.round(reducoesCrash[item.id_atividade] ?? 0);
    const reducao = Math.max(0, Math.min(maxRed, rawRed));
    const durEfetiva = Math.max(1, durNormal - reducao);
    const slope =
      maxRed > 0
        ? Math.round((item.custo_crash - item.custo_normal) / maxRed)
        : 0;

    durNormalMap.set(item.id_atividade, durNormal);
    durEfetivaMap.set(item.id_atividade, durEfetiva);
    reducaoMap.set(item.id_atividade, reducao);
    maxReducaoMap.set(item.id_atividade, maxRed);
    slopeMap.set(item.id_atividade, slope);
    sigmaMap.set(item.id_atividade, calcularDesvioPadraoPert(item));
  }

  // Passo de ida (Forward Pass)
  const esMap = new Map<string, number>();
  const efMap = new Map<string, number>();

  for (const item of ordered) {
    const dur = durEfetivaMap.get(item.id_atividade) ?? 1;
    const validPreds = item.predecessoras.filter((p) => efMap.has(p.id));

    let es = 1;
    if (validPreds.length > 0) {
      const candidates = validPreds.map((pred) => {
        const lag = pred.defasagem_du ?? 0;
        if (pred.tipo === 'II') {
          return (esMap.get(pred.id) ?? 1) + lag;
        }
        return (efMap.get(pred.id) ?? 0) + 1 + lag;
      });
      es = Math.max(1, ...candidates);
    }

    const ef = es + dur - 1;
    esMap.set(item.id_atividade, es);
    efMap.set(item.id_atividade, ef);
  }

  const prazo_total_du = Math.max(1, ...Array.from(efMap.values()));

  // Mapa de sucessoras para Passo de volta e Folga Livre
  const sucessorasMap = new Map<
    string,
    Array<{ id: string; tipo: PertTipoDependencia; defasagem_du: number }>
  >();
  for (const item of ordered) {
    sucessorasMap.set(item.id_atividade, []);
  }
  for (const item of ordered) {
    for (const pred of item.predecessoras) {
      const list = sucessorasMap.get(pred.id);
      if (list) {
        list.push({
          id: item.id_atividade,
          tipo: pred.tipo,
          defasagem_du: pred.defasagem_du ?? 0,
        });
      }
    }
  }

  // Passo de volta (Backward Pass)
  const lsMap = new Map<string, number>();
  const lfMap = new Map<string, number>();

  for (let i = ordered.length - 1; i >= 0; i--) {
    const item = ordered[i];
    const dur = durEfetivaMap.get(item.id_atividade) ?? 1;
    const sucs = sucessorasMap.get(item.id_atividade) ?? [];

    // Limite natural do projeto: LF <= prazo_total_du => LS <= prazo_total_du - dur + 1
    let minLs = prazo_total_du - dur + 1;

    for (const suc of sucs) {
      const sucLs = lsMap.get(suc.id);
      if (sucLs === undefined) continue;
      if (suc.tipo === 'II') {
        const candLs = sucLs - suc.defasagem_du;
        if (candLs < minLs) minLs = candLs;
      } else {
        const candLf = sucLs - 1 - suc.defasagem_du;
        const candLs = candLf - dur + 1;
        if (candLs < minLs) minLs = candLs;
      }
    }

    const ls = minLs;
    const lf = ls + dur - 1;
    lsMap.set(item.id_atividade, ls);
    lfMap.set(item.id_atividade, lf);
  }

  // Montar saída preservando a ordem original das atividades de entrada
  const resultMap = new Map<string, PertAtividadeCalculada>();
  for (const item of ordered) {
    const id = item.id_atividade;
    const es = esMap.get(id) ?? 1;
    const ef = efMap.get(id) ?? 1;
    const ls = lsMap.get(id) ?? es;
    const lf = lfMap.get(id) ?? ef;
    const ft = Math.max(0, ls - es);

    // Folga Livre (FL): máximo atraso possível sem atrasar o ES de nenhuma sucessora
    const sucs = sucessorasMap.get(id) ?? [];
    let fl = Math.max(0, prazo_total_du - ef);
    if (sucs.length > 0) {
      const gaps = sucs
        .map((suc) => {
          const sucEs = esMap.get(suc.id);
          if (sucEs === undefined) return prazo_total_du - ef;
          if (suc.tipo === 'II') {
            return sucEs - suc.defasagem_du - es;
          }
          return sucEs - 1 - suc.defasagem_du - ef;
        });
      fl = Math.max(0, Math.min(prazo_total_du - ef, ...gaps));
    }

    // Garantia algébrica: FL <= FT
    fl = Math.min(fl, ft);
    const e_critica = ft === 0;

    resultMap.set(id, {
      ...item,
      duracao_normal_du: durNormalMap.get(id) ?? 1,
      duracao_du: durEfetivaMap.get(id) ?? 1,
      reducao_aplicada_du: reducaoMap.get(id) ?? 0,
      max_reducao_du: maxReducaoMap.get(id) ?? 0,
      cost_slope: slopeMap.get(id) ?? 0,
      desvio_padrao_du: sigmaMap.get(id) ?? 0,
      es,
      ef,
      ls,
      lf,
      ft,
      fl,
      e_critica,
    });
  }

  const calculadas = atividades.map((a) => resultMap.get(a.id_atividade)!);
  const criticas = calculadas.filter((a) => a.e_critica);
  const varianciaCritica = criticas.reduce(
    (acc, a) => acc + a.desvio_padrao_du * a.desvio_padrao_du,
    0
  );
  const desvio_padrao_critico_du = Number(Math.sqrt(varianciaCritica).toFixed(2));

  return {
    atividades: calculadas,
    prazo_total_du,
    total_atividades: calculadas.length,
    total_criticas: criticas.length,
    desvio_padrao_critico_du,
  };
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}
