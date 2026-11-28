export type CutoffId = '2026-10' | '2026-09' | '2026-08' | '2026-07';

export interface MonthlyProgressPoint {
  month: string;
  fullMonth: string;
  realizado: number | null;
  planejado: number;
}

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  badgeText: string;
  badgeTone: 'positive' | 'neutral' | 'gold' | 'critical';
  insight: string;
}

export interface CutoffSnapshot {
  id: CutoffId;
  label: string;
  fullLabel: string;
  currentMonthShort: string;
  updatedAt: string;
  databaseStatus: string;
  kpis: KpiMetric[];
  series: MonthlyProgressPoint[];
}

export interface ExecutiveAlert {
  id: string;
  title: string;
  detail: string;
  time: string;
  severity: 'critical' | 'gold' | 'positive';
  read: boolean;
}

export interface ProductSlide {
  id: string;
  code: string;
  shortTitle: string;
  shortSubtitle: string;
  title: string;
  description: string;
  image?: string;
  highlights: string[];
  metricLabel: string;
  metricValue: string;
}

export const CUTOFF_SNAPSHOTS: Record<CutoffId, CutoffSnapshot> = {
  '2026-10': {
    id: '2026-10',
    label: 'Out 2026',
    fullLabel: 'Outubro 2026',
    currentMonthShort: 'Out',
    updatedAt: 'Atualizado hoje às 18:40',
    databaseStatus: 'Base sincronizada',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '78,4%',
        badgeText: '+4,2% mês',
        badgeTone: 'positive',
        insight: 'Ritmo acima da meta trimestral',
      },
      {
        id: 'execucao-orcamentaria',
        title: 'Execução Orçamentária',
        value: '74,0%',
        badgeText: 'No previsto',
        badgeTone: 'neutral',
        insight: 'Saldo disponível para próximas fases',
      },
      {
        id: 'polos-ativos',
        title: 'Polos no Interior',
        value: '142 / 160',
        badgeText: '+11 polos',
        badgeTone: 'positive',
        insight: '88,8% da malha regional conectada',
      },
      {
        id: 'aderencia-semanal',
        title: 'Aderência Estudantil',
        value: '84,2%',
        badgeText: '+6,4% vs mês anterior',
        badgeTone: 'gold',
        insight: 'Alta retenção nas trilhas offline 3G',
      },
    ],
    series: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 4.5, planejado: 5.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 11.2, planejado: 12.5 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 21.8, planejado: 24.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 35.4, planejado: 38.5 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: 51.0, planejado: 54.0 },
      { month: 'Set', fullMonth: 'Setembro', realizado: 65.8, planejado: 68.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: 78.4, planejado: 81.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 91.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 100.0 },
    ],
  },
  '2026-09': {
    id: '2026-09',
    label: 'Set 2026',
    fullLabel: 'Setembro 2026',
    currentMonthShort: 'Set',
    updatedAt: 'Corte fechado em 30 Set',
    databaseStatus: 'Base consolidada',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '65,8%',
        badgeText: '+14,8% mês',
        badgeTone: 'positive',
        insight: 'Forte entrega de infraestrutura escolar',
      },
      {
        id: 'execucao-orcamentaria',
        title: 'Execução Orçamentária',
        value: '63,2%',
        badgeText: 'No previsto',
        badgeTone: 'neutral',
        insight: 'Desembolso alinhado ao cronograma físico',
      },
      {
        id: 'polos-ativos',
        title: 'Polos no Interior',
        value: '131 / 160',
        badgeText: '+14 polos',
        badgeTone: 'positive',
        insight: 'Expansão concluída no Norte e Nordeste',
      },
      {
        id: 'aderencia-semanal',
        title: 'Aderência Estudantil',
        value: '77,8%',
        badgeText: '+3,9% vs mês anterior',
        badgeTone: 'gold',
        insight: 'Pico de participação no 2º Simulado TRI',
      },
    ],
    series: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 4.5, planejado: 5.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 11.2, planejado: 12.5 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 21.8, planejado: 24.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 35.4, planejado: 38.5 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: 51.0, planejado: 54.0 },
      { month: 'Set', fullMonth: 'Setembro', realizado: 65.8, planejado: 68.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: null, planejado: 81.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 91.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 100.0 },
    ],
  },
  '2026-08': {
    id: '2026-08',
    label: 'Ago 2026',
    fullLabel: 'Agosto 2026',
    currentMonthShort: 'Ago',
    updatedAt: 'Corte fechado em 31 Ago',
    databaseStatus: 'Base consolidada',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '51,0%',
        badgeText: '+15,6% mês',
        badgeTone: 'positive',
        insight: 'Ultrapassou metade das entregas previstas',
      },
      {
        id: 'execucao-orcamentaria',
        title: 'Execução Orçamentária',
        value: '49,5%',
        badgeText: 'No previsto',
        badgeTone: 'neutral',
        insight: 'Margem de contingência preservada em 6%',
      },
      {
        id: 'polos-ativos',
        title: 'Polos no Interior',
        value: '117 / 160',
        badgeText: '+19 polos',
        badgeTone: 'positive',
        insight: 'Homologação de kits offline concluída',
      },
      {
        id: 'aderencia-semanal',
        title: 'Aderência Estudantil',
        value: '73,9%',
        badgeText: '+2,8% vs mês anterior',
        badgeTone: 'gold',
        insight: 'Crescimento consistente nas redações guiadas',
      },
    ],
    series: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 4.5, planejado: 5.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 11.2, planejado: 12.5 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 21.8, planejado: 24.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 35.4, planejado: 38.5 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: 51.0, planejado: 54.0 },
      { month: 'Set', fullMonth: 'Setembro', realizado: null, planejado: 68.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: null, planejado: 81.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 91.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 100.0 },
    ],
  },
  '2026-07': {
    id: '2026-07',
    label: 'Jul 2026',
    fullLabel: 'Julho 2026',
    currentMonthShort: 'Jul',
    updatedAt: 'Corte fechado em 31 Jul',
    databaseStatus: 'Base consolidada',
    kpis: [
      {
        id: 'avanco-geral',
        title: 'Avanço Geral',
        value: '35,4%',
        badgeText: '-3,1% vs plano',
        badgeTone: 'critical',
        insight: 'Atraso pontual em logística de 6 municípios',
      },
      {
        id: 'execucao-orcamentaria',
        title: 'Execução Orçamentária',
        value: '36,1%',
        badgeText: 'Atenção',
        badgeTone: 'gold',
        insight: 'Antecipação de licenças de correção TRI',
      },
      {
        id: 'polos-ativos',
        title: 'Polos no Interior',
        value: '98 / 160',
        badgeText: '+16 polos',
        badgeTone: 'positive',
        insight: 'Rede estadual integrada em 11 regionais',
      },
      {
        id: 'aderencia-semanal',
        title: 'Aderência Estudantil',
        value: '71,1%',
        badgeText: '+1,9% vs mês anterior',
        badgeTone: 'neutral',
        insight: 'Recesso escolar mitigado por metas curtas',
      },
    ],
    series: [
      { month: 'Abr', fullMonth: 'Abril', realizado: 4.5, planejado: 5.0 },
      { month: 'Mai', fullMonth: 'Maio', realizado: 11.2, planejado: 12.5 },
      { month: 'Jun', fullMonth: 'Junho', realizado: 21.8, planejado: 24.0 },
      { month: 'Jul', fullMonth: 'Julho', realizado: 35.4, planejado: 38.5 },
      { month: 'Ago', fullMonth: 'Agosto', realizado: null, planejado: 54.0 },
      { month: 'Set', fullMonth: 'Setembro', realizado: null, planejado: 68.5 },
      { month: 'Out', fullMonth: 'Outubro', realizado: null, planejado: 81.0 },
      { month: 'Nov', fullMonth: 'Novembro', realizado: null, planejado: 91.5 },
      { month: 'Dez', fullMonth: 'Dezembro', realizado: null, planejado: 100.0 },
    ],
  },
};

