// ============================================================================
// Ticket 3.3 — Configuracao e Validacao CRUD dos Boletins (B1-B10) + Surpresa
// Projeto: Lume Educacao (Next.js App Router + Supabase / schema lume_educacao)
// ============================================================================

export const SUPABASE_TABLES = {
  backlog_itens: 'backlog_itens',
  avanco_semanal: 'avanco_semanal',
  apontamento_horas: 'apontamento_horas',
  custos_realizados: 'custos_realizados',
  sprint_itens: 'sprint_itens',
  itens_transicoes: 'itens_transicoes',
  impedimentos: 'impedimentos',
  implantacoes: 'implantacoes',
  defeitos: 'defeitos',
  inspecoes_aceite: 'inspecoes_aceite',
  riscos_ocorrencias: 'riscos_ocorrencias',
  mudancas_solicitacoes: 'mudancas_solicitacoes',
  contratos_medicoes: 'contratos_medicoes',
  reunioes: 'reunioes',
  engajamento_mensal: 'engajamento_mensal',
  pulso_equipe: 'pulso_equipe',
  okr_medicoes: 'okr_medicoes',
  funil_piloto_semanal: 'funil_piloto_semanal',
  producao_semanal: 'producao_semanal',
} as const;

export type TableKey = keyof typeof SUPABASE_TABLES;

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  defaultValue?: string | number;
}

export interface BoletimDef {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  tableKey: TableKey;
  pkColumns: string[];
  orderBy?: string;
  fields: FieldDef[];
}

