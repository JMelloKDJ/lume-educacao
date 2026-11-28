import type { CutoffId } from './mock-project';

export type WorkspaceBadgeTone = 'positive' | 'neutral' | 'info' | 'gold' | 'critical';

export interface WorkspaceKpi {
  id: string;
  title: string;
  value: string;
  badgeText: string;
  badgeTone: WorkspaceBadgeTone;
  insight: string;
}

export interface CurvaSPoint {
  month: string;
  fullMonth: string;
  realizado: number | null;
  planejado: number;
}

export interface StageProgressPoint {
  etapa: string;
  realizado: number;
  planejado: number;
}

export interface DeliveryCyclePoint {
  ciclo: string;
  meta: number;
  entregue: number;
  tendencia: number;
  destaque?: boolean;
}

export interface BudgetMonthPoint {
  month: string;
  valorK: number;
  isCurrent?: boolean;
  isForecast?: boolean;
}

export interface BudgetHealthData {
  executadoPct: number;
  comprometidoPct: number;
  reservaPct: number;
  monthly: BudgetMonthPoint[];
}

export interface RadarAttentionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  statusLabel: 'Atenção' | 'No prazo' | 'Decisão' | 'Crítico';
  tone: 'gold' | 'positive' | 'neutral' | 'critical';
  actionNote: string;
  targetSection?: 'cenarios' | 'cronograma' | 'riscos';
}

export interface WorkspacePanelSnapshot {
  cutoffId: CutoffId;
  label: string;
  fullLabel: string;
  currentMonthShort: string;
  updatedAt: string;
  kpis: WorkspaceKpi[];
  curvaS: CurvaSPoint[];
  etapas: StageProgressPoint[];
  fluxoEntregas: DeliveryCyclePoint[];
  orcamento: BudgetHealthData;
  radarAtencao: RadarAttentionItem[];
}

export type ScenarioId = 'base' | 'aceleracao' | 'escopo' | 'revisao';

export interface ScenarioItem {
  id: ScenarioId;
  name: string;
  shortLabel: string;
  subtitle: string;
  summary: string;
  prazoFinal: string;
  prazoShort: string;
  prazoDelta: string;
  investimento: string;
  retornoNum: number;
  retornoLabel: string;
  risco: 'Baixo' | 'Moderado' | 'Alto';
  statusLabel: 'Referência' | 'Recomendado' | 'Alternativa' | 'Conservador';
  statusTone: 'muted' | 'positive' | 'info' | 'gold';
  recommended?: boolean;
  /** Numeric X position for ScatterChart (1 = Fev 27, 2 = Mar 27, 3 = Abr 27, 4 = Jun 27) */
  timelineIndex: number;
  pointColor: string;
}

export interface PublicationRecord {
  id: string;
  title: string;
  fileName: string;
  publishedAt: string;
}

