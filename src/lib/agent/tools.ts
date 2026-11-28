import type { FunctionDeclaration } from "@google/genai";
import { z } from "zod";
import { query, queryReadOnly } from "../db";
import { getToolCache, setToolCache } from "./cache";
import { searchKnowledgeBase } from "./rag";

export type LumiUiSection =
  | "painel"
  | "cenarios"
  | "cronograma"
  | "mapa3d"
  | "riscos"
  | "produto"
  | "relatorios";

export type LumiUiAction =
  | { type: "navigate_tab"; section: LumiUiSection }
  | { type: "select_scenario"; scenarioId: string }
  | { type: "approve_scenario"; scenarioId: string }
  | { type: "update_simulator"; adocao?: number; capacidade?: number; reserva?: number }
  | { type: "apply_crashing"; reducoes: Record<string, number> }
  | { type: "reset_crashing" }
  | { type: "focus_mapa3d_block"; blockId: string };

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "consultar_metricas_fluxo_agil",
    description:
      "Consulta indicadores ao vivo de M5 / Fluxo Ágil e DORA (velocidade, MM5, burndown, previsão de releases R1-R3, CFR, Lead Time de mudanças, MTTR, revisão por par, defeitos, impedimentos e os 13 números de controle).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        corte: {
          type: "string",
          enum: ["ATUAL", "2026-11-13", "2026-10-30"],
          description: "Data de corte desejada. Padrão: ATUAL.",
        },
        incluir_serie_sprints: {
          type: "boolean",
          description: "Se true, inclui série histórica S01..Sn e previsão de releases.",
        },
      },
    },
  },
  {
    name: "consultar_evm_custos",
    description:
      "Consulta o Earned Value Management (EVM) calculado dinamicamente no Postgres (ONT, VP, VA, CR, IDP, IDC, ENT típica/atípica/composta, VNT, IDPT, custo real por ponto ágil e gestão) mais resumo de custos realizados por categoria.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        frente: {
          type: "string",
          enum: ["TODAS", "PREDITIVA", "AGIL", "PROJETO", "GESTAO"],
          description: "Filtro por frente. Padrão: TODAS.",
        },
      },
    },
  },
  {
    name: "consultar_riscos_reservas_alcadas",
    description:
      "Consulta reservas de contingência e gerencial (consumo e saldo), VME de ameaças/oportunidades abertas, lista de riscos abertos, solicitações de mudança (SMs), pedidos diretos e matriz de alçadas.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        incluir_lista_sms: {
          type: "boolean",
          description: "Se true, retorna todas as SMs cadastradas com seu status e alçada.",
        },
      },
    },
  },
  {
    name: "consultar_piloto_okrs_cenarios",
    description:
      "Consulta os OKRs (KR1-KR6), funil semanal do piloto (ativos, ativação, retenção 4 semanas, NPS, receita, chamados) e parâmetros dos cenários C1-C6 e caso de negócio base.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        id_cenario: {
          type: "string",
          description: "Opcional: C1, C2, C3, C4, C5 ou C6 para detalhar um cenário específico.",
        },
      },
    },
  },
  {
    name: "consultar_equipe_e_backlog",
    description:
      "Consulta carga de horas, extras, folha e produtividade por pessoa da equipe (P01-P18) e faz drill-down em itens do backlog (por id_item LU-xxx, sprint S01-S14 ou origem PEDIDO_DIRETO/DEFEITO/MUDANCA_APROVADA).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        id_item: { type: "string", description: "Ex.: LU-239, LU-235" },
        id_sprint: { type: "string", description: "Ex.: S14, S13" },
        origem: {
          type: "string",
          enum: ["PLANO_INICIAL", "MUDANCA_APROVADA", "PEDIDO_DIRETO", "DEFEITO"],
        },
        incluir_equipe: {
          type: "boolean",
          description: "Se true, retorna tabela de horas e produtividade da equipe.",
        },
      },
    },
  },
  {
    name: "buscar_documentacao_lume",
    description:
      "Busca semântica (RAG pgvector com gemini-embedding-2) em toda a documentação oficial da Lume Educação: Dossiê, DICIONARIO.md (convenções 1-23), diagnósticos (LE-39, D1, D6, D9, D11, D12, D14, D15, D16, D17, M5, qualidade-dos-dados) e Deck Executivo.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        consulta: {
          type: "string",
          description: "Pergunta ou tópico semântico para buscar nos documentos.",
        },
        limite: {
          type: "integer",
          description: "Quantidade de trechos (1 a 10). Padrão: 5.",
        },
      },
      required: ["consulta"],
    },
  },
  {
    name: "registrar_acao_governanca",
    description:
      "Registra uma deliberação executiva ou plano de mitigação auditável no histórico de governança da Lume.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        tipo_acao: {
          type: "string",
          enum: ["SOLICITACAO_MUDANCA", "AGENDAR_DELIBERACAO", "PLANO_MITIGACAO"],
        },
        titulo: { type: "string", description: "Resumo curto da ação." },
        descricao: { type: "string", description: "Detalhamento completo." },
        impacto_custo_rs: { type: "number", description: "Impacto financeiro estimado em R$." },
        impacto_prazo_du: { type: "integer", description: "Impacto em dias úteis." },
        altera_escopo: { type: "boolean", description: "Se a ação altera escopo aprovado." },
        responsavel: { type: "string", description: "Pessoa ou stakeholder responsável (ex.: P01, PI01)." },
        data_prevista: { type: "string", description: "Data ou prazo previsto (AAAA-MM-DD ou sprint)." },
        referencia: { type: "string", description: "ID relacionado (ex.: C4, R15, LU-239)." },
      },
      required: ["tipo_acao", "titulo", "descricao"],
    },
  },
  {
    name: "abrir_solicitacao_mudanca",
    description:
      "Abre e grava uma Solicitação de Mudança (SM) real no banco oficial do projeto com cálculo automático da alçada decisora (GERENTE, PATROCINADOR ou COMITE).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        descricao: { type: "string", description: "Descrição objetiva da mudança solicitada." },
        tipo_mudanca: {
          type: "string",
          enum: ["ESCOPO", "PRAZO", "CUSTO", "QUALIDADE"],
          description: "Natureza da mudança. Padrão: ESCOPO.",
        },
        frente: {
          type: "string",
          enum: ["PREDITIVA", "AGIL", "PROJETO", "GESTAO"],
          description: "Frente afetada. Padrão: PROJETO.",
        },
        impacto_custo_rs: { type: "number", description: "Impacto financeiro em R$ (0 se nulo)." },
        impacto_prazo_du: { type: "integer", description: "Impacto de prazo em dias úteis." },
        impacto_pontos: { type: "integer", description: "Impacto estimado em story points." },
        altera_escopo: { type: "boolean", description: "Se altera escopo aprovado." },
        id_solicitante: { type: "string", description: "Opcional: código de parte interessada (ex.: PI01..PI12)." },
        id_atividade: { type: "string", description: "Opcional: código da atividade (ex.: A01..A20)." },
      },
      required: ["descricao"],
    },
  },
  {
    name: "gerenciar_risco",
    description:
      "Atualiza o status de um risco existente (ex.: R15 -> ENCERRADO, ABERTO ou OCORRIDO) ou cadastra um novo risco no registro oficial do projeto.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        operacao: {
          type: "string",
          enum: ["atualizar_status", "criar"],
          description: "Escolha 'atualizar_status' para risco existente ou 'criar' para novo risco.",
        },
        id_risco: { type: "string", description: "Obrigatório em 'atualizar_status' (ex.: R15, R01)." },
        status: {
          type: "string",
          enum: ["ABERTO", "ENCERRADO", "OCORRIDO"],
          description: "Novo status do risco.",
        },
        descricao: { type: "string", description: "Obrigatório em 'criar': descrição clara do risco." },
        frente: {
          type: "string",
          enum: ["PREDITIVA", "AGIL", "PROJETO", "GESTAO"],
          description: "Frente relacionada ao risco.",
        },
        categoria: {
          type: "string",
          enum: ["TECNICO", "MERCADO", "FORNECEDOR", "EXTERNO", "GESTAO"],
        },
        probabilidade_pct: { type: "number", description: "Probabilidade de 1 a 100 (%)." },
        impacto_custo_rs: { type: "number", description: "Impacto financeiro em R$." },
        impacto_prazo_du: { type: "integer", description: "Impacto de prazo em dias úteis." },
        estrategia_resposta: {
          type: "string",
          enum: ["MITIGAR", "ACEITAR", "EVITAR", "TRANSFERIR", "EXPLORAR", "MELHORAR"],
        },
        id_responsavel: { type: "string", description: "Opcional: código P01..P18." },
      },
      required: ["operacao"],
    },
  },
  {
    name: "atualizar_okr_piloto",
    description:
      "Atualiza a medição atual de um Resultado-Chave oficial (KR1 a KR6) na base de metas e OKRs do projeto.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        id_resultado_chave: {
          type: "string",
          enum: ["KR1", "KR2", "KR3", "KR4", "KR5", "KR6"],
          description: "Identificador do KR (KR1..KR6).",
        },
        valor: {
          type: "number",
          description: "Novo valor medido na unidade do KR.",
        },
      },
      required: ["id_resultado_chave", "valor"],
    },
  },
  {
    name: "executar_acao_interface",
    description:
      "Executa uma ação imediata na interface aberta pelo usuário no workspace /app: navegar entre abas, selecionar ou aprovar um cenário, ajustar sliders do simulador de premissas, aplicar/resetar Crashing PERT/CPM ou focar um bloco no Mapa 3D.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        acao: {
          type: "string",
          enum: [
            "navegar_aba",
            "selecionar_cenario",
            "aprovar_cenario",
            "ajustar_simulador",
            "aplicar_crashing",
            "resetar_crashing",
            "focar_bloco_3d",
          ],
          description: "Ação de interface a disparar para o usuário.",
        },
        section: {
          type: "string",
          enum: ["painel", "cenarios", "cronograma", "mapa3d", "riscos", "produto", "relatorios"],
          description: "Obrigatório quando acao='navegar_aba'.",
        },
        scenarioId: {
          type: "string",
          description: "Obrigatório em selecionar_cenario ou aprovar_cenario (ex.: C1, C2, C3, C4, C5, C6).",
        },
        adocao: { type: "integer", description: "Slider de adoção escolar (40 a 100%)." },
        capacidade: { type: "integer", description: "Slider de capacidade do time (50 a 100%)." },
        reserva: { type: "integer", description: "Slider de reserva de contingência (5 a 30%)." },
        reducoes_json: {
          type: "string",
          description: "JSON string com reduções de Crashing em dias úteis por ID de atividade, ex.: '{\"A10\": 3, \"A14\": 2}'.",
        },
        blockId: {
          type: "string",
          description: "ID do bloco no Mapa 3D (ex.: 'player-offline', 'simulado-tri', 'videoaulas-banco').",
        },
      },
      required: ["acao"],
    },
  },
  {
    name: "delegate_complex_analysis",
    description:
      "Escalona autonomamente a solicitação para o modelo analítico mais capaz (gemini-3.8-flash) quando você avaliar que a tarefa exige cruzamento complexo multi-frente (ex.: comparar múltiplos cenários C1-C6, cruzar EVM + riscos + alçadas, ou interpretar impacto completo de um Boletim Surpresa).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        pergunta_consolidada: {
          type: "string",
          description: "Síntese clara do problema que exige análise profunda.",
        },
        motivo_escalonamento: {
          type: "string",
          description: "Por que você decidiu acionar o modelo flash.",
        },
        evidencias_coletadas: {
          type: "string",
          description: "Resumo de fatos/números já consultados até o momento, se houver.",
        },
      },
      required: ["pergunta_consolidada", "motivo_escalonamento"],
    },
  },
];

