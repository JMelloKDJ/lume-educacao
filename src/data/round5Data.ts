import type { BlockStatus, IslandId } from './mapa3dData';

export interface GanttSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface GanttDeliverable {
  id: string;
  blockId: string;
  title: string;
  frontId: IslandId;
  frontLabel: string;
  owner: string;
  /** Timeline positions on 0..8 scale (0 = Jul 26, 3 = Out 26, 8 = Mar 27) */
  startMonth: number;
  endMonth: number;
  milestoneMonth?: number;
  plannedEndLabel: string;
  forecastEndLabel: string;
  progress: number;
  status: BlockStatus;
  isCriticalPath: boolean;
  slackDays: number;
  dependencies: string[];
  subtasks: GanttSubtask[];
}

export type RiskSeverity = 'critico' | 'alto' | 'moderado' | 'baixo';
export type RiskTrackingStatus = 'ativo' | 'em_mitigacao' | 'mitigado';
/** Legacy alias preserved for store compatibility */
export type RiskStatus = RiskTrackingStatus;

export function getRiskSeverityFromScore(
  probability: number,
  impact: number
): RiskSeverity {
  const score = probability * impact;
  if (score >= 16) return 'critico';
  if (score >= 10) return 'alto';
  if (score >= 5) return 'moderado';
  return 'baixo';
}

export interface ProjectRiskItem {
  id: string;
  code: string;
  title: string;
  frontId: IslandId;
  frontLabel: string;
  /** 1 (Muito baixa) a 5 (Quase certa) */
  probability: 1 | 2 | 3 | 4 | 5;
  /** 1 (Desprezível) a 5 (Severo) */
  impact: 1 | 2 | 3 | 4 | 5;
  defaultStatus: RiskTrackingStatus;
  estimatedImpact: string;
  mitigationPlan: string;
  contingencyTrigger: string;
  owner: string;
  dueDate: string;
  relatedBlockId?: string;
}

export interface KeyResultItem {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  step: number;
  owner: string;
  /** True when lower value is better (e.g. MB per lesson) */
  lowerIsBetter?: boolean;
}

export interface StrategicObjective {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  frontLabel: string;
  owner: string;
  keyResults: KeyResultItem[];
}

export interface ProductSlideContextMeta {
  code: string;
  audience: string;
  usageLabel: string;
  usageValue: string;
  tags: string[];
}

export const GANTT_FRONTS: Array<{ id: IslandId; label: string }> = [
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'operacao', label: 'Operação' },
  { id: 'infraestrutura', label: 'Infraestrutura' },
];