export const WORKSPACE_PANEL_BY_CUTOFF: Record<CutoffId, WorkspacePanelSnapshot> = {
  '2026-10': {
    cutoffId: '2026-10',
    label: 'Out 2026',
    fullLabel: 'Outubro 2026',
    currentMonthShort: 'Out',
    updatedAt: 'Atualizado hoje às 18:40',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '78,4%',
        badgeText: '+4,2% mês',
        badgeTone: 'positive',
        insight: 'Acima do ritmo previsto',
      },
      {
        id: 'orcamento',
        title: 'Orçamento',
        value: '74,0%',
        badgeText: 'No previsto',
        badgeTone: 'neutral',
        insight: 'Saldo livre para próxima fase',
      },
      {
        id: 'entregas-ciclo',
        title: 'Entregas do Ciclo',
        value: '18 / 22',
        badgeText: '81,8%',
        badgeTone: 'info',
        insight: '4 itens em revisão final',
      },
      {
        id: 'riscos-ativos',
        title: 'Riscos Ativos',
        value: '3 alertas',
        badgeText: '1 prioritário',
        badgeTone: 'gold',
        insight: 'Plano de ação em andamento',
      },
    ],
    curvaS: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 2.5, planejado: 3.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 8.4, planejado: 9.2 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 16.8, planejado: 18.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 29.2, planejado: 31.0 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: 44.5, planejado: 46.8 },
      { month: 'Set', fullMonth: 'Setembro', realizado: 61.2, planejado: 63.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: 78.4, planejado: 80.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 90.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 97.5 },
    ],
    etapas: [
      { etapa: 'Polos', realizado: 89, planejado: 85 },
      { etapa: 'App 3G', realizado: 84, planejado: 80 },
      { etapa: 'Conteúdo', realizado: 79, planejado: 82 },
      { etapa: 'Simulados', realizado: 76, planejado: 78 },
      { etapa: 'Tutoria', realizado: 68, planejado: 75 },
    ],
    fluxoEntregas: [
      { ciclo: 'C10', meta: 47, entregue: 40, tendencia: 40 },
      { ciclo: 'C11', meta: 49, entregue: 44, tendencia: 44 },
      { ciclo: 'C12', meta: 50, entregue: 35, tendencia: 35 },
      { ciclo: 'C13', meta: 48, entregue: 46, tendencia: 46 },
      { ciclo: 'C14', meta: 50, entregue: 49, tendencia: 49, destaque: true },
      { ciclo: 'C15', meta: 52, entregue: 53, tendencia: 53 },
    ],
    orcamento: {
      executadoPct: 54,
      comprometidoPct: 26,
      reservaPct: 20,
      monthly: [
        { month: 'Jun', valorK: 182 },
        { month: 'Jul', valorK: 245 },
        { month: 'Ago', valorK: 298 },
        { month: 'Set', valorK: 268 },
        { month: 'Out', valorK: 332, isCurrent: true },
        { month: 'Nov*', valorK: 224, isForecast: true },
      ],
    },
    radarAtencao: [
      {
        id: 'rad-1',
        title: 'Revisar entregas críticas da Fase 3',
        owner: 'Coordenação',
        dueDate: '22 Out',
        statusLabel: 'Atenção',
        tone: 'gold',
        actionNote:
          '4 entregas em homologação final nos polos do Sertão Central; liberação prevista até sexta-feira.',
        targetSection: 'cronograma',
      },
      {
        id: 'rad-2',
        title: 'Validar compactação de vídeo em rede 3G',
        owner: 'Engenharia',
        dueDate: '23 Out',
        statusLabel: 'No prazo',
        tone: 'positive',
        actionNote:
          'Taxa média estabilizada em 16,4 MB por aula de 20 minutos, 72% abaixo do formato padrão.',
      },
      {
        id: 'rad-3',
        title: 'Aprovar cenário de aceleração seletiva',
        owner: 'Comitê Executivo',
        dueDate: '24 Out',
        statusLabel: 'Decisão',
        tone: 'neutral',
        actionNote:
          'Deliberação pendente para liberar o pacote de aceleração de Março 2027 com retorno estimado de +18,4%.',
        targetSection: 'cenarios',
      },
      {
        id: 'rad-4',
        title: 'Ajustar carga de revisão técnica da equipe',
        owner: 'Liderança Técnica',
        dueDate: '26 Out',
        statusLabel: 'Crítico',
        tone: 'critical',
        actionNote:
          'Redistribuição de 2 revisores para absorver o pico de entregas do ciclo C15 sem atrasar a publicação.',
        targetSection: 'riscos',
      },
    ],
  },
  '2026-09': {
    cutoffId: '2026-09',
    label: 'Set 2026',
    fullLabel: 'Setembro 2026',
    currentMonthShort: 'Set',
    updatedAt: 'Corte fechado em 30 Set',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '61,2%',
        badgeText: '+16,7% mês',
        badgeTone: 'positive',
        insight: 'Ritmo acelerado na expansão de polos',
      },
      {
        id: 'orcamento',
        title: 'Orçamento',
        value: '63,2%',
        badgeText: 'No previsto',
        badgeTone: 'neutral',
        insight: 'Desembolso alinhado ao cronograma',
      },
      {
        id: 'entregas-ciclo',
        title: 'Entregas do Ciclo',
        value: '16 / 20',
        badgeText: '80,0%',
        badgeTone: 'info',
        insight: '4 entregas migradas para o ciclo C14',
      },
      {
        id: 'riscos-ativos',
        title: 'Riscos Ativos',
        value: '4 alertas',
        badgeText: '2 prioritários',
        badgeTone: 'gold',
        insight: 'Logística regional sob monitoramento',
      },
    ],
    curvaS: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 2.5, planejado: 3.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 8.4, planejado: 9.2 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 16.8, planejado: 18.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 29.2, planejado: 31.0 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: 44.5, planejado: 46.8 },
      { month: 'Set', fullMonth: 'Setembro', realizado: 61.2, planejado: 63.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: null, planejado: 80.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 90.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 97.5 },
    ],
    etapas: [
      { etapa: 'Polos', realizado: 76, planejado: 74 },
      { etapa: 'App 3G', realizado: 72, planejado: 70 },
      { etapa: 'Conteúdo', realizado: 64, planejado: 68 },
      { etapa: 'Simulados', realizado: 58, planejado: 62 },
      { etapa: 'Tutoria', realizado: 52, planejado: 58 },
    ],
    fluxoEntregas: [
      { ciclo: 'C10', meta: 47, entregue: 40, tendencia: 40 },
      { ciclo: 'C11', meta: 49, entregue: 44, tendencia: 44 },
      { ciclo: 'C12', meta: 50, entregue: 35, tendencia: 35 },
      { ciclo: 'C13', meta: 48, entregue: 46, tendencia: 46, destaque: true },
      { ciclo: 'C14', meta: 50, entregue: 44, tendencia: 44 },
      { ciclo: 'C15', meta: 52, entregue: 47, tendencia: 47 },
    ],
    orcamento: {
      executadoPct: 48,
      comprometidoPct: 29,
      reservaPct: 23,
      monthly: [
        { month: 'Jun', valorK: 182 },
        { month: 'Jul', valorK: 245 },
        { month: 'Ago', valorK: 298 },
        { month: 'Set', valorK: 268, isCurrent: true },
        { month: 'Out*', valorK: 315, isForecast: true },
        { month: 'Nov*', valorK: 220, isForecast: true },
      ],
    },
    radarAtencao: [
      {
        id: 'rad-s1',
        title: 'Homologar kits offline nas regionais Norte',
        owner: 'Operações',
        dueDate: '25 Set',
        statusLabel: 'No prazo',
        tone: 'positive',
        actionNote: '100% das unidades testadas antes da expedição para as escolas parceiras.',
      },
      {
        id: 'rad-s2',
        title: 'Fechar calendário do 2º Simulado TRI',
        owner: 'Pedagogia',
        dueDate: '27 Set',
        statusLabel: 'Atenção',
        tone: 'gold',
        actionNote: 'Ajuste final de janelas de aplicação em 3 municípios com provas estaduais.',
      },
      {
        id: 'rad-s3',
        title: 'Avaliar cenários de investimento Q4',
        owner: 'Comitê Executivo',
        dueDate: '29 Set',
        statusLabel: 'Decisão',
        tone: 'neutral',
        actionNote: 'Pré-análise das 4 alternativas de encerramento do ciclo 2026/2027.',
        targetSection: 'cenarios',
      },
      {
        id: 'rad-s4',
        title: 'Atraso de fornecedor de roteadores locais',
        owner: 'Infraestrutura',
        dueDate: '30 Set',
        statusLabel: 'Crítico',
        tone: 'critical',
        actionNote: 'Acionado fornecedor secundário para evitar impacto na ativação de outubro.',
        targetSection: 'riscos',
      },
    ],
  },
  '2026-08': {
    cutoffId: '2026-08',
    label: 'Ago 2026',
    fullLabel: 'Agosto 2026',
    currentMonthShort: 'Ago',
    updatedAt: 'Corte fechado em 31 Ago',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '44,5%',
        badgeText: '+15,3% mês',
        badgeTone: 'positive',
        insight: 'Expansão sólida no interior da Bahia',
      },
      {
        id: 'orcamento',
        title: 'Orçamento',
        value: '49,5%',
        badgeText: 'No previsto',
        badgeTone: 'neutral',
        insight: 'Reserva estratégica preservada',
      },
      {
        id: 'entregas-ciclo',
        title: 'Entregas do Ciclo',
        value: '14 / 18',
        badgeText: '77,8%',
        badgeTone: 'info',
        insight: 'Ritmo consistente de sprint',
      },
      {
        id: 'riscos-ativos',
        title: 'Riscos Ativos',
        value: '3 alertas',
        badgeText: '1 prioritário',
        badgeTone: 'gold',
        insight: 'Sem desvios de orçamento',
      },
    ],
    curvaS: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 2.5, planejado: 3.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 8.4, planejado: 9.2 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 16.8, planejado: 18.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 29.2, planejado: 31.0 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: 44.5, planejado: 46.8 },
      { month: 'Set', fullMonth: 'Setembro', realizado: null, planejado: 63.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: null, planejado: 80.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 90.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 97.5 },
    ],
    etapas: [
      { etapa: 'Polos', realizado: 62, planejado: 64 },
      { etapa: 'App 3G', realizado: 60, planejado: 58 },
      { etapa: 'Conteúdo', realizado: 51, planejado: 54 },
      { etapa: 'Simulados', realizado: 44, planejado: 48 },
      { etapa: 'Tutoria', realizado: 38, planejado: 44 },
    ],
    fluxoEntregas: [
      { ciclo: 'C10', meta: 47, entregue: 40, tendencia: 40 },
      { ciclo: 'C11', meta: 49, entregue: 44, tendencia: 44 },
      { ciclo: 'C12', meta: 50, entregue: 35, tendencia: 35, destaque: true },
      { ciclo: 'C13', meta: 48, entregue: 42, tendencia: 42 },
      { ciclo: 'C14', meta: 50, entregue: 45, tendencia: 45 },
      { ciclo: 'C15', meta: 52, entregue: 46, tendencia: 46 },
    ],
    orcamento: {
      executadoPct: 41,
      comprometidoPct: 31,
      reservaPct: 28,
      monthly: [
        { month: 'Jun', valorK: 182 },
        { month: 'Jul', valorK: 245 },
        { month: 'Ago', valorK: 298, isCurrent: true },
        { month: 'Set*', valorK: 270, isForecast: true },
        { month: 'Out*', valorK: 310, isForecast: true },
        { month: 'Nov*', valorK: 225, isForecast: true },
      ],
    },
    radarAtencao: [
      {
        id: 'rad-a1',
        title: 'Recalibração do player offline Android',
        owner: 'Engenharia',
        dueDate: '24 Ago',
        statusLabel: 'No prazo',
        tone: 'positive',
        actionNote: 'Testes concluídos em aparelhos de entrada com 2 GB de RAM.',
      },
      {
        id: 'rad-a2',
        title: 'Alinhar cronograma com diretores de polo',
        owner: 'Coordenação',
        dueDate: '28 Ago',
        statusLabel: 'Atenção',
        tone: 'gold',
        actionNote: 'Reunião mensal com 12 polos para padronizar metas de frequência.',
      },
      {
        id: 'rad-a3',
        title: 'Definir escopo do módulo Redação Guiada',
        owner: 'Produto',
        dueDate: '29 Ago',
        statusLabel: 'Decisão',
        tone: 'neutral',
        actionNote: 'Priorizar devolutiva por competência com exemplos comentados.',
      },
      {
        id: 'rad-a4',
        title: 'Oscilação de link em 2 escolas rurais',
        owner: 'Infraestrutura',
        dueDate: '31 Ago',
        statusLabel: 'Crítico',
        tone: 'critical',
        actionNote: 'Sincronização em lote ativada via ponto focal municipal.',
      },
    ],
  },
  '2026-07': {
    cutoffId: '2026-07',
    label: 'Jul 2026',
    fullLabel: 'Julho 2026',
    currentMonthShort: 'Jul',
    updatedAt: 'Corte fechado em 31 Jul',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '29,2%',
        badgeText: '-1,8% vs plano',
        badgeTone: 'critical',
        insight: 'Ajuste pontual durante recesso escolar',
      },
      {
        id: 'orcamento',
        title: 'Orçamento',
        value: '36,1%',
        badgeText: 'Atenção',
        badgeTone: 'gold',
        insight: 'Antecipação de licenças TRI',
      },
      {
        id: 'entregas-ciclo',
        title: 'Entregas do Ciclo',
        value: '13 / 18',
        badgeText: '72,2%',
        badgeTone: 'info',
        insight: 'Recuperação prevista em agosto',
      },
      {
        id: 'riscos-ativos',
        title: 'Riscos Ativos',
        value: '4 alertas',
        badgeText: '1 prioritário',
        badgeTone: 'gold',
        insight: 'Ações preventivas atribuídas',
      },
    ],
    curvaS: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 2.5, planejado: 3.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 8.4, planejado: 9.2 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 16.8, planejado: 18.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 29.2, planejado: 31.0 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: null, planejado: 46.8 },
      { month: 'Set', fullMonth: 'Setembro', realizado: null, planejado: 63.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: null, planejado: 80.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 90.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 97.5 },
    ],
    etapas: [
      { etapa: 'Polos', realizado: 46, planejado: 48 },
      { etapa: 'App 3G', realizado: 45, planejado: 45 },
      { etapa: 'Conteúdo', realizado: 34, planejado: 38 },
      { etapa: 'Simulados', realizado: 26, planejado: 30 },
      { etapa: 'Tutoria', realizado: 22, planejado: 28 },
    ],
    fluxoEntregas: [
      { ciclo: 'C10', meta: 47, entregue: 40, tendencia: 40 },
      { ciclo: 'C11', meta: 49, entregue: 44, tendencia: 44, destaque: true },
      { ciclo: 'C12', meta: 50, entregue: 35, tendencia: 35 },
      { ciclo: 'C13', meta: 48, entregue: 40, tendencia: 40 },
      { ciclo: 'C14', meta: 50, entregue: 42, tendencia: 42 },
      { ciclo: 'C15', meta: 52, entregue: 44, tendencia: 44 },
    ],
    orcamento: {
      executadoPct: 33,
      comprometidoPct: 34,
      reservaPct: 33,
      monthly: [
        { month: 'Jun', valorK: 182 },
        { month: 'Jul', valorK: 245, isCurrent: true },
        { month: 'Ago*', valorK: 285, isForecast: true },
        { month: 'Set*', valorK: 265, isForecast: true },
        { month: 'Out*', valorK: 310, isForecast: true },
        { month: 'Nov*', valorK: 220, isForecast: true },
      ],
    },
    radarAtencao: [
      {
        id: 'rad-j1',
        title: 'Mitigar queda de acesso no recesso escolar',
        owner: 'Pedagogia',
        dueDate: '22 Jul',
        statusLabel: 'Atenção',
        tone: 'gold',
        actionNote: 'Trilhas curtas de 15 minutos mantiveram 71% de engajamento ativo.',
      },
      {
        id: 'rad-j2',
        title: 'Publicar pacote de provas comentadas TRI',
        owner: 'Conteúdo',
        dueDate: '26 Jul',
        statusLabel: 'No prazo',
        tone: 'positive',
        actionNote: 'Cadernos revisados e disponibilizados em modo offline.',
      },
      {
        id: 'rad-j3',
        title: 'Revisar alocação de tutores presenciais',
        owner: 'Coordenação',
        dueDate: '29 Jul',
        statusLabel: 'Decisão',
        tone: 'neutral',
        actionNote: 'Reforço de tutoria em Matemática nos polos de maior demanda.',
      },
      {
        id: 'rad-j4',
        title: 'Logística de 6 municípios atrasada',
        owner: 'Operações',
        dueDate: '31 Jul',
        statusLabel: 'Crítico',
        tone: 'critical',
        actionNote: 'Rota alternativa contratada para regularizar entregas na 1ª semana de agosto.',
      },
    ],
  },
};