export const ACTION_TOOLS_WITHOUT_DELEGATE: FunctionDeclaration[] =
  TOOL_DECLARATIONS.filter((t) => t.name !== "delegate_complex_analysis");

const actionSchema = z.object({
  tipo_acao: z.enum(["SOLICITACAO_MUDANCA", "AGENDAR_DELIBERACAO", "PLANO_MITIGACAO"]),
  titulo: z.string().min(3),
  descricao: z.string().min(5),
  impacto_custo_rs: z.number().optional(),
  impacto_prazo_du: z.number().int().optional(),
  altera_escopo: z.boolean().optional(),
  responsavel: z.string().optional(),
  data_prevista: z.string().optional(),
  referencia: z.string().optional(),
});

const smSchema = z.object({
  descricao: z.string().trim().min(5).max(500),
  tipo_mudanca: z.enum(["ESCOPO", "PRAZO", "CUSTO", "QUALIDADE"]).default("ESCOPO"),
  frente: z.enum(["PREDITIVA", "AGIL", "PROJETO", "GESTAO"]).default("PROJETO"),
  impacto_custo_rs: z.number().default(0),
  impacto_prazo_du: z.number().int().default(0),
  impacto_pontos: z.number().int().default(0),
  altera_escopo: z.boolean().optional(),
  id_solicitante: z.string().trim().optional(),
  id_atividade: z.string().trim().optional(),
});