export const GANTT_DELIVERABLES: GanttDeliverable[] = [
  // PLATAFORMA
  {
    id: 'g-portal',
    blockId: 'portal-estudante',
    title: 'Portal do Estudante v2.4',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    owner: 'Squad Produto Web',
    startMonth: 0,
    endMonth: 3.1,
    milestoneMonth: 3.1,
    plannedEndLabel: '15 Out 26',
    forecastEndLabel: '14 Out 26',
    progress: 100,
    status: 'concluido',
    isCriticalPath: false,
    slackDays: 8,
    dependencies: ['Acesso & Perfis', 'CDN Regional'],
    subtasks: [
      { id: 'gs-1', title: 'Trilha semanal responsiva 3G', done: true },
      { id: 'gs-2', title: 'Indicadores de progresso por área', done: true },
      { id: 'gs-3', title: 'Homologação nos polos de Feira de Santana', done: true },
    ],
  },
  {
    id: 'g-player',
    blockId: 'player-offline',
    title: 'Player Offline & Cache Adaptativo',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    owner: 'Engenharia Mobile & PWA',
    startMonth: 1.0,
    endMonth: 5.2,
    milestoneMonth: 4.5,
    plannedEndLabel: '30 Nov 26',
    forecastEndLabel: '04 Dez 26',
    progress: 84,
    status: 'em_andamento',
    isCriticalPath: true,
    slackDays: 2,
    dependencies: ['Cache & Sync Local', 'CDN Regional'],
    subtasks: [
      { id: 'gs-4', title: 'Download em lote com retomada automática', done: true },
      { id: 'gs-5', title: 'Compressão adaptativa (16,4 MB/aula)', done: true },
      { id: 'gs-6', title: 'Sincronia incremental ao reconectar', done: false },
    ],
  },
  {
    id: 'g-simulado',
    blockId: 'simulado-tri',
    title: 'Simulado TRI · Ciclo 3 Estadual',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    owner: 'Squad Avaliação & Dados',
    startMonth: 1.5,
    endMonth: 6.2,
    milestoneMonth: 5.5,
    plannedEndLabel: '18 Dez 26',
    forecastEndLabel: '18 Dez 26',
    progress: 78,
    status: 'em_andamento',
    isCriticalPath: false,
    slackDays: 6,
    dependencies: ['Banco de Questões', 'Motor TRI & Dados'],
    subtasks: [
      { id: 'gs-7', title: 'Caderno offline com salvamento local', done: true },
      { id: 'gs-8', title: 'Boletim comparativo por competência', done: true },
      { id: 'gs-9', title: 'Calibração final de coerência pedagógica', done: false },
    ],
  },
  {
    id: 'g-redacao',
    blockId: 'redacao-guiada',
    title: 'Redação Guiada · Feedback por Parágrafo',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    owner: 'Squad Produto Web',
    startMonth: 2.0,
    endMonth: 6.8,
    milestoneMonth: 6.8,
    plannedEndLabel: '25 Jan 27',
    forecastEndLabel: '22 Jan 27',
    progress: 74,
    status: 'em_andamento',
    isCriticalPath: false,
    slackDays: 9,
    dependencies: ['Rubricas de Redação'],
    subtasks: [
      { id: 'gs-10', title: 'Digitalização de folha manuscrita', done: true },
      { id: 'gs-11', title: 'Devolutiva pelas 5 competências', done: true },
      { id: 'gs-12', title: 'Comparativo de evolução entre versões', done: false },
    ],
  },

  // CONTEÚDO
  {
    id: 'g-videoaulas',
    blockId: 'videoaulas-banco',
    title: 'Videoaulas & Banco Compactado',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    owner: 'Equipe de Conteúdo',
    startMonth: 0.5,
    endMonth: 5.6,
    milestoneMonth: 4.5,
    plannedEndLabel: '15 Nov 26',
    forecastEndLabel: '21 Nov 26',
    progress: 76,
    status: 'atencao',
    isCriticalPath: true,
    slackDays: -4,
    dependencies: ['Player Offline', 'Simulado'],
    subtasks: [
      { id: 'gs-13', title: 'Gravação dos 480 blocos essenciais', done: true },
      { id: 'gs-14', title: 'Transcodificação leve (<= 16 MB)', done: true },
      { id: 'gs-15', title: 'Indexação por descritor TRI e legendas', done: false },
      { id: 'gs-16', title: 'Lote final de Ciências da Natureza', done: false },
    ],
  },
  {
    id: 'g-matematica',
    blockId: 'trilha-matematica',
    title: 'Trilha Matemática & Linguagens',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    owner: 'Núcleo Pedagógico',
    startMonth: 0,
    endMonth: 2.9,
    milestoneMonth: 2.9,
    plannedEndLabel: '08 Out 26',
    forecastEndLabel: '08 Out 26',
    progress: 100,
    status: 'concluido',
    isCriticalPath: false,
    slackDays: 10,
    dependencies: ['Banco de Questões'],
    subtasks: [
      { id: 'gs-17', title: 'Módulos base e listas resolvidas', done: true },
      { id: 'gs-18', title: 'Auditoria de gabaritos comentados', done: true },
    ],
  },
  {
    id: 'g-banco',
    blockId: 'banco-questoes',
    title: 'Banco de Questões TRI (12k itens)',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    owner: 'Equipe de Avaliação',
    startMonth: 1.0,
    endMonth: 6.4,
    milestoneMonth: 6.4,
    plannedEndLabel: '15 Jan 27',
    forecastEndLabel: '12 Jan 27',
    progress: 82,
    status: 'em_andamento',
    isCriticalPath: false,
    slackDays: 7,
    dependencies: ['Motor TRI & Dados'],
    subtasks: [
      { id: 'gs-19', title: 'Revisão histórica ENEM 2014–2025', done: true },
      { id: 'gs-20', title: '2.400 questões inéditas calibradas', done: false },
    ],
  },
  {
    id: 'g-cadernos',
    blockId: 'cadernos-offline',
    title: 'Cadernos Offline & Impressão Regional',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    owner: 'Editorial & Produção',
    startMonth: 2.2,
    endMonth: 7.2,
    milestoneMonth: 7.2,
    plannedEndLabel: '12 Fev 27',
    forecastEndLabel: '16 Fev 27',
    progress: 64,
    status: 'atencao',
    isCriticalPath: false,
    slackDays: 3,
    dependencies: ['Videoaulas & Banco', 'Logística Kits 3G'],
    subtasks: [
      { id: 'gs-21', title: 'Diagramação alto contraste P&B', done: true },
      { id: 'gs-22', title: 'Fechamento dos cadernos de revisão final', done: false },
    ],
  },

  // OPERAÇÃO
  {
    id: 'g-homologacao',
    blockId: 'homologacao-escolas',
    title: 'Homologação das 160 Escolas Parceiras',
    frontId: 'operacao',
    frontLabel: 'Operação',
    owner: 'Coordenação Regional BA',
    startMonth: 0.4,
    endMonth: 5.0,
    milestoneMonth: 4.1,
    plannedEndLabel: '30 Out 26',
    forecastEndLabel: '14 Nov 26',
    progress: 58,
    status: 'critico',
    isCriticalPath: true,
    slackDays: -9,
    dependencies: ['Painel Escolar', 'Suporte Regional'],
    subtasks: [
      { id: 'gs-23', title: '142 escolas integradas e ativas', done: true },
      { id: 'gs-24', title: 'Regularização documental de 18 unidades no Oeste', done: false },
      { id: 'gs-25', title: 'Auditoria final de matrículas', done: false },
    ],
  },
  {
    id: 'g-conectividade',
    blockId: 'mutirao-conectividade',
    title: 'Mutirão Conectividade Rural (6 pontos)',
    frontId: 'operacao',
    frontLabel: 'Operação',
    owner: 'Operações de Campo',
    startMonth: 1.5,
    endMonth: 5.8,
    milestoneMonth: 4.3,
    plannedEndLabel: '06 Nov 26',
    forecastEndLabel: '19 Nov 26',
    progress: 49,
    status: 'critico',
    isCriticalPath: true,
    slackDays: -7,
    dependencies: ['Servidores Locais', 'Cache & Sync Local'],
    subtasks: [
      { id: 'gs-26', title: 'Levantamento de sinal em 18 comunidades', done: true },
      { id: 'gs-27', title: 'Instalação dos 6 repetidores pendentes', done: false },
      { id: 'gs-28', title: 'Validação de sincronia noturna', done: false },
    ],
  },
  {
    id: 'g-kits',
    blockId: 'kits-offline',
    title: 'Logística Kits 3G · Lote Oeste',
    frontId: 'operacao',
    frontLabel: 'Operação',
    owner: 'Operações de Campo',
    startMonth: 1.2,
    endMonth: 6.2,
    milestoneMonth: 5.2,
    plannedEndLabel: '10 Dez 26',
    forecastEndLabel: '12 Dez 26',
    progress: 71,
    status: 'atencao',
    isCriticalPath: false,
    slackDays: 4,
    dependencies: ['Cadernos Offline', 'Servidores Locais'],
    subtasks: [
      { id: 'gs-29', title: '3.240 kits entregues nas regionais centrais', done: true },
      { id: 'gs-30', title: 'Expedição dos 760 kits da zona rural', done: false },
    ],
  },
  {
    id: 'g-docente',
    blockId: 'capacitacao-docente',
    title: 'Capacitação Docente Regional',
    frontId: 'operacao',
    frontLabel: 'Operação',
    owner: 'Formação Pedagógica',
    startMonth: 0.8,
    endMonth: 6.5,
    milestoneMonth: 6.5,
    plannedEndLabel: '20 Jan 27',
    forecastEndLabel: '18 Jan 27',
    progress: 81,
    status: 'em_andamento',
    isCriticalPath: false,
    slackDays: 11,
    dependencies: ['Painel Escolar'],
    subtasks: [
      { id: 'gs-31', title: '640 docentes certificados nas regionais', done: true },
      { id: 'gs-32', title: 'Oficinas presenciais de fechamento', done: false },
    ],
  },

  // INFRAESTRUTURA
  {
    id: 'g-cdn',
    blockId: 'cdn-borda',
    title: 'CDN Regional Nordeste & HTTP/3',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    owner: 'Infraestrutura & Cloud',
    startMonth: 0,
    endMonth: 2.6,
    milestoneMonth: 2.6,
    plannedEndLabel: '25 Set 26',
    forecastEndLabel: '22 Set 26',
    progress: 100,
    status: 'concluido',
    isCriticalPath: false,
    slackDays: 14,
    dependencies: ['Segurança & LGPD'],
    subtasks: [
      { id: 'gs-33', title: 'Nós de borda ativos em Salvador e Fortaleza', done: true },
      { id: 'gs-34', title: 'Failover multi-CDN validado', done: true },
    ],
  },
  {
    id: 'g-cache',
    blockId: 'cache-local',
    title: 'Cache & Sync Local (Delta Compression)',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    owner: 'Engenharia Plataforma',
    startMonth: 1.2,
    endMonth: 6.0,
    milestoneMonth: 5.0,
    plannedEndLabel: '05 Dez 26',
    forecastEndLabel: '05 Dez 26',
    progress: 82,
    status: 'em_andamento',
    isCriticalPath: false,
    slackDays: 7,
    dependencies: ['CDN Regional'],
    subtasks: [
      { id: 'gs-35', title: 'Banco local criptografado por perfil', done: true },
      { id: 'gs-36', title: 'Sincronia incremental por pacotes delta', done: false },
    ],
  },
  {
    id: 'g-servidores',
    blockId: 'rede-polos',
    title: 'Microservidores & Nobreaks nos Polos',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    owner: 'Infraestrutura & Campo',
    startMonth: 2.0,
    endMonth: 7.4,
    milestoneMonth: 6.0,
    plannedEndLabel: '28 Jan 27',
    forecastEndLabel: '04 Fev 27',
    progress: 70,
    status: 'atencao',
    isCriticalPath: false,
    slackDays: 5,
    dependencies: ['CDN Regional'],
    subtasks: [
      { id: 'gs-37', title: '9 sedes com microservidor operando', done: true },
      { id: 'gs-38', title: 'Nobreaks nas 3 sedes do Oeste baiano', done: false },
    ],
  },
  {
    id: 'g-lgpd',
    blockId: 'seguranca-lgpd',
    title: 'Auditoria Segurança, LGPD & Encerramento',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    owner: 'Segurança & Conformidade',
    startMonth: 0.2,
    endMonth: 8.0,
    milestoneMonth: 8.0,
    plannedEndLabel: '25 Mar 27',
    forecastEndLabel: '25 Mar 27',
    progress: 100,
    status: 'concluido',
    isCriticalPath: false,
    slackDays: 12,
    dependencies: [],
    subtasks: [
      { id: 'gs-39', title: 'Termos de consentimento para responsáveis', done: true },
      { id: 'gs-40', title: 'Relatório de conformidade LGPD aprovado', done: true },
    ],
  },
];