export const WORKSPACE_SCENARIOS: ScenarioItem[] = [
  {
    id: 'base',
    name: 'Cenário Base',
    shortLabel: 'Base',
    subtitle: 'Manter ritmo atual',
    summary:
      'Mantém a cadência atual das frentes sem remanejamento adicional, concluindo o programa dentro do plano original.',
    prazoFinal: 'Abr 2027',
    prazoShort: 'Abr 27',
    prazoDelta: 'No prazo',
    investimento: 'R$ 3,20M',
    retornoNum: 9.2,
    retornoLabel: '+9,2%',
    risco: 'Moderado',
    statusLabel: 'Referência',
    statusTone: 'muted',
    timelineIndex: 3,
    pointColor: '#94A3B8',
  },
  {
    id: 'aceleracao',
    name: 'Aceleração Seletiva',
    shortLabel: 'Aceleração',
    subtitle: 'Foco nas frentes críticas',
    summary:
      'Equilibra margem financeira e previsibilidade de entrega sem comprometer qualidade',
    prazoFinal: 'Mar 2027',
    prazoShort: 'Mar 27',
    prazoDelta: '+12 dias',
    investimento: 'R$ 3,45M',
    retornoNum: 18.4,
    retornoLabel: '+18,4%',
    risco: 'Baixo',
    statusLabel: 'Recomendado',
    statusTone: 'positive',
    recommended: true,
    timelineIndex: 2,
    pointColor: '#34D399',
  },
  {
    id: 'escopo',
    name: 'Escopo Otimizado',
    shortLabel: 'Escopo',
    subtitle: 'Priorizar núcleo essencial',
    summary:
      'Antecipa a entrega dos recursos essenciais de estudo offline e simulados reduzindo o investimento inicial.',
    prazoFinal: 'Fev 2027',
    prazoShort: 'Fev 27',
    prazoDelta: '-18 dias',
    investimento: 'R$ 2,95M',
    retornoNum: 14.1,
    retornoLabel: '+14,1%',
    risco: 'Moderado',
    statusLabel: 'Alternativa',
    statusTone: 'info',
    timelineIndex: 1,
    pointColor: '#38BDF8',
  },
  {
    id: 'revisao',
    name: 'Revisão de Prazo',
    shortLabel: 'Revisão',
    subtitle: 'Diluição sem aporte extra',
    summary:
      'Preserva caixa no trimestre atual diluindo as entregas complementares ao longo do primeiro semestre de 2027.',
    prazoFinal: 'Jun 2027',
    prazoShort: 'Jun 27',
    prazoDelta: '+45 dias',
    investimento: 'R$ 3,10M',
    retornoNum: 5.8,
    retornoLabel: '+5,8%',
    risco: 'Baixo',
    statusLabel: 'Conservador',
    statusTone: 'gold',
    timelineIndex: 4,
    pointColor: '#D4AF37',
  },
];

export const INITIAL_PUBLICATIONS: PublicationRecord[] = [
  {
    id: 'pub-1',
    title: 'Boletim Outubro 2026',
    fileName: 'boletim_outubro_2026.xlsx',
    publishedAt: 'Publicado em 15 Out',
  },
  {
    id: 'pub-2',
    title: 'Boletim Setembro 2026',
    fileName: 'boletim_setembro_2026.xlsx',
    publishedAt: 'Publicado em 30 Set',
  },
  {
    id: 'pub-3',
    title: 'Boletim Agosto 2026',
    fileName: 'boletim_agosto_2026.xlsx',
    publishedAt: 'Publicado em 31 Ago',
  },
];