const riskToolSchema = z.object({
  operacao: z.enum(["atualizar_status", "criar"]),
  id_risco: z.string().trim().optional(),
  status: z.enum(["ABERTO", "ENCERRADO", "OCORRIDO"]).optional(),
  descricao: z.string().trim().optional(),
  frente: z.enum(["PREDITIVA", "AGIL", "PROJETO", "GESTAO"]).optional(),
  categoria: z.enum(["TECNICO", "MERCADO", "FORNECEDOR", "EXTERNO", "GESTAO"]).optional(),
  probabilidade_pct: z.number().min(1).max(100).optional(),
  impacto_custo_rs: z.number().min(0).optional(),
  impacto_prazo_du: z.number().int().min(0).optional(),
  estrategia_resposta: z
    .enum(["MITIGAR", "ACEITAR", "EVITAR", "TRANSFERIR", "EXPLORAR", "MELHORAR"])
    .optional(),
  id_responsavel: z.string().trim().optional(),
});

const okrToolSchema = z.object({
  id_resultado_chave: z.enum(["KR1", "KR2", "KR3", "KR4", "KR5", "KR6"]),
  valor: z.number(),
});

const uiActionToolSchema = z.object({
  acao: z.enum([
    "navegar_aba",
    "selecionar_cenario",
    "aprovar_cenario",
    "ajustar_simulador",
    "aplicar_crashing",
    "resetar_crashing",
    "focar_bloco_3d",
  ]),
  section: z
    .enum(["painel", "cenarios", "cronograma", "mapa3d", "riscos", "produto", "relatorios"])
    .optional(),
  scenarioId: z.string().trim().optional(),
  adocao: z.number().int().min(40).max(100).optional(),
  capacidade: z.number().int().min(50).max(100).optional(),
  reserva: z.number().int().min(5).max(30).optional(),
  reducoes_json: z.string().optional(),
  blockId: z.string().trim().optional(),
});