/**
 * 12 real operational/program risks for the 5x5 Heatmap & Risk Register.
 * Initial defaults: 2 critico, 3 alto, 2 moderado, 5 mitigado (total = 12).
 */
export const INITIAL_PROJECT_RISKS: ProjectRiskItem[] = [
  {
    id: 'rsk-01',
    code: 'R01',
    title: 'Atraso na assinatura de termos municipais em 18 escolas do Oeste',
    frontId: 'operacao',
    frontLabel: 'Operação',
    probability: 5,
    impact: 5,
    defaultStatus: 'ativo',
    estimatedImpact: '+14 dias no cronograma regional',
    mitigationPlan:
      'Mutirão jurídico presencial com secretarias municipais e modelo de adesão simplificado.',
    contingencyTrigger:
      'Se < 150 escolas ativas até 28 Out, acionar implantação piloto direta via direção escolar.',
    owner: 'João Victor',
    dueDate: '30 Out 26',
    relatedBlockId: 'homologacao-escolas',
  },
  {
    id: 'rsk-02',
    code: 'R02',
    title: 'Retenção alfandegária de 6 roteadores comunitários de longo alcance',
    frontId: 'operacao',
    frontLabel: 'Operação',
    probability: 4,
    impact: 5,
    defaultStatus: 'em_mitigacao',
    estimatedImpact: '6 comunidades rurais sem sync automática',
    mitigationPlan:
      'Fornecedor nacional alternativo já pré-aprovado com entrega expressa via Feira de Santana.',
    contingencyTrigger:
      'Se liberação não ocorrer em 72h, emitir pedido emergencial usando R$ 42k da reserva.',
    owner: 'Eduardo Reis',
    dueDate: '04 Nov 26',
    relatedBlockId: 'mutirao-conectividade',
  },
  {
    id: 'rsk-03',
    code: 'R03',
    title: 'Gargalo na revisão técnica de videoaulas de Física e Química',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    probability: 4,
    impact: 3,
    defaultStatus: 'em_mitigacao',
    estimatedImpact: '+6 dias na revisão final de Nov',
    mitigationPlan:
      'Alocação de 2 revisores técnicos extras no ciclo C15 e padronização de checklists.',
    contingencyTrigger:
      'Publicar Ciências da Natureza em 2 lotes para não travar o 3º Simulado TRI.',
    owner: 'Fernanda Alves',
    dueDate: '12 Nov 26',
    relatedBlockId: 'videoaulas-banco',
  },
  {
    id: 'rsk-04',
    code: 'R04',
    title: 'Oscilação elétrica em escolas rurais afetando microservidores locais',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    probability: 4,
    impact: 3,
    defaultStatus: 'ativo',
    estimatedImpact: 'R$ 58k em nobreaks e manutenção',
    mitigationPlan:
      'Inclusão obrigatória de nobreaks de 4h e desligamento seguro automatizado nos 3 polos do Oeste.',
    contingencyTrigger:
      'Fallback automático para sincronização via CDN regional em caso de queda do nó local.',
    owner: 'André Tavares',
    dueDate: '18 Nov 26',
    relatedBlockId: 'rede-polos',
  },
  {
    id: 'rsk-05',
    code: 'R05',
    title: 'Limite de armazenamento em smartphones de 32 GB dos estudantes',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    probability: 3,
    impact: 4,
    defaultStatus: 'em_mitigacao',
    estimatedImpact: 'Queda de 8% na retenção offline',
    mitigationPlan:
      'Compactação adaptativa em 16,4 MB/aula e limpeza automática de aulas concluídas há 14 dias.',
    contingencyTrigger:
      'Ativar modo somente áudio + slides leves quando espaço livre cair abaixo de 400 MB.',
    owner: 'Thiago Nogueira',
    dueDate: '22 Nov 26',
    relatedBlockId: 'player-offline',
  },
  {
    id: 'rsk-06',
    code: 'R06',
    title: 'Pico de envios simultâneos no encerramento do 3º Simulado TRI',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    probability: 3,
    impact: 3,
    defaultStatus: 'ativo',
    estimatedImpact: 'Latência de apuração > 45 min',
    mitigationPlan:
      'Fila assíncrona com recibo imediato no aparelho e pré-aquecimento dos workers TRI.',
    contingencyTrigger:
      'Ativar escalonamento automático dobrando instâncias entre 17h e 21h de domingo.',
    owner: 'Carla Mendes',
    dueDate: '28 Nov 26',
    relatedBlockId: 'simulado-tri',
  },
  {
    id: 'rsk-07',
    code: 'R07',
    title: 'Prazo estendido de logística para os 760 kits da zona rural',
    frontId: 'operacao',
    frontLabel: 'Operação',
    probability: 3,
    impact: 2,
    defaultStatus: 'em_mitigacao',
    estimatedImpact: '+5 dias em 4 municípios',
    mitigationPlan:
      'Centro de redistribuição avançado em Feira de Santana operando com rotas consolidadas.',
    contingencyTrigger:
      'Entrega digital antecipada dos cadernos PDF nas secretarias municipais.',
    owner: 'Eduardo Reis',
    dueDate: '05 Dez 26',
    relatedBlockId: 'kits-offline',
  },
  {
    id: 'rsk-08',
    code: 'R08',
    title: 'Queda de engajamento durante recesso escolar intermediário',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    probability: 2,
    impact: 3,
    defaultStatus: 'mitigado',
    estimatedImpact: 'Retenção preservada em 84,2%',
    mitigationPlan:
      'Trilhas curtas de 15 minutos e desafios semanais mantiveram adesão acima da meta.',
    contingencyTrigger:
      'Campanha de retomada via WhatsApp institucional das coordenações.',
    owner: 'Prof. Helena Borges',
    dueDate: 'Concluído',
    relatedBlockId: 'trilha-linguagens',
  },
  {
    id: 'rsk-09',
    code: 'R09',
    title: 'Compatibilidade do portal em aparelhos Android 9 de entrada',
    frontId: 'plataforma',
    frontLabel: 'Plataforma',
    probability: 2,
    impact: 2,
    defaultStatus: 'mitigado',
    estimatedImpact: 'Tempo de carga estabilizado em 1,1s',
    mitigationPlan:
      'Pacote leve com polyfills mínimos homologado em aparelhos com 2 GB de RAM.',
    contingencyTrigger:
      'Monitoramento contínuo de erros por versão de navegador via telemetria.',
    owner: 'Mariana Costa',
    dueDate: 'Concluído',
    relatedBlockId: 'portal-estudante',
  },
  {
    id: 'rsk-10',
    code: 'R10',
    title: 'Oscilação de rotas de operadoras locais no interior da Bahia',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    probability: 2,
    impact: 4,
    defaultStatus: 'mitigado',
    estimatedImpact: 'Latência mantida em 38 ms',
    mitigationPlan:
      'Roteamento multi-CDN entre Salvador e Fortaleza com failover automático.',
    contingencyTrigger:
      'Desvio imediato de tráfego se perda de pacotes ultrapassar 1,5%.',
    owner: 'André Tavares',
    dueDate: 'Concluído',
    relatedBlockId: 'cdn-borda',
  },
  {
    id: 'rsk-11',
    code: 'R11',
    title: 'Exposição indevida de dados de estudantes menores de idade',
    frontId: 'infraestrutura',
    frontLabel: 'Infraestrutura',
    probability: 1,
    impact: 4,
    defaultStatus: 'mitigado',
    estimatedImpact: 'Zero incidentes · Auditoria Q3 aprovada',
    mitigationPlan:
      'Criptografia ponta a ponta, anonimização de exportações e termos validados com responsáveis.',
    contingencyTrigger:
      'Protocolo de revogação imediata de sessões e auditoria de logs.',
    owner: 'André Tavares',
    dueDate: 'Concluído',
    relatedBlockId: 'seguranca-lgpd',
  },
  {
    id: 'rsk-12',
    code: 'R12',
    title: 'Dispersão de notas entre corretores de redação em temas inéditos',
    frontId: 'conteudo',
    frontLabel: 'Conteúdo',
    probability: 1,
    impact: 3,
    defaultStatus: 'mitigado',
    estimatedImpact: 'Concordância de banca em 96,4%',
    mitigationPlan:
      'Matriz calibrada nas 5 competências e dupla correção amostral em 15% dos envios.',
    contingencyTrigger:
      'Recalibração emergencial da banca quando desvio médio exceder 40 pontos.',
    owner: 'Prof. Helena Borges',
    dueDate: 'Concluído',
    relatedBlockId: 'rubricas-redacao',
  },
];