export const BOLETINS_CONFIG: BoletimDef[] = [
  {
    id: 'b1_avanco',
    codigo: 'B1',
    titulo: 'Avanço Físico Semanal (Frente Preditiva)',
    descricao: 'Atualiza percentual concluído, datas reais e status das atividades (tabela 17).',
    tableKey: 'avanco_semanal',
    pkColumns: ['semana_fim', 'id_atividade'],
    orderBy: 'semana_fim',
    fields: [
      { name: 'semana_fim', label: 'Semana até', type: 'date', required: true, defaultValue: '2026-11-13' },
      { name: 'id_atividade', label: 'Atividade (ID)', type: 'text', required: true, placeholder: 'Ex: A18, A19, A27' },
      { name: 'avanco_acumulado_pct', label: 'Avanço Acumulado (%)', type: 'number', required: true, min: 0, max: 100 },
      { name: 'situacao', label: 'Situação', type: 'select', required: true, options: ['EM_ANDAMENTO', 'CONCLUIDA'] },
      { name: 'data_inicio_real', label: 'Início Real', type: 'date' },
      { name: 'data_termino_real', label: 'Término Real (se 100%)', type: 'date' },
      { name: 'id_responsavel', label: 'Responsável (ID)', type: 'text', required: true, placeholder: 'Ex: P07, P09' },
    ],
  },
  {
    id: 'b2_horas',
    codigo: 'B2',
    titulo: 'Apontamento de Horas Semanais',
    descricao: 'Lançamento de horas normais e extras por pessoa e atividade/sprint (tabela 18).',
    tableKey: 'apontamento_horas',
    pkColumns: ['semana_inicio', 'id_pessoa', 'tipo_item', 'id_item'],
    orderBy: 'semana_inicio',
    fields: [
      { name: 'semana_inicio', label: 'Semana de', type: 'date', required: true, defaultValue: '2026-11-09' },
      { name: 'id_pessoa', label: 'Pessoa (ID)', type: 'text', required: true, placeholder: 'Ex: P01, P07, P15' },
      { name: 'tipo_item', label: 'Tipo', type: 'select', required: true, options: ['ATIVIDADE', 'SPRINT', 'GESTAO'] },
      { name: 'id_item', label: 'Item (Atividade/Sprint)', type: 'text', required: true, placeholder: 'Ex: A18, S14, GESTAO' },
      { name: 'horas_normais', label: 'Horas Normais', type: 'number', required: true, min: 0, max: 60, step: '0.5' },
      { name: 'horas_extras', label: 'Horas Extras (1,5x)', type: 'number', required: true, min: 0, max: 40, step: '0.5', defaultValue: 0 },
    ],
  },
  {
    id: 'b3_custos',
    codigo: 'B3',
    titulo: 'Custos Pagos (Notas e Medições)',
    descricao: 'Desembolsos das frentes Preditiva, Ágil e Gestão (tabela 19).',
    tableKey: 'custos_realizados',
    pkColumns: ['id_lancamento'],
    orderBy: 'data',
    fields: [
      { name: 'id_lancamento', label: 'ID Lançamento', type: 'text', required: true, placeholder: 'Ex: L00119' },
      { name: 'data', label: 'Data', type: 'date', required: true, defaultValue: '2026-11-10' },
      { name: 'frente', label: 'Frente', type: 'select', required: true, options: ['PREDITIVA', 'AGIL', 'GESTAO'] },
      {
        name: 'categoria_custo',
        label: 'Categoria',
        type: 'select',
        required: true,
        options: ['SERVICO_CONTRATADO', 'EQUIPAMENTO', 'MATERIAL', 'LICENCAS_E_NUVEM', 'OUTROS', 'INDIRETO'],
      },
      { name: 'id_atividade', label: 'Atividade (se Preditiva)', type: 'text', placeholder: 'Ex: A18, A19' },
      { name: 'codigo_eap', label: 'Código EAP', type: 'text', placeholder: 'Ex: 1.3.2' },
      { name: 'id_contrato', label: 'Contrato', type: 'text', placeholder: 'Ex: CT02, CT06' },
      { name: 'id_fornecedor', label: 'Fornecedor', type: 'text', placeholder: 'Ex: F02, F06' },
      { name: 'documento', label: 'Documento (NF/MED)', type: 'text', required: true, placeholder: 'Ex: MED-CT06-04' },
      { name: 'descricao', label: 'Histórico / Descrição', type: 'text', required: true },
      { name: 'valor_rs', label: 'Valor (R$)', type: 'number', required: true, min: 0.01, step: '0.01' },
    ],
  },
  {
    id: 'b3_medicoes',
    codigo: 'B3b',
    titulo: 'Medições de Contrato Aceitas',
    descricao: 'Marcos de pagamento e aceite de fornecedores (tabela 31).',
    tableKey: 'contratos_medicoes',
    pkColumns: ['id_medicao'],
    orderBy: 'data_real',
    fields: [
      { name: 'id_medicao', label: 'ID Medição', type: 'text', required: true, placeholder: 'Ex: MED-CT06-04' },
      { name: 'id_contrato', label: 'Contrato', type: 'text', required: true, placeholder: 'Ex: CT06' },
      { name: 'id_atividade', label: 'Atividade', type: 'text', required: true, placeholder: 'Ex: A18' },
      { name: 'descricao_marco', label: 'Descrição', type: 'text', required: true },
      { name: 'data_prevista', label: 'Data Prevista', type: 'date', required: true },
      { name: 'valor_previsto_rs', label: 'Valor Previsto (R$)', type: 'number', required: true, step: '0.01' },
      { name: 'data_real', label: 'Data Real', type: 'date' },
      { name: 'valor_pago_rs', label: 'Valor Pago (R$)', type: 'number', step: '0.01' },
      { name: 'aceite', label: 'Aceite', type: 'select', required: true, options: ['APROVADO', 'APROVADO_COM_RESSALVA', 'PENDENTE'] },
      { name: 'nao_conformidades', label: 'Não Conformidades (NC)', type: 'number', required: true, min: 0, defaultValue: 0 },
    ],
  },
  {
    id: 'b4_inspecoes',
    codigo: 'B4',
    titulo: 'Inspeções e Testes de Aceite',
    descricao: 'Qualidade, não conformidades e custo de retrabalho (tabela 25).',
    tableKey: 'inspecoes_aceite',
    pkColumns: ['id_inspecao'],
    orderBy: 'data',
    fields: [
      { name: 'id_inspecao', label: 'ID Inspeção', type: 'text', required: true, placeholder: 'Ex: INS-025' },
      { name: 'data', label: 'Data', type: 'date', required: true, defaultValue: '2026-11-11' },
      { name: 'id_atividade', label: 'Atividade', type: 'text', required: true, placeholder: 'Ex: A18, A27' },
      {
        name: 'tipo_inspecao',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: ['LISTA_DE_VERIFICACAO', 'AUDITORIA_DOCUMENTAL', 'FAT', 'SAT', 'TESTE_A_FRIO', 'INSPECAO_DE_RECEBIMENTO', 'HOMOLOGACAO', 'TESTE_DE_ACEITACAO_DO_USUARIO'],
      },
      { name: 'itens_verificados', label: 'Itens Verificados', type: 'number', required: true, min: 1 },
      { name: 'itens_nao_conformes', label: 'Não Conformes', type: 'number', required: true, min: 0, defaultValue: 0 },
      { name: 'resultado', label: 'Resultado', type: 'select', required: true, options: ['APROVADO', 'APROVADO_COM_RESSALVA', 'REPROVADO'] },
      { name: 'id_fornecedor', label: 'Fornecedor (vazio = própria)', type: 'text', placeholder: 'Ex: F06' },
      { name: 'horas_retrabalho', label: 'Retrabalho (h)', type: 'number', required: true, min: 0, step: '0.1', defaultValue: 0 },
      { name: 'custo_retrabalho_rs', label: 'Custo Retrabalho (R$)', type: 'number', required: true, min: 0, step: '0.01', defaultValue: 0 },
    ],
  },
  {
    id: 'b5_backlog',
    codigo: 'B5a',
    titulo: 'Novos Itens no Backlog (Histórias / Bugs)',
    descricao: 'Cadastro de itens criados na quinzena ou por mudança/pedido direto (tabela 14).',
    tableKey: 'backlog_itens',
    pkColumns: ['id_item'],
    orderBy: 'data_criacao',
    fields: [
      { name: 'id_item', label: 'ID Item', type: 'text', required: true, placeholder: 'Ex: LU-235' },
      { name: 'id_epico', label: 'Épico', type: 'text', required: true, placeholder: 'Ex: EP01..EP08' },
      { name: 'tipo_item', label: 'Tipo', type: 'select', required: true, options: ['HISTORIA', 'TECNICA', 'SPIKE', 'BUG'] },
      { name: 'titulo', label: 'Título', type: 'text', required: true },
      { name: 'pontos', label: 'Story Points', type: 'select', required: true, options: ['1', '2', '3', '5', '8', '13'] },
      { name: 'prioridade_moscow', label: 'Prioridade', type: 'select', required: true, options: ['MUST', 'SHOULD', 'COULD', 'WONT'] },
      { name: 'id_release', label: 'Release', type: 'select', required: true, options: ['R1', 'R2', 'R3'] },
      { name: 'origem', label: 'Origem', type: 'select', required: true, options: ['PLANO_INICIAL', 'MUDANCA_APROVADA', 'PEDIDO_DIRETO', 'DEFEITO'] },
      { name: 'id_solicitante', label: 'Solicitante (PI)', type: 'text', placeholder: 'Ex: PI02' },
      { name: 'data_criacao', label: 'Data Criação', type: 'date', required: true, defaultValue: '2026-11-03' },
      { name: 'status', label: 'Status Atual', type: 'select', required: true, options: ['A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'EM_TESTE', 'CONCLUIDO'] },
      { name: 'id_sprint_atual', label: 'Sprint Atual', type: 'text', placeholder: 'Ex: S14' },
    ],
  },
  {
    id: 'b5_sprint',
    codigo: 'B5b',
    titulo: 'Alocação na Sprint (S14 / Atual)',
    descricao: 'Vincula itens planejados, transbordados ou adicionados na sprint (tabela 20).',
    tableKey: 'sprint_itens',
    pkColumns: ['id_sprint', 'id_item'],
    orderBy: 'id_sprint',
    fields: [
      { name: 'id_sprint', label: 'Sprint', type: 'text', required: true, defaultValue: 'S14' },
      { name: 'id_item', label: 'ID Item', type: 'text', required: true, placeholder: 'Ex: LU-152' },
      { name: 'pontos', label: 'Pontos', type: 'number', required: true, min: 1, max: 13 },
      { name: 'origem_na_sprint', label: 'Entrada na Sprint', type: 'select', required: true, options: ['PLANEJAMENTO', 'TRANSBORDO', 'ADICIONADO_DURANTE'] },
      { name: 'concluido_na_sprint', label: 'Concluído? (1=Sim, 0=Não)', type: 'select', required: true, options: ['0', '1'] },
    ],
  },
  {
    id: 'b5_defeitos',
    codigo: 'B5c',
    titulo: 'Defeitos Registrados (DF-xxx)',
    descricao: 'Registra bugs vinculados ao item de origem e ambiente detectado (tabela 24).',
    tableKey: 'defeitos',
    pkColumns: ['id_defeito'],
    orderBy: 'data_abertura',
    fields: [
      { name: 'id_defeito', label: 'ID Defeito', type: 'text', required: true, placeholder: 'Ex: DF-033' },
      { name: 'id_item_defeito', label: 'Item BUG', type: 'text', required: true, placeholder: 'Ex: LU-236' },
      { name: 'id_item_origem', label: 'Item de Origem', type: 'text', required: true, placeholder: 'Ex: LU-148' },
      { name: 'severidade', label: 'Severidade', type: 'select', required: true, options: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] },
      { name: 'ambiente_detectado', label: 'Ambiente', type: 'select', required: true, options: ['TESTE', 'HOMOLOGACAO', 'PRODUCAO'] },
      { name: 'data_abertura', label: 'Data Abertura', type: 'date', required: true, defaultValue: '2026-11-03' },
      { name: 'data_resolucao', label: 'Data Resolução (vazio = aberto)', type: 'date' },
    ],
  },
  {
    id: 'b6_transicoes',
    codigo: 'B6',
    titulo: 'Movimentos do Quadro (Transições)',
    descricao: 'Move cartões entre colunas e atualiza o status no backlog automaticamente (tabela 21).',
    tableKey: 'itens_transicoes',
    pkColumns: ['id_transicao'],
    orderBy: 'data',
    fields: [
      { name: 'id_transicao', label: 'ID Transição', type: 'text', required: true, placeholder: 'Ex: TR-0425' },
      { name: 'id_item', label: 'ID Item', type: 'text', required: true, placeholder: 'Ex: LU-235' },
      { name: 'data', label: 'Data', type: 'date', required: true, defaultValue: '2026-11-13' },
      { name: 'status_origem', label: 'De (Origem)', type: 'select', required: true, options: ['A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'EM_TESTE'] },
      { name: 'status_destino', label: 'Para (Destino)', type: 'select', required: true, options: ['EM_ANDAMENTO', 'EM_REVISAO', 'EM_TESTE', 'CONCLUIDO'] },
      { name: 'id_pessoa', label: 'Quem Moveu (ID)', type: 'text', required: true, placeholder: 'Ex: P15, P16, P17, P18' },
    ],
  },
  {
    id: 'b7_impedimentos',
    codigo: 'B7a',
    titulo: 'Impedimentos (Abrir / Fechar)',
    descricao: 'Bloqueios de fluxo por dependência externa ou ambiente (tabela 22).',
    tableKey: 'impedimentos',
    pkColumns: ['id_impedimento'],
    orderBy: 'data_abertura',
    fields: [
      { name: 'id_impedimento', label: 'ID Impedimento', type: 'text', required: true, placeholder: 'Ex: IP-011' },
      { name: 'id_item', label: 'ID Item', type: 'text', required: true, placeholder: 'Ex: LU-155' },
      { name: 'data_abertura', label: 'Abertura', type: 'date', required: true, defaultValue: '2026-11-04' },
      { name: 'data_fechamento', label: 'Fechamento', type: 'date' },
      {
        name: 'tipo_impedimento',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: ['DEPENDENCIA_EXTERNA', 'DEFINICAO_PENDENTE', 'AMBIENTE_INDISPONIVEL', 'AGUARDANDO_OUTRO_TIME'],
      },
      { name: 'dias_uteis_bloqueado', label: 'Dias Úteis Bloqueado', type: 'number', min: 0 },
      { name: 'id_pessoa', label: 'Registrado por (ID)', type: 'text', required: true, placeholder: 'Ex: P16, P18' },
    ],
  },
  {
    id: 'b7_implantacoes',
    codigo: 'B7b',
    titulo: 'Implantações (Métricas DORA)',
    descricao: 'Publicações em homologação/produção, lead time, falha e MTTR (tabela 23).',
    tableKey: 'implantacoes',
    pkColumns: ['id_implantacao'],
    orderBy: 'data',
    fields: [
      { name: 'id_implantacao', label: 'ID Implantação', type: 'text', required: true, placeholder: 'Ex: IMP-051' },
      { name: 'data', label: 'Data', type: 'date', required: true, defaultValue: '2026-11-12' },
      { name: 'id_sprint', label: 'Sprint', type: 'text', required: true, defaultValue: 'S14' },
      { name: 'ambiente', label: 'Ambiente', type: 'select', required: true, options: ['HOMOLOGACAO', 'PRODUCAO'] },
      { name: 'versao', label: 'Versão', type: 'text', required: true, placeholder: 'Ex: 1.55' },
      { name: 'itens_implantados', label: 'Qtd Itens', type: 'number', required: true, min: 1 },
      { name: 'tempo_ate_producao_h', label: 'Tempo até Publicação (h)', type: 'number', required: true, min: 0, step: '0.1' },
      { name: 'falhou', label: 'Falhou? (1=Sim, 0=Não)', type: 'select', required: true, options: ['0', '1'] },
      { name: 'tempo_restauracao_h', label: 'Restauração / MTTR (h)', type: 'number', min: 0, step: '0.1' },
    ],
  },
  {
    id: 'b8_riscos',
    codigo: 'B8a',
    titulo: 'Ocorrências de Risco / Atraso',
    descricao: 'Materialização de riscos ou atrasos comunicados (tabela 27).',
    tableKey: 'riscos_ocorrencias',
    pkColumns: ['id_ocorrencia'],
    orderBy: 'data',
    fields: [
      { name: 'id_ocorrencia', label: 'ID Ocorrência', type: 'text', required: true, placeholder: 'Ex: OC-010' },
      { name: 'data', label: 'Data', type: 'date', required: true, defaultValue: '2026-11-25' },
      { name: 'id_risco', label: 'ID Risco (vazio = não previsto)', type: 'text', placeholder: 'Ex: R05, R07' },
      { name: 'descricao', label: 'Descrição do Atraso / Ocorrência', type: 'text', required: true },
      { name: 'frente', label: 'Frente', type: 'select', required: true, options: ['PREDITIVA', 'AGIL'] },
      { name: 'id_atividade', label: 'Atividade Impactada', type: 'text', required: true, placeholder: 'Ex: A19, A32' },
      { name: 'impacto_custo_real_rs', label: 'Impacto Custo Real (R$)', type: 'number', required: true, min: 0, step: '0.01', defaultValue: 0 },
      { name: 'impacto_prazo_real_du', label: 'Impacto Prazo (du)', type: 'number', required: true, min: 0, defaultValue: 0 },
      { name: 'custo_ja_incluido_em_pagamentos', label: 'Custo já pago em medição?', type: 'select', required: true, options: ['NAO', 'SIM'] },
    ],
  },
  {
    id: 'b8_mudancas',
    codigo: 'B8b',
    titulo: 'Solicitações de Mudança (SM-xxx)',
    descricao: 'Controle integrado de mudanças com alçada e impactos (tabela 28).',
    tableKey: 'mudancas_solicitacoes',
    pkColumns: ['id_mudanca'],
    orderBy: 'data_abertura',
    fields: [
      { name: 'id_mudanca', label: 'ID Mudança', type: 'text', required: true, placeholder: 'Ex: SM-012' },
      { name: 'data_abertura', label: 'Data Abertura', type: 'date', required: true, defaultValue: '2026-11-25' },
      { name: 'id_solicitante', label: 'Solicitante (PI)', type: 'text', required: true, placeholder: 'Ex: PI01, PI02' },
      { name: 'descricao', label: 'Descrição da Mudança', type: 'text', required: true },
      { name: 'tipo_mudanca', label: 'Tipo', type: 'select', required: true, options: ['ESCOPO', 'PRAZO', 'TECNICA'] },
      { name: 'frente', label: 'Frente', type: 'select', required: true, options: ['PREDITIVA', 'AGIL'] },
      { name: 'id_atividade', label: 'Atividade (se Preditiva)', type: 'text', placeholder: 'Ex: A35' },
      { name: 'impacto_custo_rs', label: 'Impacto Custo (R$)', type: 'number', required: true, step: '0.01', defaultValue: 0 },
      { name: 'impacto_prazo_du', label: 'Impacto Prazo (du)', type: 'number', required: true, defaultValue: 0 },
      { name: 'impacto_pontos', label: 'Impacto Pontos (Ágil)', type: 'number', required: true, defaultValue: 0 },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ['EM_ANALISE', 'APROVADA', 'REJEITADA'] },
      { name: 'data_decisao', label: 'Data Decisão', type: 'date' },
      { name: 'nivel_decisor', label: 'Alçada Decisora', type: 'select', required: true, options: ['GERENTE', 'PATROCINADOR', 'COMITE'] },
      { name: 'implementada', label: 'Implementada?', type: 'select', options: ['', 'SIM', 'NAO'] },
    ],
  },
  {
    id: 'b9_reunioes',
    codigo: 'B9a',
    titulo: 'Reuniões de Governança e Cerimônias',
    descricao: 'Presença, patrocínio, decisões e pendências (tabela 33).',
    tableKey: 'reunioes',
    pkColumns: ['id_reuniao'],
    orderBy: 'data',
    fields: [
      { name: 'id_reuniao', label: 'ID Reunião', type: 'text', required: true, placeholder: 'Ex: RE-081' },
      { name: 'data', label: 'Data', type: 'date', required: true, defaultValue: '2026-11-12' },
      {
        name: 'tipo_reuniao',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: ['STATUS_SEMANAL', 'COMITE_DIRETOR', 'PLANEJAMENTO_DA_SPRINT', 'REVISAO_DA_SPRINT', 'RETROSPECTIVA'],
      },
      { name: 'duracao_min', label: 'Duração (min)', type: 'number', required: true, min: 15 },
      { name: 'convidados', label: 'Convidados', type: 'number', required: true, min: 1 },
      { name: 'presentes', label: 'Presentes', type: 'number', required: true, min: 0 },
      { name: 'patrocinador_presente', label: 'Patrocinador Presente? (1/0)', type: 'select', required: true, options: ['0', '1'] },
      { name: 'decisoes_tomadas', label: 'Decisões', type: 'number', required: true, min: 0 },
      { name: 'pendencias_abertas', label: 'Pendências', type: 'number', required: true, min: 0 },
      { name: 'ata_publicada', label: 'Ata Publicada? (1/0)', type: 'select', required: true, options: ['1', '0'] },
    ],
  },
  {
    id: 'b9_engajamento',
    codigo: 'B9b',
    titulo: 'Engajamento das Partes Interessadas',
    descricao: 'Avaliação mensal de nível de apoio e satisfação (tabela 34).',
    tableKey: 'engajamento_mensal',
    pkColumns: ['mes', 'id_parte'],
    orderBy: 'mes',
    fields: [
      { name: 'mes', label: 'Mês (1º dia)', type: 'date', required: true, defaultValue: '2026-11-01' },
      { name: 'id_parte', label: 'Parte (PI01..PI13)', type: 'text', required: true, placeholder: 'Ex: PI01, PI02' },
      { name: 'nivel_engajamento', label: 'Nível', type: 'select', required: true, options: ['DESCONHECE', 'RESISTENTE', 'NEUTRO', 'APOIA', 'LIDERA'] },
      { name: 'satisfacao', label: 'Satisfação (0 a 10)', type: 'number', required: true, min: 0, max: 10, step: '0.1' },
      { name: 'interacoes_no_mes', label: 'Interações', type: 'number', required: true, min: 0 },
    ],
  },
  {
    id: 'b9_pulso',
    codigo: 'B9c',
    titulo: 'Pulso da Equipe na Retrospectiva',
    descricao: 'Satisfação média da squad na sprint (tabela 35).',
    tableKey: 'pulso_equipe',
    pkColumns: ['id_sprint'],
    orderBy: 'id_sprint',
    fields: [
      { name: 'id_sprint', label: 'Sprint', type: 'text', required: true, defaultValue: 'S14' },
      { name: 'satisfacao_media', label: 'Satisfação Média (1 a 5)', type: 'number', required: true, min: 1, max: 5, step: '0.01' },
      { name: 'respostas', label: 'Qtd Respostas', type: 'number', required: true, min: 1 },
    ],
  },
  {
    id: 'b9_okr',
    codigo: 'B9d',
    titulo: 'Medições de OKRs (O1 / O2)',
    descricao: 'Resultados-chave KR1 a KR6 medidos na quinzena (tabela 36).',
    tableKey: 'okr_medicoes',
    pkColumns: ['id_resultado_chave', 'data_medicao'],
    orderBy: 'data_medicao',
    fields: [
      { name: 'id_objetivo', label: 'Objetivo', type: 'select', required: true, options: ['O1', 'O2'] },
      { name: 'id_resultado_chave', label: 'KR', type: 'select', required: true, options: ['KR1', 'KR2', 'KR3', 'KR4', 'KR5', 'KR6'] },
      { name: 'data_medicao', label: 'Data Medição', type: 'date', required: true, defaultValue: '2026-11-13' },
      { name: 'valor', label: 'Valor Medido', type: 'number', required: true, step: '0.1' },
      { name: 'unidade', label: 'Unidade', type: 'text', placeholder: 'usuários / pontos / % / chamados' },
      { name: 'sentido', label: 'Sentido', type: 'select', required: true, options: ['MAIOR_MELHOR', 'MENOR_MELHOR'] },
    ],
  },
  {
    id: 'b10_producao',
    codigo: 'B10a',
    titulo: 'Produção Semanal das Equipes',
    descricao: 'Quantidade executada, homens-hora e efetivo médio (tabela 42).',
    tableKey: 'producao_semanal',
    pkColumns: ['semana_fim', 'id_atividade'],
    orderBy: 'semana_fim',
    fields: [
      { name: 'semana_fim', label: 'Semana até', type: 'date', required: true, defaultValue: '2026-11-06' },
      { name: 'id_atividade', label: 'Atividade', type: 'text', required: true, placeholder: 'Ex: A18' },
      { name: 'quantidade_executada', label: 'Quantidade Executada', type: 'number', required: true, min: 0, step: '0.1' },
      { name: 'hh_trabalhadas', label: 'Homens-Hora (Hh)', type: 'number', required: true, min: 1 },
      { name: 'efetivo_medio', label: 'Efetivo Médio', type: 'number', required: true, min: 0.1, step: '0.1' },
    ],
  },
  {
    id: 'b10_funil',
    codigo: 'B10b',
    titulo: 'Funil Semanal do Piloto',
    descricao: 'Aquisição, ativação, retenção, receita, NPS e chamados (tabela 37).',
    tableKey: 'funil_piloto_semanal',
    pkColumns: ['semana_inicio'],
    orderBy: 'semana_inicio',
    fields: [
      { name: 'semana_inicio', label: 'Semana de', type: 'date', required: true, defaultValue: '2026-11-09' },
      { name: 'alcance', label: 'Alcance', type: 'number', required: true, min: 0 },
      { name: 'cadastros', label: 'Cadastros', type: 'number', required: true, min: 0 },
      { name: 'ativados', label: 'Ativados', type: 'number', required: true, min: 0 },
      { name: 'ativos_na_semana', label: 'Ativos na Semana', type: 'number', required: true, min: 0 },
      { name: 'retidos_4_semanas', label: 'Retidos 4 Semanas', type: 'number', required: true, min: 0 },
      { name: 'receita_rs', label: 'Receita (R$)', type: 'number', required: true, min: 0, step: '0.01' },
      { name: 'indicacoes', label: 'Indicações', type: 'number', required: true, min: 0 },
      { name: 'nps', label: 'NPS (-100 a 100)', type: 'number', required: true, min: -100, max: 100 },
      { name: 'chamados_suporte', label: 'Chamados Suporte', type: 'number', required: true, min: 0 },
    ],
  },
];

export function getBoletimById(id: string): BoletimDef | undefined {
  return BOLETINS_CONFIG.find((b) => b.id === id);
}

export function validateBoletimPayload(boletim: BoletimDef, raw: Record<string, unknown>) {
  const errors: string[] = [];
  const clean: Record<string, unknown> = {};

  for (const field of boletim.fields) {
    const val = raw[field.name];
    const isEmpty = val === undefined || val === null || String(val).trim() === '';

    if (isEmpty) {
      if (field.required) {
        errors.push(`O campo "${field.label}" é obrigatório.`);
      } else {
        clean[field.name] = null;
      }
      continue;
    }

    if (field.type === 'number') {
      const num = Number(val);
      if (Number.isNaN(num)) {
        errors.push(`"${field.label}" deve ser um número válido.`);
        continue;
      }
      if (field.min !== undefined && num < field.min) {
        errors.push(`"${field.label}" não pode ser menor que ${field.min}.`);
      }
      if (field.max !== undefined && num > field.max) {
        errors.push(`"${field.label}" não pode ser maior que ${field.max}.`);
      }
      clean[field.name] = num;
    } else if (field.type === 'select') {
      const str = String(val).trim();
      if (field.options && !field.options.includes(str)) {
        errors.push(`Valor inválido para "${field.label}": ${str}.`);
        continue;
      }
      clean[field.name] = /^\d+$/.test(str) ? Number(str) : str;
    } else {
      clean[field.name] = String(val).trim();
    }
  }

  if (boletim.id === 'b1_avanco' && Number(clean.avanco_acumulado_pct) === 100) {
    clean.situacao = 'CONCLUIDA';
  }
  if (boletim.id === 'b6_transicoes' && clean.status_origem === clean.status_destino) {
    errors.push('O status de destino precisa ser diferente do status de origem.');
  }

  return { valid: errors.length === 0, errors, clean };
}