export interface ToolExecResult {
  output: Record<string, unknown>;
  cacheHit: boolean;
  ragChunks: number;
  actionCreated: boolean;
  dataMutated?: boolean;
  uiAction?: LumiUiAction;
}

async function computeGovernanceLevel(params: {
  custo: number;
  prazo: number;
  escopo: boolean;
}): Promise<string> {
  const alcadas = await queryReadOnly<{
    nivel_decisor: string;
    limite_custo_rs: number | null;
    limite_prazo_du: number | null;
    pode_alterar_escopo: string;
  }>(
    `SELECT nivel_decisor, limite_custo_rs, limite_prazo_du, pode_alterar_escopo
     FROM lume_educacao.matriz_alcadas`
  );

  const gerente = alcadas.find((a) => a.nivel_decisor === "GERENTE");
  const patroc = alcadas.find((a) => a.nivel_decisor === "PATROCINADOR");

  if (
    gerente &&
    (!params.escopo || gerente.pode_alterar_escopo === "SIM") &&
    (gerente.limite_custo_rs === null || params.custo <= gerente.limite_custo_rs) &&
    (gerente.limite_prazo_du === null || params.prazo <= gerente.limite_prazo_du)
  ) {
    return "GERENTE";
  }

  if (
    patroc &&
    (!params.escopo || patroc.pode_alterar_escopo === "SIM") &&
    (patroc.limite_custo_rs === null || params.custo <= patroc.limite_custo_rs) &&
    (patroc.limite_prazo_du === null || params.prazo <= patroc.limite_prazo_du)
  ) {
    return "PATROCINADOR";
  }

  return "COMITE";
}