export const INITIAL_ALERTS: ExecutiveAlert[] = [
  {
    id: 'alt-1',
    title: 'Desvio de 2,6 p.p. no cronograma de Outubro',
    detail: 'Frente de conectividade no Sertão Central aguarda liberação de 4 roteadores locais.',
    time: 'Há 24 min',
    severity: 'critical',
    read: false,
  },
  {
    id: 'alt-2',
    title: 'Simulado TRI atingiu recorde de participação',
    detail: '18.420 estudantes concluíram a prova completa com sincronização offline.',
    time: 'Hoje · 14:15',
    severity: 'positive',
    read: false,
  },
  {
    id: 'alt-3',
    title: 'Revisão de orçamento para Fase 4',
    detail: 'Reserva técnica de R$ 185 mil liberada para reforço de tutoria em Redação.',
    time: 'Ontem · 17:50',
    severity: 'gold',
    read: true,
  },
];

export const PRODUCT_SLIDES: ProductSlide[] = [
  {
    id: 't02',
    code: 'T02',
    shortTitle: 'Plano Semanal',
    shortSubtitle: 'Cronograma leve por disciplina',
    title: 'T02 · Plano Semanal de Estudos',
    description: 'Trilha adaptativa organizada por metas diárias e disponibilidade de rede',
    highlights: [
      'Blocos de 25 min calibrados pelo tempo real do aluno',
      'Priorização automática das competências com menor domínio',
      'Sincronização em segundo plano sem travar o aparelho',
    ],
    metricLabel: 'Conclusão média semanal',
    metricValue: '84,2%',
  },
  {
    id: 't04',
    code: 'T04',
    shortTitle: 'Player Modo Offline',
    shortSubtitle: 'Aulas compactadas para 3G',
    title: 'T04 · Player Modo Offline',
    description: 'Videoaulas comprimidas em pacotes leves com transcrição e exercícios embarcados',
    highlights: [
      'Consumo reduzido de dados: até 18 MB por aula de 20 minutos',
      'Download agendado em Wi-Fi escolar ou comunitário',
      'Marcadores de revisão rápida acessíveis sem conexão',
    ],
    metricLabel: 'Redução de tráfego 3G',
    metricValue: '-72%',
  },
  {
    id: 't06',
    code: 'T06',
    shortTitle: 'Simulado TRI',
    shortSubtitle: 'Correção comentada por competência',
    title: 'T06 · Simulado TRI',
    description: 'Avaliação diagnóstica com estimativa de proficiência e mapa de coerência pedagógica',
    highlights: [
      'Gabarito comentado item a item com nível de dificuldade',
      'Diagnóstico imediato por área do conhecimento do ENEM',
      'Recomendação automática da próxima trilha de reforço',
    ],
    metricLabel: 'Estudantes avaliados',
    metricValue: '18.420',
  },
  {
    id: 't07',
    code: 'T07',
    shortTitle: 'Redação Guiada',
    shortSubtitle: 'Feedback estruturado por critério',
    title: 'T07 · Redação Guiada',
    description: 'Correção detalhada nas 5 competências oficiais com sugestões práticas de reescrita',
    highlights: [
      'Devolutiva em até 24h com apontamentos por parágrafo',
      'Banco de repertórios socioculturais curado por professores',
      'Evolução histórica da nota comparada à meta do curso',
    ],
    metricLabel: 'Evolução média de nota',
    metricValue: '+140 pts',
  },
  {
    id: 't09',
    code: 'T09',
    shortTitle: 'Tutor Lume IA',
    shortSubtitle: 'Tira-dúvidas guiado passo a passo',
    title: 'T09 · Tutor Lume IA',
    description: 'Acompanhamento pedagógico que explica questões passo a passo sem pular o raciocínio',
    highlights: [
      'Explicações adaptadas ao nível de dificuldade da questão',
      'Sugestão imediata de revisão quando identifica lacuna de base',
      'Histórico de dúvidas sincronizado com o plano semanal do aluno',
    ],
    metricLabel: 'Dúvidas resolvidas/dia',
    metricValue: '4.860',
  },
  {
    id: 't10',
    code: 'T10',
    shortTitle: 'Painel Escolar',
    shortSubtitle: 'Acompanhamento de turmas e polos',
    title: 'T10 · Painel Escolar',
    description: 'Visão consolidada para diretores e coordenadores acompanharem engajamento por turma',
    highlights: [
      'Alertas precoces de queda de frequência semanal',
      'Comparativo de desempenho entre polos da mesma regional',
      'Exportação direta de relatórios executivos para secretarias',
    ],
    metricLabel: 'Polos conectados',
    metricValue: '142 polos',
  },
];