export const INITIAL_OKR_OBJECTIVES: StrategicObjective[] = [
  {
    id: 'okr-1',
    code: 'OBJ 01',
    title: 'Cobertura e Implantação nos Polos',
    subtitle: 'Expandir a rede de escolas ativas e kits offline a partir de Feira de Santana',
    frontLabel: 'Operação',
    owner: 'João Victor',
    keyResults: [
      {
        id: 'kr-1-1',
        title: 'Escolas públicas integradas e com turmas ativas',
        currentValue: 142,
        targetValue: 160,
        unit: 'escolas',
        step: 2,
        owner: 'Coordenação BA',
      },
      {
        id: 'kr-1-2',
        title: 'Kits offline 3G distribuídos nas regionais',
        currentValue: 1920,
        targetValue: 4000,
        unit: 'kits',
        step: 160,
        owner: 'Operações Campo',
      },
      {
        id: 'kr-1-3',
        title: 'Professores certificados na plataforma escolar',
        currentValue: 640,
        targetValue: 720,
        unit: 'docentes',
        step: 20,
        owner: 'Formação',
      },
    ],
  },
  {
    id: 'okr-2',
    code: 'OBJ 02',
    title: 'Qualidade do Conteúdo Offline',
    subtitle: 'Garantir catálogo completo, leve e calibrado na matriz oficial do ENEM',
    frontLabel: 'Conteúdo',
    owner: 'Fernanda Alves',
    keyResults: [
      {
        id: 'kr-2-1',
        title: 'Videoaulas compactadas e indexadas por descritor',
        currentValue: 312,
        targetValue: 480,
        unit: 'aulas',
        step: 16,
        owner: 'Equipe Conteúdo',
      },
      {
        id: 'kr-2-2',
        title: 'Questões parametrizadas com gabarito TRI',
        currentValue: 9840,
        targetValue: 12000,
        unit: 'itens',
        step: 240,
        owner: 'Avaliação',
      },
      {
        id: 'kr-2-3',
        title: 'Redações devolvidas em menos de 24 horas',
        currentValue: 94,
        targetValue: 95,
        unit: '%',
        step: 1,
        owner: 'Núcleo Redação',
      },
    ],
  },
  {
    id: 'okr-3',
    code: 'OBJ 03',
    title: 'Estabilidade da Plataforma 3G',
    subtitle: 'Assegurar experiência fluida em conexões intermitentes e celulares de entrada',
    frontLabel: 'Plataforma & Infra',
    owner: 'Thiago Nogueira',
    keyResults: [
      {
        id: 'kr-3-1',
        title: 'Consumo médio por aula de 20 min (meta ≤ 18 MB)',
        currentValue: 16.4,
        targetValue: 18,
        unit: 'MB',
        step: 0.4,
        owner: 'Mobile & PWA',
        lowerIsBetter: true,
      },
      {
        id: 'kr-3-2',
        title: 'Taxa de sucesso na sincronização após reconexão',
        currentValue: 99.4,
        targetValue: 99.5,
        unit: '%',
        step: 0.1,
        owner: 'Plataforma',
      },
      {
        id: 'kr-3-3',
        title: 'Sedes regionais com microservidor operando',
        currentValue: 8,
        targetValue: 12,
        unit: 'polos',
        step: 1,
        owner: 'Infraestrutura',
      },
    ],
  },
  {
    id: 'okr-4',
    code: 'OBJ 04',
    title: 'Eficiência Orçamentária & Retenção',
    subtitle: 'Manter disciplina de caixa com alto engajamento semanal dos estudantes',
    frontLabel: 'Gestão Executiva',
    owner: 'Comitê Executivo',
    keyResults: [
      {
        id: 'kr-4-1',
        title: 'Aderência estudantil nas trilhas semanais',
        currentValue: 84,
        targetValue: 85,
        unit: '%',
        step: 1,
        owner: 'Produto',
      },
      {
        id: 'kr-4-2',
        title: 'Evolução média de nota na redação após 3 ciclos',
        currentValue: 140,
        targetValue: 160,
        unit: 'pts',
        step: 5,
        owner: 'Pedagogia',
      },
      {
        id: 'kr-4-3',
        title: 'Execução orçamentária aderente à curva planejada',
        currentValue: 96,
        targetValue: 100,
        unit: '%',
        step: 1,
        owner: 'Financeiro',
      },
    ],
  },
];