export async function executeToolCall(
  name: string,
  rawArgs: Record<string, unknown>,
  ctx: { conversationId: string; dataFingerprint: string }
): Promise<ToolExecResult> {
  if (name === "registrar_acao_governanca") {
    const parsed = actionSchema.parse(rawArgs);
    const governanceLevel = await computeGovernanceLevel({
      custo: parsed.impacto_custo_rs ?? 0,
      prazo: parsed.impacto_prazo_du ?? 0,
      escopo: parsed.altera_escopo ?? false,
    });

    const inserted = await query<{ id: string; created_at: string }>(
      `INSERT INTO lume_agent.agent_actions (conversation_id, action_type, payload, governance_level, status)
       VALUES ($1, $2, $3::jsonb, $4, 'registrada')
       RETURNING id, created_at::text`,
      [ctx.conversationId, parsed.tipo_acao, JSON.stringify(parsed), governanceLevel]
    );

    return {
      output: {
        ok: true,
        action_id: inserted[0]?.id,
        created_at: inserted[0]?.created_at,
        governance_level: governanceLevel,
        nota: "Solicitação registrada com sucesso.",
        payload: parsed,
      },
      cacheHit: false,
      ragChunks: 0,
      actionCreated: true,
      dataMutated: true,
    };
  }

  if (name === "abrir_solicitacao_mudanca") {
    const parsed = smSchema.parse(rawArgs);
    const altersScope = parsed.altera_escopo ?? parsed.tipo_mudanca === "ESCOPO";
    const governanceLevel = await computeGovernanceLevel({
      custo: parsed.impacto_custo_rs,
      prazo: parsed.impacto_prazo_du,
      escopo: altersScope,
    });

    const [maxRow] = await queryReadOnly<{ max_num: number | null }>(
      `SELECT MAX(NULLIF(regexp_replace(id_mudanca, '\\D', '', 'g'), '')::integer) AS max_num
       FROM lume_educacao.mudancas_solicitacoes`
    );
    const nextId = `SM-${String((maxRow?.max_num ?? 14) + 1).padStart(3, "0")}`;

    let validSolicitante: string | null = null;
    if (parsed.id_solicitante) {
      const rows = await queryReadOnly<{ id_parte: string }>(
        `SELECT id_parte FROM lume_educacao.partes_interessadas WHERE UPPER(id_parte) = UPPER($1) LIMIT 1`,
        [parsed.id_solicitante]
      );
      validSolicitante = rows[0]?.id_parte ?? null;
    }

    let validAtividade: string | null = null;
    if (parsed.id_atividade) {
      const rows = await queryReadOnly<{ id_atividade: string }>(
        `SELECT id_atividade FROM lume_educacao.atividades WHERE UPPER(id_atividade) = UPPER($1) LIMIT 1`,
        [parsed.id_atividade]
      );
      validAtividade = rows[0]?.id_atividade ?? null;
    }

    const [inserted] = await query(
      `INSERT INTO lume_educacao.mudancas_solicitacoes (
         id_mudanca, data_abertura, id_solicitante, descricao, tipo_mudanca, frente,
         id_atividade, impacto_custo_rs, impacto_prazo_du, impacto_pontos,
         status, nivel_decisor, implementada
       ) VALUES (
         $1, CURRENT_DATE, $2, $3, $4, $5,
         $6, $7, $8, $9,
         'EM_ANALISE', $10, 'NAO'
       )
       RETURNING *`,
      [
        nextId,
        validSolicitante,
        parsed.descricao,
        parsed.tipo_mudanca,
        parsed.frente,
        validAtividade,
        parsed.impacto_custo_rs,
        parsed.impacto_prazo_du,
        parsed.impacto_pontos,
        governanceLevel,
      ]
    );

    await query(
      `INSERT INTO lume_agent.agent_actions (conversation_id, action_type, payload, governance_level, status)
       VALUES ($1, 'SOLICITACAO_MUDANCA', $2::jsonb, $3, 'registrada')`,
      [ctx.conversationId, JSON.stringify({ id_mudanca: nextId, ...parsed }), governanceLevel]
    );

    return {
      output: {
        ok: true,
        id_mudanca: nextId,
        status: "EM_ANALISE",
        nivel_decisor: governanceLevel,
        registro: inserted,
      },
      cacheHit: false,
      ragChunks: 0,
      actionCreated: true,
      dataMutated: true,
    };
  }

  if (name === "gerenciar_risco") {
    const parsed = riskToolSchema.parse(rawArgs);

    if (parsed.operacao === "atualizar_status") {
      if (!parsed.id_risco || !parsed.status) {
        throw new Error("Para atualizar um risco, informe id_risco e status.");
      }
      const riscoKey = parsed.id_risco.toUpperCase();
      const rows = parsed.estrategia_resposta
        ? await query(
            `UPDATE lume_educacao.riscos_registro
             SET status = $2, estrategia_resposta = $3
             WHERE UPPER(id_risco) = $1
             RETURNING *`,
            [riscoKey, parsed.status, parsed.estrategia_resposta]
          )
        : await query(
            `UPDATE lume_educacao.riscos_registro
             SET status = $2
             WHERE UPPER(id_risco) = $1
             RETURNING *`,
            [riscoKey, parsed.status]
          );

      if (rows.length === 0) {
        throw new Error(`Risco ${riscoKey} não encontrado.`);
      }

      await query(
        `INSERT INTO lume_agent.agent_actions (conversation_id, action_type, payload, governance_level, status)
         VALUES ($1, 'PLANO_MITIGACAO', $2::jsonb, 'GERENTE', 'aplicada')`,
        [ctx.conversationId, JSON.stringify({ operacao: "atualizar_status", id_risco: riscoKey, status: parsed.status })]
      );

      return {
        output: { ok: true, risk: rows[0] },
        cacheHit: false,
        ragChunks: 0,
        actionCreated: true,
        dataMutated: true,
      };
    }

    if (!parsed.descricao) {
      throw new Error("Para criar um risco, informe a descrição.");
    }

    const [maxRow] = await queryReadOnly<{ max_num: number | null }>(
      `SELECT MAX(NULLIF(regexp_replace(id_risco, '\\D', '', 'g'), '')::integer) AS max_num
       FROM lume_educacao.riscos_registro`
    );
    const nextId = `R${String((maxRow?.max_num ?? 15) + 1).padStart(2, "0")}`;

    let validResp: string | null = null;
    if (parsed.id_responsavel) {
      const eq = await queryReadOnly<{ id_pessoa: string }>(
        `SELECT id_pessoa FROM lume_educacao.equipe WHERE UPPER(id_pessoa) = UPPER($1) LIMIT 1`,
        [parsed.id_responsavel]
      );
      validResp = eq[0]?.id_pessoa ?? null;
    }

    const [inserted] = await query(
      `INSERT INTO lume_educacao.riscos_registro (
         id_risco, data_identificacao, tipo_risco, categoria, descricao,
         probabilidade_pct, impacto_custo_rs, impacto_prazo_du, frente,
         estrategia_resposta, id_responsavel, status
       ) VALUES (
         $1, CURRENT_DATE, 'AMEACA', $2, $3,
         $4, $5, $6, $7,
         $8, $9, 'ABERTO'
       )
       RETURNING *`,
      [
        nextId,
        parsed.categoria ?? "TECNICO",
        parsed.descricao,
        Math.round(parsed.probabilidade_pct ?? 40),
        parsed.impacto_custo_rs ?? 12000,
        parsed.impacto_prazo_du ?? 0,
        parsed.frente ?? "PROJETO",
        parsed.estrategia_resposta ?? "MITIGAR",
        validResp,
      ]
    );

    await query(
      `INSERT INTO lume_agent.agent_actions (conversation_id, action_type, payload, governance_level, status)
       VALUES ($1, 'PLANO_MITIGACAO', $2::jsonb, 'GERENTE', 'aplicada')`,
      [ctx.conversationId, JSON.stringify({ ...parsed, id_risco: nextId })]
    );

    return {
      output: { ok: true, id_risco: nextId, risk: inserted },
      cacheHit: false,
      ragChunks: 0,
      actionCreated: true,
      dataMutated: true,
    };
  }

  if (name === "atualizar_okr_piloto") {
    const parsed = okrToolSchema.parse(rawArgs);
    const metaRows = await queryReadOnly<{
      id_objetivo: string;
      objetivo: string;
      id_resultado_chave: string;
      resultado_chave: string;
      unidade: string;
      valor_base: number;
      meta: number;
      sentido: string;
    }>(
      `SELECT id_objetivo, objetivo, id_resultado_chave, resultado_chave,
              unidade, valor_base, meta, sentido
       FROM lume_educacao.okr_medicoes
       WHERE id_resultado_chave = $1
       ORDER BY data_medicao DESC
       LIMIT 1`,
      [parsed.id_resultado_chave]
    );

    const ref = metaRows[0];
    if (!ref) {
      throw new Error(`Resultado-chave ${parsed.id_resultado_chave} não encontrado.`);
    }

    const [updated] = await query(
      `INSERT INTO lume_educacao.okr_medicoes (
         id_objetivo, objetivo, id_resultado_chave, resultado_chave,
         unidade, valor_base, meta, sentido, data_medicao, valor
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9)
       ON CONFLICT (id_resultado_chave, data_medicao)
       DO UPDATE SET valor = EXCLUDED.valor
       RETURNING *`,
      [
        ref.id_objetivo,
        ref.objetivo,
        ref.id_resultado_chave,
        ref.resultado_chave,
        ref.unidade,
        ref.valor_base,
        ref.meta,
        ref.sentido,
        parsed.valor,
      ]
    );

    await query(
      `INSERT INTO lume_agent.agent_actions (conversation_id, action_type, payload, governance_level, status)
       VALUES ($1, 'ATUALIZACAO_OKR', $2::jsonb, 'GERENTE', 'aplicada')`,
      [ctx.conversationId, JSON.stringify(parsed)]
    );

    return {
      output: { ok: true, kr: updated },
      cacheHit: false,
      ragChunks: 0,
      actionCreated: true,
      dataMutated: true,
    };
  }

  if (name === "executar_acao_interface") {
    const parsed = uiActionToolSchema.parse(rawArgs);
    let uiAction: LumiUiAction;

    switch (parsed.acao) {
      case "navegar_aba": {
        if (!parsed.section) {
          throw new Error("Informe 'section' para navegar entre abas.");
        }
        uiAction = { type: "navigate_tab", section: parsed.section };
        break;
      }
      case "selecionar_cenario": {
        if (!parsed.scenarioId) {
          throw new Error("Informe 'scenarioId' para selecionar o cenário.");
        }
        uiAction = { type: "select_scenario", scenarioId: parsed.scenarioId.toUpperCase() };
        break;
      }
      case "aprovar_cenario": {
        if (!parsed.scenarioId) {
          throw new Error("Informe 'scenarioId' para aprovar o cenário.");
        }
        uiAction = { type: "approve_scenario", scenarioId: parsed.scenarioId.toUpperCase() };
        break;
      }
      case "ajustar_simulador": {
        uiAction = {
          type: "update_simulator",
          adocao: parsed.adocao,
          capacidade: parsed.capacidade,
          reserva: parsed.reserva,
        };
        break;
      }
      case "aplicar_crashing": {
        if (!parsed.reducoes_json) {
          throw new Error("Informe 'reducoes_json' (ex.: '{\"A10\": 2}') para aplicar Crashing.");
        }
        const rawMap = JSON.parse(parsed.reducoes_json) as Record<string, unknown>;
        const reducoes: Record<string, number> = {};
        for (const [k, v] of Object.entries(rawMap)) {
          const num = Number(v);
          if (Number.isFinite(num) && num >= 0) {
            reducoes[k.toUpperCase()] = Math.round(num);
          }
        }
        uiAction = { type: "apply_crashing", reducoes };
        break;
      }
      case "resetar_crashing": {
        uiAction = { type: "reset_crashing" };
        break;
      }
      case "focar_bloco_3d": {
        if (!parsed.blockId) {
          throw new Error("Informe 'blockId' para focar no Mapa 3D.");
        }
        uiAction = { type: "focus_mapa3d_block", blockId: parsed.blockId };
        break;
      }
    }

    return {
      output: { ok: true, queued_ui_action: uiAction },
      cacheHit: false,
      ragChunks: 0,
      actionCreated: false,
      dataMutated: false,
      uiAction,
    };
  }

  if (name === "buscar_documentacao_lume") {
    const consulta = String(rawArgs.consulta ?? "");
    const limite = typeof rawArgs.limite === "number" ? rawArgs.limite : 5;
    const rag = await searchKnowledgeBase(consulta, limite, ctx.dataFingerprint);
    return {
      output: {
        total_trechos: rag.hits.length,
        trechos: rag.hits.map((h) => ({
          arquivo: h.source_file,
          secao: h.section_title,
          similaridade: Number(h.similarity.toFixed(3)),
          conteudo: h.content,
        })),
      },
      cacheHit: rag.cacheHit,
      ragChunks: rag.hits.length,
      actionCreated: false,
    };
  }

  const cached = await getToolCache<Record<string, unknown>>(
    name,
    rawArgs,
    ctx.dataFingerprint
  );
  if (cached.hit) {
    return {
      output: cached.payload,
      cacheHit: true,
      ragChunks: 0,
      actionCreated: false,
    };
  }

  let payload: Record<string, unknown> = {};

  switch (name) {
    case "consultar_metricas_fluxo_agil": {
      const corte = String(rawArgs.corte ?? "ATUAL");
      const incluirSerie = Boolean(rawArgs.incluir_serie_sprints ?? true);

      const resumo = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_fluxo_agil_dora WHERE corte_codigo = $1`,
        [corte]
      );
      const controles = await queryReadOnly(
        `SELECT ordem, codigo, metrica, ate_2026_11_13, atual_dinamico, status_13_11 FROM lume_educacao.vw_numeros_controle ORDER BY ordem`
      );
      const dora = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_dora_qualidade WHERE corte_codigo = $1 ORDER BY escopo_ambiente`,
        [corte]
      );

      let sprints: unknown[] = [];
      let releases: unknown[] = [];
      if (incluirSerie) {
        sprints = await queryReadOnly(
          `SELECT id_sprint, numero, dias_uteis, pts_comprometidos, velocidade_pts, taxa_conclusao_pct, velocidade_media_5_ultimas, vazao_itens_por_du, cycle_time_medio_du, lead_time_medio_du, wip_medio_little, wip_diario_medio_observado, aderencia_revisao_par_pct FROM lume_educacao.vw_velocidade_sprints ORDER BY numero`
        );
        releases = await queryReadOnly(
          `SELECT * FROM lume_educacao.vw_previsao_releases WHERE corte_codigo = $1 ORDER BY id_release`,
          [corte]
        );
      }

      payload = {
        fonte: "lume_educacao.vw_fluxo_agil_dora, vw_dora_qualidade, vw_numeros_controle, vw_velocidade_sprints, vw_previsao_releases",
        corte,
        resumo: resumo[0] ?? null,
        dora_por_ambiente: dora,
        controles_13: controles,
        releases,
        sprints,
      };
      break;
    }

    case "consultar_evm_custos": {
      const frente = String(rawArgs.frente ?? "TODAS").toUpperCase();
      const evm =
        frente === "TODAS"
          ? await queryReadOnly(`SELECT * FROM lume_educacao.vw_evm_resumo`)
          : await queryReadOnly(
              `SELECT * FROM lume_educacao.vw_evm_resumo WHERE frente = $1`,
              [frente]
            );
      const categorias = await queryReadOnly(
        `SELECT frente, categoria_custo, COUNT(*)::integer AS qtd, ROUND(SUM(valor_rs)::numeric, 2) AS total_rs
         FROM lume_educacao.custos_realizados
         GROUP BY frente, categoria_custo
         ORDER BY frente, total_rs DESC`
      );
      payload = {
        fonte: "lume_educacao.vw_evm_resumo e custos_realizados",
        evm,
        custos_por_categoria: categorias,
      };
      break;
    }

    case "consultar_riscos_reservas_alcadas": {
      const incluirSms = Boolean(rawArgs.incluir_lista_sms ?? false);
      const [resumo] = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_riscos_reservas_alcadas`
      );
      let mudancas: unknown[] = [];
      if (incluirSms) {
        mudancas = await queryReadOnly(
          `SELECT id_mudanca, data_abertura, id_solicitante, descricao, tipo_mudanca, frente, impacto_custo_rs, impacto_prazo_du, impacto_pontos, status, nivel_decisor, implementada FROM lume_educacao.mudancas_solicitacoes ORDER BY id_mudanca`
        );
      }
      payload = {
        fonte: "lume_educacao.vw_riscos_reservas_alcadas e mudancas_solicitacoes",
        resumo: resumo ?? null,
        mudancas_solicitacoes: mudancas,
      };
      break;
    }

    case "consultar_piloto_okrs_cenarios": {
      const idCenario = rawArgs.id_cenario ? String(rawArgs.id_cenario).toUpperCase() : null;
      const okrs = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_piloto_okrs_resumo`
      );
      const funilRecente = await queryReadOnly(
        `SELECT semana_inicio, alcance, cadastros, ativados, ativos_na_semana, retidos_4_semanas, receita_rs, nps, chamados_suporte
         FROM lume_educacao.funil_piloto_semanal
         ORDER BY semana_inicio DESC
         LIMIT 6`
      );
      const cenarios = idCenario
        ? await queryReadOnly(
            `SELECT * FROM lume_educacao.vw_cenarios_base WHERE id_cenario = $1`,
            [idCenario]
          )
        : await queryReadOnly(`SELECT * FROM lume_educacao.vw_cenarios_base ORDER BY id_cenario`);

      payload = {
        fonte: "lume_educacao.vw_piloto_okrs_resumo, funil_piloto_semanal e vw_cenarios_base",
        okrs_e_ultimo_funil: okrs,
        funil_ultimas_6_semanas: funilRecente,
        cenarios,
      };
      break;
    }

    case "consultar_equipe_e_backlog": {
      const idItem = rawArgs.id_item ? String(rawArgs.id_item).toUpperCase() : null;
      const idSprint = rawArgs.id_sprint ? String(rawArgs.id_sprint).toUpperCase() : null;
      const origem = rawArgs.origem ? String(rawArgs.origem).toUpperCase() : null;
      const incluirEquipe = rawArgs.incluir_equipe !== false;

      let equipe: unknown[] = [];
      if (incluirEquipe) {
        equipe = await queryReadOnly(
          `SELECT * FROM lume_educacao.vw_equipe_produtividade ORDER BY id_pessoa`
        );
      }

      const conditions: string[] = [];
      const params: unknown[] = [];
      if (idItem) {
        params.push(idItem);
        conditions.push(`id_item = $${params.length}`);
      }
      if (idSprint) {
        params.push(idSprint);
        conditions.push(`(id_sprint_atual = $${params.length} OR id_sprint_conclusao = $${params.length})`);
      }
      if (origem) {
        params.push(origem);
        conditions.push(`origem = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const itens = await queryReadOnly(
        `SELECT id_item, id_epico, tipo_item, titulo, pontos, prioridade_moscow, id_release, origem, status, id_sprint_atual, id_sprint_conclusao, id_responsavel, revisao_por_par, cycle_time_du, lead_time_du, reprovacoes_teste, qtd_impedimentos, defeitos_originados
         FROM lume_educacao.vw_lead_cycle_time_itens
         ${whereClause}
         ORDER BY data_criacao DESC
         LIMIT 35`,
        params
      );

      payload = {
        fonte: "lume_educacao.vw_equipe_produtividade e vw_lead_cycle_time_itens",
        equipe,
        itens_backlog: itens,
      };
      break;
    }

    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }

  await setToolCache(name, rawArgs, ctx.dataFingerprint, payload);

  return {
    output: payload,
    cacheHit: false,
    ragChunks: 0,
    actionCreated: false,
  };
}
