export type BlockStatus = 'concluido' | 'em_andamento' | 'atencao' | 'critico';

export type IslandId =
  | 'plataforma'
  | 'conteudo'
  | 'operacao'
  | 'infraestrutura';

export type StatusFilter = 'todos' | 'critico' | 'em_andamento' | 'concluido';

export interface TimelineMonth {
  index: number;
  shortLabel: string;
  fullLabel: string;
  cutoffKey?: '2026-08' | '2026-09' | '2026-10';
}

export interface IslandConfig {
  id: IslandId;
  label: string;
  center: [number, number]; // [x, z] in isometric world space
  labelAnchor: [number, number, number]; // [x, y, z] for floating pill badge
}

export interface BlockSubtask {
  id: string;
  title: string;
  done: boolean;
  dueLabel: string;
}

export interface BlockHistoryEntry {
  id: string;
  date: string;
  summary: string;
  author: string;
}

export interface BlockRiskItem {
  id: string;
  title: string;
  severity: 'baixo' | 'medio' | 'alto';
  mitigation: string;
}

export interface Map3DBlock {
  id: string;
  name: string;
  islandId: IslandId;
  localOffset: [number, number]; // [dx, dz] on its island platform
  description: string;
  owner: string;
  nextMilestone: string;
  dependencies: string[]; // target block IDs
  /** Monthly progress percentages from Jul 26 (index 0) to Mar 27 (index 8) */
  monthlyProgress: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  /** Monthly statuses from Jul 26 (index 0) to Mar 27 (index 8) */
  monthlyStatus: [
    BlockStatus,
    BlockStatus,
    BlockStatus,
    BlockStatus,
    BlockStatus,
    BlockStatus,
    BlockStatus,
    BlockStatus,
    BlockStatus,
  ];
  subtasks: BlockSubtask[];
  recentHistory: BlockHistoryEntry[];
  risks: BlockRiskItem[];
}

export interface ResolvedMap3DBlock extends Map3DBlock {
  progress: number;
  status: BlockStatus;
  worldX: number;
  worldZ: number;
  islandLabel: string;
}

export const TIMELINE_MONTHS: TimelineMonth[] = [
  { index: 0, shortLabel: 'Jul 26', fullLabel: 'Jul 2026' },
  { index: 1, shortLabel: 'Ago 26', fullLabel: 'Ago 2026', cutoffKey: '2026-08' },
  { index: 2, shortLabel: 'Set 26', fullLabel: 'Set 2026', cutoffKey: '2026-09' },
  { index: 3, shortLabel: 'Out 26', fullLabel: 'Out 2026', cutoffKey: '2026-10' },
  { index: 4, shortLabel: 'Nov 26', fullLabel: 'Nov 2026' },
  { index: 5, shortLabel: 'Dez 26', fullLabel: 'Dez 2026' },
  { index: 6, shortLabel: 'Jan 27', fullLabel: 'Jan 2027' },
  { index: 7, shortLabel: 'Fev 27', fullLabel: 'Fev 2027' },
  { index: 8, shortLabel: 'Mar 27', fullLabel: 'Mar 2027' },
];

export const DEFAULT_TIMELINE_INDEX = 3; // Out 2026
export const DEFAULT_SELECTED_BLOCK_ID = 'videoaulas-banco';

export const ISLANDS: IslandConfig[] = [
  {
    id: 'plataforma',
    label: 'PLATAFORMA',
    center: [-2.85, -2.85],
    labelAnchor: [-4.95, 1.35, -4.95],
  },
  {
    id: 'conteudo',
    label: 'CONTEÚDO',
    center: [-2.85, 2.85],
    labelAnchor: [-5.1, 1.45, 0.85],
  },
  {
    id: 'operacao',
    label: 'OPERAÇÃO',
    center: [2.85, -2.85],
    labelAnchor: [0.95, 1.45, -5.05],
  },
  {
    id: 'infraestrutura',
    label: 'INFRAESTRUTURA',
    center: [2.85, 2.85],
    labelAnchor: [4.95, -0.5, 4.95],
  },
];

export const ISLAND_BY_ID: Record<IslandId, IslandConfig> = {
  plataforma: ISLANDS[0],
  conteudo: ISLANDS[1],
  operacao: ISLANDS[2],
  infraestrutura: ISLANDS[3],
};

/** 7 non-overlapping local positions on each 3.9 x 3.9 isometric platform */
const SLOTS: Record<number, [number, number]> = {
  0: [-1.1, -1.1], // back-top
  1: [-1.1, 0.08], // back-left
  2: [0.08, -1.1], // back-right
  3: [-0.04, -0.04], // center focal
  4: [-1.02, 1.08], // front-left
  5: [1.08, -1.02], // front-right
  6: [0.98, 0.98], // front-bottom
};

export const STATUS_META: Record<
  BlockStatus,
  {
    label: string;
    darkHex: string;
    lightHex: string;
    topDarkHex: string;
    topLightHex: string;
  }
> = {
  concluido: {
    label: 'Concluído',
    darkHex: '#10B981',
    lightHex: '#10B981',
    topDarkHex: '#4ADE80',
    topLightHex: '#34D399',
  },
  em_andamento: {
    label: 'Em andamento',
    darkHex: '#7C5CFC',
    lightHex: '#6747E6',
    topDarkHex: '#A78BFA',
    topLightHex: '#8B74F2',
  },
  atencao: {
    label: 'Atenção',
    darkHex: '#F59E0B',
    lightHex: '#D97706',
    topDarkHex: '#FCD34D',
    topLightHex: '#F59E0B',
  },
  critico: {
    label: 'Crítico',
    darkHex: '#F43F5E',
    lightHex: '#E11D48',
    topDarkHex: '#FB7185',
    topLightHex: '#F43F5E',
  },
};