export interface PublicFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const PUBLIC_FAQ_ITEMS: PublicFaqItem[] = [
  {
    id: 'faq-offline',
    question: 'Como funciona o modo offline em redes 3G?',
    answer:
      'O aplicativo compacta videoaulas, cadernos de questões e metas da semana enquanto o estudante está conectado, permitindo estudar sem internet ao longo da semana.',
  },
  {
    id: 'faq-gratuito',
    question: 'O que inclui o acesso gratuito Lume Aberto?',
    answer:
      'O Lume Aberto oferece aulas essenciais em modo leve, banco inicial de questões comentadas do ENEM e resumo semanal de progresso, sem custo e sem prazo de expiração.',
  },
  {
    id: 'faq-tri-redacao',
    question: 'Como a nota TRI e a redação são corrigidas?',
    answer:
      'Os simulados aplicam cálculo inspirado na Teoria de Resposta ao Item considerando coerência pedagógica, e as redações recebem feedback estruturado nas 5 competências oficiais do ENEM.',
  },
  {
    id: 'faq-escolas',
    question: 'Escolas públicas e municípios podem contratar polos?',
    answer:
      'Sim. A modalidade Polos & Escolas contempla implantação híbrida completa, painel para coordenação, acompanhamento de turmas em tempo real e formação de tutores locais.',
  },
];