export const PRODUCT_SLIDE_META: Record<string, ProductSlideContextMeta> = {
  T02: {
    code: 'T02',
    audience: 'Estudantes do Ensino Médio · 1º ao 3º ano',
    usageLabel: 'Conclusão semanal',
    usageValue: '84,2%',
    tags: ['Trilha adaptativa', 'Metas de 25 min', 'Modo offline'],
  },
  T04: {
    code: 'T04',
    audience: 'Estudantes em zonas rurais e redes 3G',
    usageLabel: 'Economia de dados',
    usageValue: '-72% tráfego',
    tags: ['16,4 MB/aula', 'Download agendado', 'Transcrição local'],
  },
  T06: {
    code: 'T06',
    audience: 'Turmas pré-vestibular e coordenação pedagógica',
    usageLabel: 'Participantes no ciclo',
    usageValue: '18.420 alunos',
    tags: ['Calibração TRI', 'Prova offline', 'Diagnóstico por área'],
  },
  T07: {
    code: 'T07',
    audience: 'Estudantes + banca corretora parceira',
    usageLabel: 'Evolução média',
    usageValue: '+140 pts',
    tags: ['5 competências ENEM', 'Envio por foto', 'Devolutiva 24h'],
  },
  T09: {
    code: 'T09',
    audience: 'Estudantes em revisão autônoma',
    usageLabel: 'Dúvidas resolvidas/dia',
    usageValue: '4.860',
    tags: ['Passo a passo', 'Baixa banda', 'Matriz ENEM'],
  },
  T10: {
    code: 'T10',
    audience: 'Diretores, coordenadores e secretarias municipais',
    usageLabel: 'Polos conectados',
    usageValue: '142 escolas',
    tags: ['Alertas de frequência', 'Ranking regional', 'Relatórios PDF'],
  },
};

export function computeKrProgress(kr: KeyResultItem, currentVal: number): number {
  if (kr.lowerIsBetter) {
    if (currentVal <= kr.targetValue) return 100;
    const overrun = (currentVal - kr.targetValue) / kr.targetValue;
    return Math.max(25, Math.round((1 - overrun) * 100));
  }
  if (kr.targetValue <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentVal / kr.targetValue) * 100)));
}

export type KrHealthStatus = 'Concluído' | 'No prazo' | 'Atenção' | 'Atrasado';

export function getKrStatus(pct: number): KrHealthStatus {
  if (pct >= 100) return 'Concluído';
  if (pct >= 75) return 'No prazo';
  if (pct >= 55) return 'Atenção';
  return 'Atrasado';
}