/**
 * 28 operational blocks (7 per island).
 * Exact status distribution at Out 2026 (index 3):
 * - Concluído: 12 (4 Plataforma, 2 Conteúdo, 2 Operação, 4 Infraestrutura)
 * - Em andamento: 9 (3 Plataforma, 2 Conteúdo, 2 Operação, 2 Infraestrutura)
 * - Atenção: 5 (0 Plataforma, 3 Conteúdo, 1 Operação, 1 Infraestrutura)
 * - Crítico: 2 (0 Plataforma, 0 Conteúdo, 2 Operação, 0 Infraestrutura)
 * Total = 28 blocks.
 */
export const MAPA_3D_BLOCKS: Map3DBlock[] = [
  // =========================================================================
  // ILHA 1: PLATAFORMA (7 blocos) — Out 26: 4 concluido, 3 em_andamento
  // =========================================================================
  {
    id: 'portal-estudante',
    name: 'Portal do Estudante',
    islandId: 'plataforma',
    localOffset: SLOTS[0],
    description:
      'Ambiente principal de estudo com trilha personalizada e metas semanais.',
    owner: 'Squad Produto Web',
    nextMilestone: 'Estabilização v2.4 · Out 26',
    dependencies: ['autenticacao-sso', 'cdn-borda'],
    monthlyProgress: [74, 88, 96, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-pe-1', title: 'Painel de trilha semanal responsivo', done: true, dueLabel: 'Ago 26' },
      { id: 'st-pe-2', title: 'Indicadores de progresso por disciplina', done: true, dueLabel: 'Set 26' },
      { id: 'st-pe-3', title: 'Homologação com turmas de Feira de Santana', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-pe-1', date: '14 Out 26', summary: 'Versão 2.4 publicada para 142 escolas ativas.', author: 'Mariana Costa' },
      { id: 'h-pe-2', date: '02 Out 26', summary: 'Tempo de carregamento inicial reduzido para 1,1s em 3G.', author: 'Rafael Lima' },
    ],
    risks: [
      {
        id: 'r-pe-1',
        title: 'Compatibilidade com navegadores antigos em Android 9',
        severity: 'baixo',
        mitigation: 'Polyfills leves mantidos no pacote de entrada.',
      },
    ],
  },
  {
    id: 'plano-semanal',
    name: 'Plano Semanal',
    islandId: 'plataforma',
    localOffset: SLOTS[1],
    description:
      'Motor de organização de metas adaptativas por ritmo e disponibilidade do aluno.',
    owner: 'Squad Produto Web',
    nextMilestone: 'Ajuste fino de carga · Out 26',
    dependencies: ['trilha-matematica'],
    monthlyProgress: [68, 82, 94, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-ps-1', title: 'Algoritmo de redistribuição automática de metas', done: true, dueLabel: 'Ago 26' },
      { id: 'st-ps-2', title: 'Exportação do plano semanal em modo offline', done: true, dueLabel: 'Set 26' },
      { id: 'st-ps-3', title: 'Validação pedagógica com coordenadores', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-ps-1', date: '11 Out 26', summary: 'Entrega validada com 89% de adesão na primeira semana.', author: 'Mariana Costa' },
      { id: 'h-ps-2', date: '26 Set 26', summary: 'Rebalanceamento de carga horária integrado.', author: 'Lucas Andrade' },
    ],
    risks: [
      {
        id: 'r-ps-1',
        title: 'Acúmulo de metas atrasadas em feriados locais',
        severity: 'baixo',
        mitigation: 'Modo de replanejamento com 1 clique ativado.',
      },
    ],
  },
  {
    id: 'player-offline',
    name: 'Player Offline',
    islandId: 'plataforma',
    localOffset: SLOTS[3],
    description:
      'Reprodutor de videoaulas compactadas com cache inteligente para conexões instáveis.',
    owner: 'Engenharia Mobile & PWA',
    nextMilestone: 'Sincronia incremental · Nov 26',
    dependencies: ['cache-local', 'cdn-borda'],
    monthlyProgress: [42, 56, 70, 84, 93, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-po-1', title: 'Download em lote com retomada automática', done: true, dueLabel: 'Set 26' },
      { id: 'st-po-2', title: 'Compressão adaptativa de áudio e vídeo (16 MB/aula)', done: true, dueLabel: 'Out 26' },
      { id: 'st-po-3', title: 'Sincronização de progresso ao reconectar', done: false, dueLabel: 'Nov 26' },
      { id: 'st-po-4', title: 'Testes de campo em 6 municípios sem 4G estável', done: false, dueLabel: 'Dez 26' },
    ],
    recentHistory: [
      { id: 'h-po-1', date: '15 Out 26', summary: 'Economia de 72% de dados confirmada nos polos piloto.', author: 'Thiago Nogueira' },
      { id: 'h-po-2', date: '04 Out 26', summary: 'Fila de download em segundo plano estabilizada.', author: 'Thiago Nogueira' },
    ],
    risks: [
      {
        id: 'r-po-1',
        title: 'Limite de armazenamento em aparelhos de 32 GB',
        severity: 'medio',
        mitigation: 'Limpeza automática de aulas já concluídas há mais de 14 dias.',
      },
    ],
  },
  {
    id: 'simulado-tri',
    name: 'Simulado',
    islandId: 'plataforma',
    localOffset: SLOTS[6],
    description:
      'Aplicação de simulados completos com calibração TRI e diagnóstico por competência.',
    owner: 'Squad Avaliação & Dados',
    nextMilestone: 'Ciclo 3 estadual · Nov 26',
    dependencies: ['banco-questoes', 'motor-tri'],
    monthlyProgress: [38, 52, 65, 78, 90, 96, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-st-1', title: 'Caderno de prova offline com salvamento local', done: true, dueLabel: 'Set 26' },
      { id: 'st-st-2', title: 'Boletim comparativo por área de conhecimento', done: true, dueLabel: 'Out 26' },
      { id: 'st-st-3', title: 'Calibração final de coerência pedagógica', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-st-1', date: '13 Out 26', summary: 'Simulado estadual concluído com 14.200 participações.', author: 'Carla Mendes' },
      { id: 'h-st-2', date: '29 Set 26', summary: 'Fila de apuração TRI reduzida de 4h para 22min.', author: 'Carla Mendes' },
    ],
    risks: [
      {
        id: 'r-st-1',
        title: 'Pico de envio simultâneo no encerramento do domingo',
        severity: 'medio',
        mitigation: 'Fila assíncrona com recibo imediato no aparelho.',
      },
    ],
  },
  {
    id: 'redacao-guiada',
    name: 'Redação Guiada',
    islandId: 'plataforma',
    localOffset: SLOTS[4],
    description:
      'Fluxo de envio por foto ou texto com correção detalhada nas 5 competências do ENEM.',
    owner: 'Squad Produto Web',
    nextMilestone: 'Feedback por parágrafo · Nov 26',
    dependencies: ['rubricas-redacao'],
    monthlyProgress: [36, 49, 62, 74, 86, 95, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-rg-1', title: 'Digitalização de folha manuscrita com recorte automático', done: true, dueLabel: 'Set 26' },
      { id: 'st-rg-2', title: 'Devolutiva estruturada pelas 5 competências', done: true, dueLabel: 'Out 26' },
      { id: 'st-rg-3', title: 'Comparativo de evolução entre versões do texto', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-rg-1', date: '12 Out 26', summary: 'Mais de 9.800 redações corrigidas no trimestre.', author: 'Paula Ribeiro' },
    ],
    risks: [
      {
        id: 'r-rg-1',
        title: 'Fotos com baixa iluminação dificultando leitura',
        severity: 'baixo',
        mitigation: 'Detector de contraste avisa o estudante antes do envio.',
      },
    ],
  },
  {
    id: 'tutor-lumi-ia',
    name: 'Tutor Lumi IA',
    islandId: 'plataforma',
    localOffset: SLOTS[2],
    description:
      'Assistente educacional contextual para tirar dúvidas rápidas e revisar resumos.',
    owner: 'Squad IA Aplicada',
    nextMilestone: 'Operação contínua · Out 26',
    dependencies: ['motor-tri'],
    monthlyProgress: [72, 85, 95, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-tl-1', title: 'Base de respostas alinhadas à matriz do ENEM', done: true, dueLabel: 'Ago 26' },
      { id: 'st-tl-2', title: 'Limites de segurança pedagógica validados', done: true, dueLabel: 'Set 26' },
      { id: 'st-tl-3', title: 'Modo texto econômico para 3G', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-tl-1', date: '10 Out 26', summary: 'Avaliação média de utilidade atingiu 4,8/5,0.', author: 'Bruno Vasconcelos' },
    ],
    risks: [
      {
        id: 'r-tl-1',
        title: 'Aumento de consultas na véspera dos simulados',
        severity: 'baixo',
        mitigation: 'Cache semântico para dúvidas recorrentes reduz latência em 40%.',
      },
    ],
  },
  {
    id: 'painel-escolar',
    name: 'Painel Escolar',
    islandId: 'plataforma',
    localOffset: SLOTS[5],
    description:
      'Visão de engajamento por turma para diretores e coordenadores acompanharem frequência.',
    owner: 'Squad Gestão Escolar',
    nextMilestone: 'Exportação PDF · Out 26',
    dependencies: ['telemetria-polos'],
    monthlyProgress: [76, 89, 97, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-px-1', title: 'Mapa de participação semanal por turma', done: true, dueLabel: 'Ago 26' },
      { id: 'st-px-2', title: 'Alertas de alunos com 7 dias sem acesso', done: true, dueLabel: 'Set 26' },
      { id: 'st-px-3', title: 'Relatório sintético para reuniões de conselho', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-px-1', date: '09 Out 26', summary: '142 direções escolares operando com relatório semanal.', author: 'Renata Souza' },
    ],
    risks: [
      {
        id: 'r-px-1',
        title: 'Divergência de cadastro de turmas entre secretarias',
        severity: 'baixo',
        mitigation: 'Importador assistido padroniza planilhas na entrada.',
      },
    ],
  },

  // =========================================================================
  // ILHA 2: CONTEÚDO (7 blocos) — Out 26: 2 concluido, 2 em_andamento, 3 atencao
  // =========================================================================
  {
    id: 'videoaulas-banco',
    name: 'Videoaulas & Banco',
    islandId: 'conteudo',
    localOffset: SLOTS[3], // Center focal prism on CONTEÚDO (default selected!)
    description:
      'Produção e indexação de aulas compactas para modo offline.',
    owner: 'Equipe de Conteúdo',
    nextMilestone: 'Revisão final · Nov 26',
    dependencies: ['player-offline', 'simulado-tri'],
    monthlyProgress: [44, 56, 67, 76, 86, 94, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'atencao',
      'atencao',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-vb-1', title: 'Gravação dos 480 blocos temáticos essenciais', done: true, dueLabel: 'Ago 26' },
      { id: 'st-vb-2', title: 'Transcodificação leve (<= 16 MB por aula)', done: true, dueLabel: 'Set 26' },
      { id: 'st-vb-3', title: 'Indexação por descritor TRI e revisão de legendas', done: false, dueLabel: 'Nov 26' },
      { id: 'st-vb-4', title: 'Publicação do lote final de Ciências da Natureza', done: false, dueLabel: 'Dez 26' },
    ],
    recentHistory: [
      { id: 'h-vb-1', date: '15 Out 26', summary: '76% do catálogo indexado e sincronizado com o Player Offline.', author: 'Fernanda Alves' },
      { id: 'h-vb-2', date: '05 Out 26', summary: 'Ajuste de áudio em 34 aulas de Química para baixa banda.', author: 'Diego Santana' },
      { id: 'h-vb-3', date: '22 Set 26', summary: 'Lote de Linguagens e Humanas 100% homologado.', author: 'Fernanda Alves' },
    ],
    risks: [
      {
        id: 'r-vb-1',
        title: 'Gargalo na revisão técnica das aulas de Física e Química',
        severity: 'alto',
        mitigation: 'Alocação de 2 revisores extras no ciclo de novembro para evitar atraso no Simulado.',
      },
      {
        id: 'r-vb-2',
        title: 'Metadados incompletos afetando busca offline',
        severity: 'medio',
        mitigation: 'Script automatizado valida tags antes da publicação do pacote.',
      },
    ],
  },
  {
    id: 'trilha-matematica',
    name: 'Trilha Matemática',
    islandId: 'conteudo',
    localOffset: SLOTS[0],
    description:
      'Sequência progressiva de fundamentos até questões de alta complexidade do ENEM.',
    owner: 'Núcleo de Exatas',
    nextMilestone: 'Revisão de cadernos · Out 26',
    dependencies: ['banco-questoes'],
    monthlyProgress: [78, 90, 96, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-tm-1', title: 'Módulos de Matemática Básica e Proporção', done: true, dueLabel: 'Jul 26' },
      { id: 'st-tm-2', title: 'Listas resolvidas passo a passo', done: true, dueLabel: 'Set 26' },
      { id: 'st-tm-3', title: 'Auditoria de gabaritos comentados', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-tm-1', date: '08 Out 26', summary: '100% dos módulos publicados com resolução comentada.', author: 'Prof. Ricardo Rocha' },
    ],
    risks: [
      {
        id: 'r-tm-1',
        title: 'Atualização de questões inéditas para ciclo 2027',
        severity: 'baixo',
        mitigation: 'Calendário editorial trimestral já reservado.',
      },
    ],
  },
  {
    id: 'trilha-linguagens',
    name: 'Trilha Linguagens',
    islandId: 'conteudo',
    localOffset: SLOTS[4],
    description:
      'Interpretação textual, literatura brasileira e estratégias de leitura rápida.',
    owner: 'Núcleo de Linguagens',
    nextMilestone: 'Pacote concluído · Out 26',
    dependencies: ['rubricas-redacao'],
    monthlyProgress: [80, 92, 98, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-tl2-1', title: 'Oficinas de leitura e inferência textual', done: true, dueLabel: 'Ago 26' },
      { id: 'st-tl2-2', title: 'Caderno de repertório sociocultural', done: true, dueLabel: 'Set 26' },
    ],
    recentHistory: [
      { id: 'h-tl2-1', date: '04 Out 26', summary: 'Trilha finalizada e disponível para download nos polos.', author: 'Prof. Helena Borges' },
    ],
    risks: [
      {
        id: 'r-tl2-1',
        title: 'Direitos autorais de textos contemporâneos',
        severity: 'baixo',
        mitigation: 'Curadoria prioriza domínio público e licenças liberadas.',
      },
    ],
  },
  {
    id: 'banco-questoes',
    name: 'Banco de Questões',
    islandId: 'conteudo',
    localOffset: SLOTS[1],
    description:
      'Acervo parametrizado com 12 mil itens classificados por habilidade e dificuldade.',
    owner: 'Equipe de Avaliação',
    nextMilestone: 'Calibração lote 4 · Nov 26',
    dependencies: ['motor-tri'],
    monthlyProgress: [50, 62, 73, 82, 91, 98, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-bq-1', title: 'Revisão histórica ENEM 2014–2025', done: true, dueLabel: 'Ago 26' },
      { id: 'st-bq-2', title: 'Elaboração de 2.400 questões inéditas', done: false, dueLabel: 'Nov 26' },
      { id: 'st-bq-3', title: 'Parametrização TRI em escala unificada', done: false, dueLabel: 'Dez 26' },
    ],
    recentHistory: [
      { id: 'h-bq-1', date: '14 Out 26', summary: '9.840 itens ativos e etiquetados por competência.', author: 'Carla Mendes' },
    ],
    risks: [
      {
        id: 'r-bq-1',
        title: 'Itens inéditos pendentes de pré-testagem',
        severity: 'medio',
        mitigation: 'Inclusão gradual nos mini-simulados semanais.',
      },
    ],
  },
  {
    id: 'trilha-natureza',
    name: 'Ciências da Natureza',
    islandId: 'conteudo',
    localOffset: SLOTS[2],
    description:
      'Física, Química e Biologia contextualizadas com experimentos visuais leves.',
    owner: 'Equipe de Conteúdo',
    nextMilestone: 'Revisão laboratorial · Nov 26',
    dependencies: ['videoaulas-banco'],
    monthlyProgress: [32, 44, 54, 66, 78, 88, 96, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'atencao',
      'atencao',
      'atencao',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-tn-1', title: 'Roteiros ilustrados de Biologia e Ecologia', done: true, dueLabel: 'Set 26' },
      { id: 'st-tn-2', title: 'Infográficos estáticos de Química Orgânica', done: false, dueLabel: 'Nov 26' },
      { id: 'st-tn-3', title: 'Caderno de resolução guiada de Física', done: false, dueLabel: 'Dez 26' },
    ],
    recentHistory: [
      { id: 'h-tn-1', date: '12 Out 26', summary: 'Priorizada revisão de Eletrodinâmica e Estequiometria.', author: 'Diego Santana' },
    ],
    risks: [
      {
        id: 'r-tn-1',
        title: 'Ritmo de diagramação de fórmulas abaixo da meta',
        severity: 'medio',
        mitigation: 'Template padronizado reduziu retrabalho editorial em 35%.',
      },
    ],
  },
  {
    id: 'rubricas-redacao',
    name: 'Rubricas de Redação',
    islandId: 'conteudo',
    localOffset: SLOTS[5],
    description:
      'Guias de correção, bancos de temas atuais e exemplos comentados nota 1000.',
    owner: 'Núcleo de Linguagens',
    nextMilestone: 'Caderno Temas 2026 · Nov 26',
    dependencies: ['redacao-guiada'],
    monthlyProgress: [48, 59, 71, 80, 90, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-rr-1', title: 'Matriz calibrada das 5 competências', done: true, dueLabel: 'Ago 26' },
      { id: 'st-rr-2', title: '24 propostas temáticas regionais e nacionais', done: true, dueLabel: 'Out 26' },
      { id: 'st-rr-3', title: 'Treinamento da banca corretora parceira', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-rr-1', date: '10 Out 26', summary: 'Guia de repertório sociocultural revisado pela coordenação.', author: 'Prof. Helena Borges' },
    ],
    risks: [
      {
        id: 'r-rr-1',
        title: 'Dispersão entre corretores em temas novos',
        severity: 'baixo',
        mitigation: 'Dupla correção amostral em 15% dos envios semanais.',
      },
    ],
  },
  {
    id: 'cadernos-offline',
    name: 'Cadernos Offline',
    islandId: 'conteudo',
    localOffset: SLOTS[6],
    description:
      'Pacotes enxutos em PDF e cards de revisão para impressão escolar e estudo sem rede.',
    owner: 'Editorial & Produção',
    nextMilestone: 'Fechamento lote 3 · Nov 26',
    dependencies: ['videoaulas-banco', 'kits-offline'],
    monthlyProgress: [30, 42, 53, 64, 77, 88, 96, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'atencao',
      'atencao',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-co-1', title: 'Diagramação de alto contraste para impressão P&B', done: true, dueLabel: 'Set 26' },
      { id: 'st-co-2', title: 'Fechamento dos cadernos de revisão final', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-co-1', date: '11 Out 26', summary: 'Ajuste de margens solicitado pelas gráficas regionais.', author: 'Aline Castro' },
    ],
    risks: [
      {
        id: 'r-co-1',
        title: 'Dependência do fechamento final de Ciências da Natureza',
        severity: 'medio',
        mitigation: 'Entrega fatiada por caderno libera impressão antecipada.',
      },
    ],
  },

  // =========================================================================
  // ILHA 3: OPERAÇÃO (7 blocos) — Out 26: 2 concluido, 2 em_andamento, 1 atencao, 2 critico
  // =========================================================================
  {
    id: 'homologacao-escolas',
    name: 'Homologação Escolas',
    islandId: 'operacao',
    localOffset: SLOTS[1], // Tall focal red/critical prism on OPERAÇÃO
    description:
      'Credenciamento, cadastro de turmas e liberação de acesso nas 160 escolas parceiras.',
    owner: 'Coordenação Regional BA',
    nextMilestone: 'Destravar 18 escolas · Out 26',
    dependencies: ['painel-escolar', 'suporte-regional'],
    monthlyProgress: [28, 38, 48, 58, 72, 86, 95, 100, 100],
    monthlyStatus: [
      'atencao',
      'atencao',
      'critico',
      'critico',
      'atencao',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-he-1', title: '142 escolas integradas e com turmas ativas', done: true, dueLabel: 'Set 26' },
      { id: 'st-he-2', title: 'Regularização documental de 18 unidades no oeste', done: false, dueLabel: 'Out 26' },
      { id: 'st-he-3', title: 'Auditoria de listas de matrícula com secretarias', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-he-1', date: '15 Out 26', summary: 'Mutirão regional agendado para desbloquear 18 escolas pendentes.', author: 'João Victor' },
      { id: 'h-he-2', date: '03 Out 26', summary: '12 novas unidades de Barreiras e Irecê ativadas.', author: 'Camila Freitas' },
    ],
    risks: [
      {
        id: 'r-he-1',
        title: 'Atraso na assinatura de termos municipais em 3 polos',
        severity: 'alto',
        mitigation: 'Apoio jurídico dedicado e visita presencial da coordenação.',
      },
    ],
  },
  {
    id: 'kits-offline',
    name: 'Logística Kits 3G',
    islandId: 'operacao',
    localOffset: SLOTS[3], // Amber/attention prism next to critical
    description:
      'Distribuição física de kits de sincronização e cartões de conteúdo nos polos rurais.',
    owner: 'Operações de Campo',
    nextMilestone: 'Remessa Lote Oeste · Nov 26',
    dependencies: ['cadernos-offline', 'rede-polos'],
    monthlyProgress: [36, 48, 60, 71, 83, 92, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'atencao',
      'atencao',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-ko-1', title: '3.240 kits entregues nas regionais centrais', done: true, dueLabel: 'Set 26' },
      { id: 'st-ko-2', title: 'Expedição dos 760 kits restantes para zona rural', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-ko-1', date: '14 Out 26', summary: 'Transportadora homologada para rotas de difícil acesso.', author: 'Eduardo Reis' },
    ],
    risks: [
      {
        id: 'r-ko-1',
        title: 'Prazo estendido de entrega em municípios acima de 500 km',
        severity: 'medio',
        mitigation: 'Centro de redistribuição avançado ativado em Feira de Santana.',
      },
    ],
  },
  {
    id: 'capacitacao-docente',
    name: 'Capacitação Docente',
    islandId: 'operacao',
    localOffset: SLOTS[0],
    description:
      'Formação prática de professores para uso do painel escolar e acompanhamento de metas.',
    owner: 'Formação Pedagógica',
    nextMilestone: 'Turma 4 regional · Nov 26',
    dependencies: ['painel-escolar'],
    monthlyProgress: [44, 58, 70, 81, 90, 97, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-cd-1', title: 'Trilha de onboarding de 4h para professores', done: true, dueLabel: 'Ago 26' },
      { id: 'st-cd-2', title: '640 docentes certificados nas regionais', done: true, dueLabel: 'Out 26' },
      { id: 'st-cd-3', title: 'Oficinas presenciais de encerramento de ciclo', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-cd-1', date: '11 Out 26', summary: 'NPS da formação docente alcançou 92 pontos.', author: 'Patrícia Mota' },
    ],
    risks: [
      {
        id: 'r-cd-1',
        title: 'Conflito de agenda com calendário de conselhos escolares',
        severity: 'baixo',
        mitigation: 'Sessões gravadas com certificação assíncrona.',
      },
    ],
  },
  {
    id: 'suporte-regional',
    name: 'Suporte Regional',
    islandId: 'operacao',
    localOffset: SLOTS[4],
    description:
      'Atendimento ágil via WhatsApp institucional e central local para escolas e alunos.',
    owner: 'Atendimento & CX',
    nextMilestone: 'SLA < 12 min · Out 26',
    dependencies: ['monitoramento-sla'],
    monthlyProgress: [76, 88, 96, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-sr-1', title: 'Operação de 12 pontos focais regionais', done: true, dueLabel: 'Ago 26' },
      { id: 'st-sr-2', title: 'Base de respostas rápidas para baixa conectividade', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-sr-1', date: '13 Out 26', summary: 'Tempo médio de primeira resposta mantido em 9 minutos.', author: 'Lívia Barros' },
    ],
    risks: [
      {
        id: 'r-sr-1',
        title: 'Volume elevado de chamados em dias de simulado',
        severity: 'baixo',
        mitigation: 'Escala reforçada aos sábados e domingos de prova.',
      },
    ],
  },
  {
    id: 'engajamento-familias',
    name: 'Engajamento Famílias',
    islandId: 'operacao',
    localOffset: SLOTS[2],
    description:
      'Comunicação mensal acessível com responsáveis sobre frequência e evolução no ENEM.',
    owner: 'Comunicação Institucional',
    nextMilestone: 'Boletim Outubro · Nov 26',
    dependencies: ['painel-escolar'],
    monthlyProgress: [40, 52, 65, 76, 86, 94, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-ef-1', title: 'Cartilha impressa de boas-vindas entregue', done: true, dueLabel: 'Ago 26' },
      { id: 'st-ef-2', title: 'Resumo quinzenal via mensagem leve', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-ef-1', date: '09 Out 26', summary: 'Taxa de leitura das famílias chegou a 74%.', author: 'Beatriz Nunes' },
    ],
    risks: [
      {
        id: 'r-ef-1',
        title: 'Números de telefone desatualizados na matrícula',
        severity: 'baixo',
        mitigation: 'Atualização trimestral junto às secretarias escolares.',
      },
    ],
  },
  {
    id: 'governanca-secretarias',
    name: 'Acordos Secretarias',
    islandId: 'operacao',
    localOffset: SLOTS[5],
    description:
      'Alinhamento institucional, prestação de contas e renovação de convênios municipais.',
    owner: 'Diretoria Executiva',
    nextMilestone: 'Comitê estadual · Out 26',
    dependencies: ['telemetria-polos'],
    monthlyProgress: [82, 92, 98, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-gs-1', title: '12 polos com termo de cooperação vigente', done: true, dueLabel: 'Jul 26' },
      { id: 'st-gs-2', title: 'Relatório de impacto Q3 aprovado', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-gs-1', date: '07 Out 26', summary: 'Prestação de contas aprovada sem ressalvas.', author: 'João Victor' },
    ],
    risks: [
      {
        id: 'r-gs-1',
        title: 'Transição de gestão em secretarias parceiras',
        severity: 'baixo',
        mitigation: 'Dossiê técnico padronizado entregue em cada polo.',
      },
    ],
  },
  {
    id: 'mutirao-conectividade',
    name: 'Conectividade Rural',
    islandId: 'operacao',
    localOffset: SLOTS[6],
    description:
      'Ativação de pontos de sincronização comunitários nas 6 escolas de sinal crítico.',
    owner: 'Operações de Campo',
    nextMilestone: 'Instalação antenas · Out 26',
    dependencies: ['rede-polos', 'cache-local'],
    monthlyProgress: [22, 31, 40, 49, 65, 80, 92, 100, 100],
    monthlyStatus: [
      'atencao',
      'critico',
      'critico',
      'critico',
      'atencao',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-mc-1', title: 'Levantamento de sinal em 18 comunidades rurais', done: true, dueLabel: 'Ago 26' },
      { id: 'st-mc-2', title: 'Instalação de 6 repetidores comunitários pendentes', done: false, dueLabel: 'Out 26' },
      { id: 'st-mc-3', title: 'Teste de sincronização noturna automatizada', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-mc-1', date: '15 Out 26', summary: 'Equipamentos de rádio chegaram ao polo de Feira de Santana.', author: 'Eduardo Reis' },
    ],
    risks: [
      {
        id: 'r-mc-1',
        title: 'Atraso alfandegário nos roteadores de longo alcance',
        severity: 'alto',
        mitigation: 'Fornecedor nacional alternativo já acionado para os 6 pontos.',
      },
    ],
  },

  // =========================================================================
  // ILHA 4: INFRAESTRUTURA (7 blocos) — Out 26: 4 concluido, 2 em_andamento, 1 atencao
  // =========================================================================
  {
    id: 'cdn-borda',
    name: 'CDN Regional',
    islandId: 'infraestrutura',
    localOffset: SLOTS[0],
    description:
      'Distribuição de mídia em borda no Nordeste reduzindo latência e custo de tráfego.',
    owner: 'Infraestrutura & Cloud',
    nextMilestone: 'Operação estável · Out 26',
    dependencies: ['monitoramento-sla'],
    monthlyProgress: [82, 92, 98, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-cb-1', title: 'Nós de borda ativos em Salvador e Fortaleza', done: true, dueLabel: 'Jul 26' },
      { id: 'st-cb-2', title: 'Compressão Brotli e HTTP/3 habilitados', done: true, dueLabel: 'Set 26' },
    ],
    recentHistory: [
      { id: 'h-cb-1', date: '12 Out 26', summary: 'Latência mediana mantida em 38 ms na Bahia.', author: 'André Tavares' },
    ],
    risks: [
      {
        id: 'r-cb-1',
        title: 'Oscilação de rotas de operadoras locais',
        severity: 'baixo',
        mitigation: 'Roteamento multi-CDN com failover automático.',
      },
    ],
  },
  {
    id: 'cache-local',
    name: 'Cache & Sync Local',
    islandId: 'infraestrutura',
    localOffset: SLOTS[3],
    description:
      'Camada de armazenamento offline-first com resolução automática de conflitos.',
    owner: 'Engenharia Plataforma',
    nextMilestone: 'Compactação delta · Nov 26',
    dependencies: ['cdn-borda'],
    monthlyProgress: [46, 59, 71, 82, 91, 98, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-cl-1', title: 'Banco local criptografado por perfil de aluno', done: true, dueLabel: 'Set 26' },
      { id: 'st-cl-2', title: 'Sincronia incremental por pacotes delta', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-cl-1', date: '14 Out 26', summary: 'Taxa de sucesso na reconexão atingiu 99,4%.', author: 'Thiago Nogueira' },
    ],
    risks: [
      {
        id: 'r-cl-1',
        title: 'Queda de energia durante sincronização em laboratório escolar',
        severity: 'medio',
        mitigation: 'Transações atômicas impedem corrupção do cache local.',
      },
    ],
  },
  {
    id: 'motor-tri',
    name: 'Motor TRI & Dados',
    islandId: 'infraestrutura',
    localOffset: SLOTS[2],
    description:
      'Pipeline estatístico para cálculo de notas TRI e consolidação de boletins.',
    owner: 'Engenharia de Dados',
    nextMilestone: 'Escala 25k alunos · Nov 26',
    dependencies: ['seguranca-lgpd'],
    monthlyProgress: [48, 61, 74, 85, 93, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-mt-1', title: 'Processamento paralelo de lotes de respostas', done: true, dueLabel: 'Set 26' },
      { id: 'st-mt-2', title: 'Auditoria estatística com base histórica INEP', done: true, dueLabel: 'Out 26' },
      { id: 'st-mt-3', title: 'Stress test para 25 mil entregas simultâneas', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-mt-1', date: '13 Out 26', summary: 'Custo por apuração reduzido em 31% após otimização.', author: 'Gabriel Farias' },
    ],
    risks: [
      {
        id: 'r-mt-1',
        title: 'Fila longa em dias de simulado nacional',
        severity: 'baixo',
        mitigation: 'Autoescalonamento configurado com pré-aquecimento.',
      },
    ],
  },
  {
    id: 'autenticacao-sso',
    name: 'Acesso & Perfis',
    islandId: 'infraestrutura',
    localOffset: SLOTS[1],
    description:
      'Controle de acesso por perfil (estudante, docente, coordenação) com sessão offline.',
    owner: 'Segurança & Identidade',
    nextMilestone: 'Operação estável · Out 26',
    dependencies: ['seguranca-lgpd'],
    monthlyProgress: [84, 94, 100, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-as-1', title: 'Login simplificado com matrícula escolar', done: true, dueLabel: 'Jul 26' },
      { id: 'st-as-2', title: 'Renovação de sessão segura sem queda offline', done: true, dueLabel: 'Set 26' },
    ],
    recentHistory: [
      { id: 'h-as-1', date: '05 Out 26', summary: 'Zero incidentes de acesso indevido no trimestre.', author: 'André Tavares' },
    ],
    risks: [
      {
        id: 'r-as-1',
        title: 'Perda de senha por estudantes sem e-mail ativo',
        severity: 'baixo',
        mitigation: 'Redefinição assistida diretamente pelo coordenador escolar.',
      },
    ],
  },
  {
    id: 'telemetria-polos',
    name: 'Telemetria Polos',
    islandId: 'infraestrutura',
    localOffset: SLOTS[4],
    description:
      'Coleta enxuta de indicadores de uso, disponibilidade e qualidade de rede por polo.',
    owner: 'Infraestrutura & Cloud',
    nextMilestone: 'Operação estável · Out 26',
    dependencies: ['monitoramento-sla'],
    monthlyProgress: [78, 90, 97, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-tp-1', title: 'Painel de saúde dos 12 polos regionais', done: true, dueLabel: 'Ago 26' },
      { id: 'st-tp-2', title: 'Alertas automáticos de queda de sincronização', done: true, dueLabel: 'Out 26' },
    ],
    recentHistory: [
      { id: 'h-tp-1', date: '10 Out 26', summary: 'Cobertura de telemetria atingiu 100% das escolas ativas.', author: 'Gabriel Farias' },
    ],
    risks: [
      {
        id: 'r-tp-1',
        title: 'Consumo de dados por envio de eventos',
        severity: 'baixo',
        mitigation: 'Lotes compactados enviados somente em Wi-Fi ou janelas ociosas.',
      },
    ],
  },
  {
    id: 'rede-polos',
    name: 'Servidores Locais',
    islandId: 'infraestrutura',
    localOffset: SLOTS[5],
    description:
      'Microservidores de espelhamento nas sedes regionais para distribuição local em Wi-Fi.',
    owner: 'Infraestrutura & Campo',
    nextMilestone: 'Ajuste térmico polos · Nov 26',
    dependencies: ['cdn-borda'],
    monthlyProgress: [38, 49, 60, 70, 82, 92, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'atencao',
      'atencao',
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-rp-1', title: '9 de 12 sedes com microservidor operando', done: true, dueLabel: 'Set 26' },
      { id: 'st-rp-2', title: 'Instalação de nobreaks nas 3 sedes do oeste', done: false, dueLabel: 'Nov 26' },
    ],
    recentHistory: [
      { id: 'h-rp-1', date: '12 Out 26', summary: 'Atualização remota de firmware concluída em 9 polos.', author: 'André Tavares' },
    ],
    risks: [
      {
        id: 'r-rp-1',
        title: 'Oscilação elétrica em escolas municipais do interior',
        severity: 'medio',
        mitigation: 'Nobreak dedicado de 4h incluído no kit padrão de cada polo.',
      },
    ],
  },
  {
    id: 'seguranca-lgpd',
    name: 'Segurança & LGPD',
    islandId: 'infraestrutura',
    localOffset: SLOTS[6],
    description:
      'Criptografia, controle de privacidade de menores e backups auditáveis do programa.',
    owner: 'Segurança & Conformidade',
    nextMilestone: 'Auditoria Q4 · Out 26',
    dependencies: [],
    monthlyProgress: [86, 95, 100, 100, 100, 100, 100, 100, 100],
    monthlyStatus: [
      'em_andamento',
      'em_andamento',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
      'concluido',
    ],
    subtasks: [
      { id: 'st-sl-1', title: 'Termos de consentimento para responsáveis', done: true, dueLabel: 'Jul 26' },
      { id: 'st-sl-2', title: 'Testes de invasão e revisão de permissões', done: true, dueLabel: 'Set 26' },
    ],
    recentHistory: [
      { id: 'h-sl-1', date: '06 Out 26', summary: 'Relatório de conformidade LGPD aprovado pela diretoria.', author: 'André Tavares' },
    ],
    risks: [
      {
        id: 'r-sl-1',
        title: 'Exportação manual de planilhas em computadores compartilhados',
        severity: 'baixo',
        mitigation: 'Relatórios anonimizados por padrão fora da secretaria.',
      },
    ],
  },
];

// Keep reference alias for telemetry/SLA dependency target
const MONITORAMENTO_FALLBACK_ID = 'seguranca-lgpd';

export function resolveBlocksAtMonth(monthIndex: number): ResolvedMap3DBlock[] {
  const safeIdx = Math.max(0, Math.min(TIMELINE_MONTHS.length - 1, monthIndex));
  const validIds = new Set(MAPA_3D_BLOCKS.map((b) => b.id));

  return MAPA_3D_BLOCKS.map((block) => {
    const island = ISLAND_BY_ID[block.islandId];
    const resolvedDeps = block.dependencies.map((depId) =>
      validIds.has(depId) ? depId : MONITORAMENTO_FALLBACK_ID
    );
    const uniqueDeps = Array.from(new Set(resolvedDeps)).filter(
      (depId) => depId !== block.id
    );

    return {
      ...block,
      dependencies: uniqueDeps,
      progress: block.monthlyProgress[safeIdx],
      status: block.monthlyStatus[safeIdx],
      worldX: island.center[0] + block.localOffset[0],
      worldZ: island.center[1] + block.localOffset[1],
      islandLabel: island.label,
    };
  });
}

export function getStatusCounts(blocks: ResolvedMap3DBlock[]) {
  let critico = 0;
  let em_andamento = 0;
  let concluido = 0;
  let atencao = 0;

  for (const b of blocks) {
    if (b.status === 'critico') critico += 1;
    else if (b.status === 'em_andamento') em_andamento += 1;
    else if (b.status === 'concluido') concluido += 1;
    else atencao += 1;
  }

  return {
    todos: blocks.length,
    critico,
    em_andamento,
    concluido,
    atencao,
  };
}