export interface TeamMember {
  initials: string;
  name: string;
  role: string;
}

export const LUME_TEAM: TeamMember[] = [
  { initials: 'JV', name: 'João Victor Mello', role: 'Produto & Arquitetura' },
  { initials: 'NP', name: 'Nara Pereira Sousa', role: 'Design & Experiência' },
  { initials: 'WF', name: 'Willian Fraga', role: 'Engenharia de Plataforma' },
  { initials: 'AB', name: 'Ana Beatriz Reis', role: 'Pedagogia & Conteúdo' },
  { initials: 'FA', name: 'Filipe Ariel', role: 'Dados & Operações' },
];

export const LUMI_QUICK_PROMPTS = [
  { id: 'resumo', label: 'Resumo do projeto', icon: 'trending' as const },
  { id: 'prazo', label: 'Prazo e custos', icon: 'clock' as const },
  { id: 'riscos', label: 'Riscos críticos', icon: 'shield' as const },
  { id: 'cenarios', label: 'Simular cenários', icon: 'sliders' as const },
  { id: 'outro', label: 'Outro assunto', icon: 'help' as const },
];

export function generateLumiFallbackReply(userText: string, cutoff: CutoffSnapshot): string {
  const normalized = userText.toLowerCase();
  const avanco = cutoff.kpis[0]?.value ?? '78,4%';
  const orcamento = cutoff.kpis[1]?.value ?? '74,0%';
  const polos = cutoff.kpis[2]?.value ?? '142 / 160';

  if (normalized.includes('resumo')) {
    return `No corte de ${cutoff.fullLabel}, a Lume Educação atingiu ${avanco} de avanço físico geral e ${orcamento} de execução orçamentária, com ${polos} polos ativos no interior. O ritmo está consistente para fechar novembro acima de 90%.`;
  }
  if (normalized.includes('prazo') || normalized.includes('custo') || normalized.includes('orçamento')) {
    return `Execução financeira em ${orcamento} frente ao planejado, preservando saldo para as entregas de novembro e dezembro. A diferença entre físico realizado (${avanco}) e planejado está controlada em menos de 3 pontos percentuais.`;
  }
  if (normalized.includes('risco') || normalized.includes('crítico') || normalized.includes('alerta')) {
    return `Há 1 ponto de atenção principal em ${cutoff.fullLabel}: a entrega de 4 roteadores no Sertão Central, que explica o desvio pontual de 2,6 p.p. no cronograma. A contingência local já foi acionada sem impacto no orçamento total.`;
  }
  if (normalized.includes('cenário') || normalized.includes('simular')) {
    return `Posso simular três caminhos para o encerramento de 2026: (1) Base Atual — conclusão em 98,2% até Dez; (2) Acelerado — antecipando 12 polos com +R$ 95 mil da reserva; ou (3) Conservador — mantendo custo estável com foco em retenção.`;
  }
  if (normalized.includes('outro')) {
    return `Pode mandar sua dúvida! Consigo cruzar indicadores de ${cutoff.fullLabel}, detalhar telas do produto (T02 a T10), revisar o avanço físico-financeiro ou preparar um resumo rápido para a diretoria.`;
  }

  return `Analisei os dados de ${cutoff.fullLabel}: o avanço físico está em ${avanco}, a execução orçamentária em ${orcamento} e ${polos} polos já estão em operação. Quer que eu aprofunde algum indicador específico ou compare com o mês anterior?`;
}
